import {
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
	UnprocessableEntityException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomBytes } from "crypto";
import { Configs } from "src/app.constants";
import * as Twilio from "twilio";
import { FindOptionsWhere, Repository } from "typeorm";
import { EmailValidateRequestDto } from "../Dto/EmailValidate.request.dto";
import { LoginRequestDto } from "../Dto/Login.request.dto";
import { OtpSendRequestDto } from "../Dto/OtpSend.request.dto";
import { OtpVerifyRequestDto } from "../Dto/OtpVerify.request.dto";
import { SignUpRequestDto } from "../Dto/Signup.request.dto";
import { User } from "../Entities/User.entity";
import { SignUpAuthSession } from "../Entities/signup_auth_session.entity";
import { UserService } from "./User.service";
import { AwsCognitoService } from "./aws-cognito.service";
import { ResponseDto } from "src/Dtos/Response.dto";
import { UserDto } from "../Dto/User.dto";
import { DeleteUserRequestDTO } from "../Dto/DeleteUser.request.dto";
import { VerifyService } from "./verify.service";
import { RefreshTokensRequestDto } from "../Dto/RefreshTokens.request.dto";
import { APIException } from "src/Exceptions/APIException";
import { ErrorMessages } from "../Dto/enum/ErrorMessages";
import { SUCCESS_MESSAGES } from "../Dto/enum/SuccessMessages";

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(SignUpAuthSession)
		private signupSessionRepository: Repository<SignUpAuthSession>,
		private userService: UserService,
		private readonly configService: ConfigService,
		private awsCognitoService: AwsCognitoService,
		private verifyService: VerifyService,
	) {}

	private twilioClient = Twilio(
		this.configService.get(Configs.TWILIO_ACCOUNT_SID),
		this.configService.get(Configs.TWILIO_AUTH_TOKEN),
	);

	private readonly logger = new Logger(AuthService.name);

	async signupStepOne(
		otpSendDto: OtpSendRequestDto,
	): Promise<ResponseDto<{ token: string }>> {
		this.logger.log(`SignupStepOne: DeviceId: ${otpSendDto.device_id}`);
		const { device_id, mobile_number } = otpSendDto;

		// Check if another session is active
		const isSessionAvailable = await this.signupSessionRepository.findOne({
			where: {
				device_id: device_id,
				phone_number: mobile_number,
			},
		});
		if (isSessionAvailable !== null) {
			// Session is not expired
			if (isSessionAvailable.expires_in >= new Date()) {
				this.logger.error(
					`SignupStepOne: Previous signup session available ${isSessionAvailable}`,
				);
				// remove previous session
				await this.signupSessionRepository.delete({
					id: isSessionAvailable.id,
				});
				throw new UnprocessableEntityException(ErrorMessages.SESSION_ACTIVE);
			}
		}

		// Send otp even if phone number is taken
		const userFound = await this.userService.findUser({
			where: { phone_number: mobile_number },
		});

		const token = this._generateToken(device_id);
		const session = new SignUpAuthSession();
		session.status = "INIT";
		session.token = token;
		session.device_id = device_id;
		session.phone_number = mobile_number;
		session.is_phone_number_taken = userFound !== null;
		session.otp_try_count = 0;
		session.phone_number_verified = "NOT_VERIFIED";
		session.expires_in = new Date(new Date().getTime() + 10 * 60000);

		await this.verifyService.sendVerificationCode(session.phone_number);
		const saved_session = await this.signupSessionRepository.save(session);

		const response = {
			data: { token: saved_session.token },
			message: SUCCESS_MESSAGES.OTP_SENT,
		};
		this.logger.log(`SignupStepOne: SUCCESS: ${response}`);
		return response;
	}

	async signupStepTwo(
		otpVerifyDto: OtpVerifyRequestDto,
	): Promise<ResponseDto<{ token: string }>> {
		this.logger.log(`SignupStepTwo: DeviceId: ${otpVerifyDto.device_id}`);
		const { device_id, otp_code, token } = otpVerifyDto;

		// Find session
		const session = await this.signupSessionRepository.findOne({
			where: { token: token },
		});
		// validate session
		if (session === null) {
			this.logger.error(`SignupStepTwo: Invalid session token`);
			throw new UnprocessableEntityException(ErrorMessages.INVALID_TOKEN);
		}
		if (session.device_id !== device_id) {
			this.logger.error(`SignupStepTwo: Invalid device id: ${session}`);
			await this.signupSessionRepository.delete({ id: session.id });
			throw new UnprocessableEntityException(ErrorMessages.INVALID_DEVICE_ID);
		}
		if (session.is_phone_number_taken) {
			this.logger.error(`SignupStepTwo: Phone number taken: ${session}`);
			await this.signupSessionRepository.delete({ id: session.id });
			throw new APIException(ErrorMessages.PHONE_NUMBER_EXISTS);
		}

		const otpStatus = await this.verifyService.verifyCode(
			session.phone_number,
			otp_code,
		);

		session.otp_try_count = session.otp_try_count + 1;

		if (otpStatus) {
			const new_token = this._generateToken(session.device_id);
			session.token = new_token;
			session.phone_number_verified = "VERIFIED";
			session.status = "OTP_VERIFIED";

			const new_session = await this.signupSessionRepository.save(session);
			this.logger.log(`SignupStepTwo: SUCCESS: ${new_session}`);

			// SUCCESS
			return new ResponseDto<{ token: string }>({
				data: {
					token: new_session.token,
				},
				message: SUCCESS_MESSAGES.OTP_VERIFIED,
			});
		} else {
			session.status = "OTP_FAILED";

			if (session.otp_try_count > 3) {
				// If otp code enters for maximum of 3 times end session
				this.logger.error(`SignupStepTwo: OTP retry exceeds: ${session}`);
				await this.signupSessionRepository.delete({ id: session.id });
				throw new UnprocessableEntityException(ErrorMessages.OTP_RETRY_EXCEED);
			}

			this.logger.error(`SignupStepTwo: Invalid OTP: ${session}`);
			await this.signupSessionRepository.save(session);
			throw new APIException(ErrorMessages.INVALID_OTP);
		}
	}

	async signupStepThree(
		emailValidateDto: EmailValidateRequestDto,
	): Promise<ResponseDto<{ token: string }>> {
		this.logger.log(`SignupStepThree: DeviceId: ${emailValidateDto.device_id}`);
		const { device_id, email, token } = emailValidateDto;
		// Find session
		const session = await this.signupSessionRepository.findOne({
			where: { token: token },
		});
		// Validate session
		if (session === null) {
			this.logger.error(`SignupStepThree: Invalid session token`);
			throw new UnprocessableEntityException(ErrorMessages.INVALID_TOKEN);
		}
		if (session.device_id !== device_id) {
			this.logger.error(`SignupStepThree: Invalid device id: ${session}`);
			await this.signupSessionRepository.delete({ id: session.id });
			throw new UnprocessableEntityException(ErrorMessages.INVALID_DEVICE_ID);
		}

		const userFound = await this.userService.findUser({
			where: { email: email },
		});

		if (userFound !== null) {
			// existing user found
			this.logger.error(`SignupStepThree: Email taken: ${session}`);
			throw new APIException(ErrorMessages.EMAIL_TAKEN);
		}

		const new_token = this._generateToken(session.device_id);

		session.email = email;
		session.token = new_token;
		session.status = "EMAIL_ADDED";

		const saved_session = await this.signupSessionRepository.save(session);
		this.logger.log(`SignupStepThree: SUCCESS: ${saved_session}`);

		// SUCCESS
		return new ResponseDto<{ token: string }>({
			data: { token: saved_session.token },
			message: SUCCESS_MESSAGES.EMAIL_ADDED,
		});
	}

	async signupStepFinal(
		signupDto: SignUpRequestDto,
	): Promise<ResponseDto<{ user: UserDto; tokens: any }>> {
		this.logger.log(`SignupStepFinal: DeviceId: ${signupDto.device_id}`);
		const { password, token, device_id } = signupDto;

		// Find session
		const session = await this.signupSessionRepository.findOne({
			where: { token: token },
		});
		// Validate session
		if (session === null) {
			this.logger.error(`SignupStepFinal: Invalid session token`);
			throw new UnprocessableEntityException(ErrorMessages.INVALID_TOKEN);
		}
		if (session.device_id !== device_id) {
			this.logger.error(`SignupStepFinal: Invalid device id: ${session}`);
			await this.signupSessionRepository.delete({ id: session.id });
			throw new UnprocessableEntityException(ErrorMessages.INVALID_DEVICE_ID);
		}
		if (session.status !== "EMAIL_ADDED") {
			this.logger.error(`SignupStepFinal: Invalid session status: ${session}`);
			await this.signupSessionRepository.delete({ id: session.id });
			throw new UnprocessableEntityException(ErrorMessages.NOT_ALLOWED);
		}

		let user = await this.awsCognitoService.registerUser({
			email: session.email,
			phone_number: session.phone_number,
			password: password,
		});
		this.logger.log(
			`SignupStepFinal: User created in cognito: UserId: ${user.id}`,
		);

		user = await this.awsCognitoService.adminConfirmAccount({
			username: user.cognitoSub,
			userId: user.id,
		});
		this.logger.log(
			`SignupStepFinal: User confirmed in cognito: UserId: ${user.id}`,
		);

		if (session.phone_number_verified === "VERIFIED") {
			user = await this.awsCognitoService.adminVerifyAttribute({
				username: user.cognitoSub,
				userId: user.id,
				attribute: "phone_number_verified",
			});
			this.logger.log(
				`SignupStepFinal: User Phone number verified in cognito: UserId: ${user.id}`,
			);
		}

		await this.verifyService.sendVerificationLink(session.email);

		// Remove session
		await this.signupSessionRepository.delete({ id: session.id });
		this.logger.log(`SignupStepFinal: Session deleted: ${session.id}`);

		const tokens = await this.awsCognitoService.loginUser({
			username: user.cognitoSub,
			password,
		});

		this.logger.log(
			`SignupStepFinal: User Tokens generated: UserId: ${user.id}`,
		);
		return new ResponseDto<{ user: UserDto; tokens: any }>({
			message: SUCCESS_MESSAGES.SIGNUP_SUCCESS,
			data: { user: user, tokens },
		});
	}

	async loginUser(loginRequest: LoginRequestDto): Promise<ResponseDto<any>> {
		this.logger.log(
			`LoginUser: Email: ${loginRequest.email}, PhoneNumber: ${loginRequest.phone_number}`,
		);
		const { email, password, phone_number } = loginRequest;

		// Find user details from email or phone number
		let where: FindOptionsWhere<User>;
		if (email !== null) {
			where = { ...where, email };
		}
		if (phone_number !== null) {
			where = { ...where, phone_number };
		}
		const userFound = await this.userService.findUser({
			where,
		});

		if (userFound === null) {
			this.logger.error(`LoginUser: User not found: ${loginRequest.email}`);
			throw new APIException(ErrorMessages.USER_NOT_FOUND);
		}

		const username = userFound.cognitoSub; // AWS Cognito username is users phone number

		try {
			// Call aws cognito
			const tokens = await this.awsCognitoService.loginUser({
				username,
				password,
			});
			this.logger.log(`LoginUser: User logged in: UserId: ${userFound.id}`);
			return new ResponseDto({
				data: tokens,
				message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
			});
		} catch (error) {
			this.logger.error(`LoginUser: COGNITO ERROR: ${error}`);
			throw new APIException(ErrorMessages.PASSWORD_INVALID);
		}
	}

	async sendResetPassword({
		email,
	}: {
		email: string;
	}): Promise<ResponseDto<any>> {
		const user = await this.userService.findUser({ where: { email } });

		if (!user) {
			throw new APIException(ErrorMessages.USER_NOT_FOUND);
		}
		const data = await this.awsCognitoService.forgetPasswordSendOtp({
			username: user.cognitoSub,
		});

		return new ResponseDto({ data: data, message: SUCCESS_MESSAGES.OTP_SENT });
	}

	async confirmPassword({
		code,
		email,
		new_password,
	}: {
		email: string;
		new_password: string;
		code: string;
	}) {
		const user = await this.userService.findUser({ where: { email } });

		if (!user) {
			throw new APIException(ErrorMessages.USER_NOT_FOUND);
		}
		const data = await this.awsCognitoService.confirmPassword({
			username: user.cognitoSub,
			new_password,
			code,
		});

		return new ResponseDto({
			data: data,
			message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
		});
	}

	async validateUser(cognitoSub: string) {
		return await this.userService.findUser({
			where: { cognitoSub: cognitoSub },
		});
	}

	async validateEmail(email: string, token: string) {
		const user = await this.userService.findUser({
			where: { email: email, email_verified: false },
		});

		const otpStatus = this.verifyService.verifyLink(email, token);

		if (otpStatus) {
			await this.awsCognitoService.adminVerifyAttribute({
				username: user.cognitoSub,
				userId: user.id,
				attribute: "email_verified",
			});

			// TODO Redirect to web page
			// SUCCESS
			return new ResponseDto({
				data: null,
				message: SUCCESS_MESSAGES.EMAIL_VERIFIED,
			});
		} else {
			// TODO Redirect to web page
			return new ResponseDto({
				data: null,
				message: ErrorMessages.INVALID_VERIFICATION_LINK,
			});
		}
	}

	async refreshTokens(refreshTokenDto: RefreshTokensRequestDto) {
		return await this.awsCognitoService.refreshTokens(refreshTokenDto);
	}

	private _generateToken(payload: string) {
		const seed = randomBytes(20);
		return createHash("sha256")
			.update(seed + payload)
			.digest("hex");
	}

	async deleteUser(deleteUserRequestDto: DeleteUserRequestDTO) {
		const user = await this.awsCognitoService.adminDeleteUser(
			deleteUserRequestDto,
		);
		return new ResponseDto({
			data: user,
			message: SUCCESS_MESSAGES.USER_DELETED,
		});
	}
}
