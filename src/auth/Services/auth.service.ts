import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { SignUpAuthSession } from "../Entities/signup_auth_session.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { OtpSendRequestDto } from "../Dto/OtpSend.request.dto";
import { createHash, randomBytes } from "crypto";
import { User } from "../Entities/User.entity";
import { OtpVerifyRequestDto } from "../Dto/OtpVerify.request.dto";
import { EmailValidateRequestDto } from "../Dto/EmailValidate.request.dto";
import { SignUpRequestDto } from "../Dto/Signup.request.dto";

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(SignUpAuthSession)
		private signupSessionRepository: Repository<SignUpAuthSession>,
		@InjectRepository(User)
		private userRepository: Repository<User>,
	) {}

	async sendOtp(otpSendDto: OtpSendRequestDto) {
		const { device_id, mobile_number } = otpSendDto;

		// Send otp even if phone number is taken
		const userFound = this.userRepository.findOne({
			where: { phone_number: mobile_number },
		});

		const token = this._generateToken(device_id);
		const session = new SignUpAuthSession();
		session.phone_number_verified = "NOT_VERIFIED";
		session.status = "INIT";
		session.token = token;
		session.device_id = device_id;
		session.phone_number = mobile_number;
		session.is_phone_number_taken = userFound !== null;

		// TODO send twilio otp

		const saved_session = await this.signupSessionRepository.save(session);

		return {
			token: saved_session.token,
			message: "OTP_SENT",
		};
	}

	async verifyOtp(otpVerifyDto: OtpVerifyRequestDto) {
		const { device_id, otp_code, token } = otpVerifyDto;

		// Find session
		const session = await this.signupSessionRepository.findOne({
			where: { token: token },
		});
		// validate session
		if (session === null) {
			throw new UnprocessableEntityException("Invalid token");
		}
		if (session.device_id !== device_id) {
			throw new UnprocessableEntityException("Invalid device id");
		}

		// TODO Twilio verify otp

		const new_token = this._generateToken(session.device_id);

		session.token = new_token;
		session.status = "OTP_VERIFIED";
	}

	async insertEmail(emailValidateDto: EmailValidateRequestDto) {
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
			throw new UnprocessableEntityException("Invalid device id");
		}

		const userFound = this.userRepository.findOne({
			where: { email: email },
		});

		if (userFound !== null) {
			// If existing user, ends signup flow
			this.signupSessionRepository.delete({ id: session.id });
			return {
				message: "EXISTING_USER",
			};
		}

		const new_token = this._generateToken(session.device_id);

		session.email = email;
		session.token = new_token;
		session.status = "EMAIL_ADDED";

		const saved_session = await this.signupSessionRepository.save(session);

		return {
			token: saved_session.token,
			message: "EMAIL_ADDED",
		};
	}

	async signUp(signupDto: SignUpRequestDto) {
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
			throw new UnprocessableEntityException("Invalid device id");
		}

		// TODO cognito
		// TODO do signup
		// TODO activate account
		// TODO login
		// TODO get tokens
	}

	private _generateToken(payload: string) {
		const seed = randomBytes(20);
		return createHash("sha256")
			.update(seed + payload)
			.digest("hex");
	}
}
