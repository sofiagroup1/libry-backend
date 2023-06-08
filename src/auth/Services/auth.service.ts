import {
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomBytes } from "crypto";
import { Configs } from "src/app.constants";
import { ResponseBody } from "src/app.types";
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

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(SignUpAuthSession)
		private signupSessionRepository: Repository<SignUpAuthSession>,
		private userService: UserService,
		private readonly configService: ConfigService,
		private awsCognitoService: AwsCognitoService,
	) {}

	private twilioClient = Twilio(
		this.configService.get(Configs.TWILIO_ACCOUNT_SID),
		this.configService.get(Configs.TWILIO_AUTH_TOKEN),
	);

	async signupStepOne(
		otpSendDto: OtpSendRequestDto,
	): Promise<ResponseBody<{ token: string }>> {
		const { device_id, mobile_number } = otpSendDto;

		// Check if another session is active
		const isSessionAvailable = await this.signupSessionRepository.findOne({
			where: {
				device_id: device_id,
				phone_number: mobile_number,
			},
		});
		if (isSessionAvailable !== null) {
			// remove previous session
			await this.signupSessionRepository.delete({ id: isSessionAvailable.id });
			// Session is not expired
			if (isSessionAvailable.expires_in >= new Date()) {
				throw new UnprocessableEntityException(
					"Previous Sign up is active, try again",
				);
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

		this.twilioClient.verify.v2
			.services(this.configService.get(Configs.TWILIO_VERIFICATION_SERVICE_SID))
			.verifications.create({ to: mobile_number, channel: "sms" })
			.then(() => {
				session.phone_number_verified = "NOT_VERIFIED";
				session.status = "OTP_SENT";
			})
			.catch((err) => {
				throw new UnprocessableEntityException(`Twilio exception: ${err}`);
				// TODO Add logging
			});

		const saved_session = await this.signupSessionRepository.save(session);

		return {
			data: { token: saved_session.token },
			message: "SENT OTP",
		};
	}

	async signupStepTwo(
		otpVerifyDto: OtpVerifyRequestDto,
	): Promise<ResponseBody<{ token: string }>> {
		const { device_id, otp_code, token } = otpVerifyDto;

		// Find session
		const session = await this.signupSessionRepository.findOne({
			where: { token: token },
		});
		// validate session
		if (session === null) {
			throw new UnprocessableEntityException("Invalid session");
		}
		if (session.device_id !== device_id) {
			await this.signupSessionRepository.delete({ id: session.id });
			throw new UnprocessableEntityException("Invalid device id");
		}
		if (session.is_phone_number_taken) {
			await this.signupSessionRepository.delete({ id: session.id });
			throw new ForbiddenException("Phone number taken");
		}

		const otpStatus = await this.twilioClient.verify.v2
			.services(this.configService.get(Configs.TWILIO_VERIFICATION_SERVICE_SID))
			.verificationChecks.create({ to: session.phone_number, code: otp_code });

		session.otp_try_count = session.otp_try_count + 1;

		if (otpStatus.status === "approved") {
			const new_token = this._generateToken(session.device_id);
			session.token = new_token;
			session.phone_number_verified = "VERIFIED";
			session.status = "OTP_VERIFIED";

			const new_session = await this.signupSessionRepository.save(session);

			// SUCCESS
			return {
				data: {
					token: new_session.token,
				},
				message: "OTP VERIFIED",
			};
		} else {
			session.status = "OTP_FAILED";

			if (session.otp_try_count > 3) {
				// If otp code enters for maximum of 3 times end session
				await this.signupSessionRepository.delete({ id: session.id });
				throw new ForbiddenException("OTP retry exceeds");
			}

			await this.signupSessionRepository.save(session);
			throw new UnprocessableEntityException("Invalid OTP");
		}
	}

	async signupStepThree(
		emailValidateDto: EmailValidateRequestDto,
	): Promise<ResponseBody<{ token: string }>> {
		const { device_id, email, token } = emailValidateDto;
		// Find session
		const session = await this.signupSessionRepository.findOne({
			where: { token: token },
		});
		// Validate session
		if (session === null) {
			throw new UnprocessableEntityException("Invalid token");
		}
		if (session.device_id !== device_id) {
			await this.signupSessionRepository.delete({ id: session.id });
			throw new UnprocessableEntityException("Invalid device id");
		}

		const userFound = await this.userService.findUser({
			where: { email: email },
		});

		if (userFound !== null) {
			// If existing user, ends signup flow
			this.signupSessionRepository.delete({ id: session.id });
			throw new ForbiddenException("Email taken");
		}

		// TODO send email verify link

		const new_token = this._generateToken(session.device_id);

		session.email = email;
		session.token = new_token;
		session.status = "EMAIL_ADDED";

		const saved_session = await this.signupSessionRepository.save(session);

		// SUCCESS
		return {
			data: { token: saved_session.token },
			message: "EMAIL_ADDED",
		};
	}

	async signupStepFinal(
		signupDto: SignUpRequestDto,
	): Promise<ResponseBody<{ user: User; tokens: any }>> {
		const { password, token, device_id } = signupDto;

		// Find session
		const session = await this.signupSessionRepository.findOne({
			where: { token: token },
		});
		// Validate session
		if (session === null) {
			throw new UnprocessableEntityException("Invalid token");
		}
		if (session.device_id !== device_id) {
			await this.signupSessionRepository.delete({ id: session.id });
			throw new UnprocessableEntityException("Invalid device id");
		}
		if (session.status !== "EMAIL_ADDED") {
			await this.signupSessionRepository.delete({ id: session.id });
			throw new ForbiddenException("Not allowed");
		}

		let user = await this.awsCognitoService.registerUser({
			email: session.email,
			phone_number: session.phone_number,
			password: password,
		});

		user = await this.awsCognitoService.adminConfirmAccount({
			username: user.cognitoSub,
			userId: user.id,
		});

		if (session.phone_number_verified === "VERIFIED") {
			user = await this.awsCognitoService.adminVerifyAttribute({
				username: user.cognitoSub,
				userId: user.id,
				attribute: "phone_number_verified",
			});
		}

		// Remove session
		await this.signupSessionRepository.delete({ id: session.id });

		const tokens = await this.awsCognitoService.loginUser({
			username: user.cognitoSub,
			password,
		});

		return {
			message: "SUCCESS",
			data: { user: user, tokens },
		};
	}

	async loginUser(loginRequest: LoginRequestDto): Promise<ResponseBody<any>> {
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
			throw new UnprocessableEntityException("Username or password invalid");
		}

		const username = userFound.cognitoSub; // AWS Cognito username is users phone number

		// Call aws cognito
		const tokens = await this.awsCognitoService.loginUser({
			username,
			password,
		});

		return { data: tokens, message: "SUCCESS" };
	}

	async sendResetPassword({
		email,
	}: {
		email: string;
	}): Promise<ResponseBody<any>> {
		const user = await this.userService.findUser({ where: { email } });

		if (!user) {
			throw new NotFoundException("User not found");
		}

		const data = await this.awsCognitoService.forgetPasswordSendOtp({
			username: user.cognitoSub,
		});

		return { data: data, message: "RESET OTP SENT" };
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
			throw new NotFoundException("User not found");
		}

		const data = await this.awsCognitoService.confirmPassword({
			username: user.cognitoSub,
			new_password,
			code,
		});

		return { data: data, message: "PASSWORD CHANGED" };
	}

	async validateUser(cognitoSub: string) {
		return await this.userService.findUser({
			where: { cognitoSub: cognitoSub },
		});
	}

	private _generateToken(payload: string) {
		const seed = randomBytes(20);
		return createHash("sha256")
			.update(seed + payload)
			.digest("hex");
	}
}
