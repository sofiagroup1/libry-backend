import { Body, Controller, Post } from "@nestjs/common";
import { EmailValidateRequestDto } from "../Dto/EmailValidate.request.dto";
import { LoginRequestDto } from "../Dto/Login.request.dto";
import { OtpSendRequestDto } from "../Dto/OtpSend.request.dto";
import { OtpVerifyRequestDto } from "../Dto/OtpVerify.request.dto";
import { SignUpRequestDto } from "../Dto/Signup.request.dto";
import { AuthService } from "../Services/auth.service";

@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post("signup/otp")
	async sendOtp(@Body() otpSendDto: OtpSendRequestDto) {
		return await this.authService.signupStepOne(otpSendDto);
	}

	@Post("signup/otp-verify")
	async verifyOtp(@Body() otpVerifyDto: OtpVerifyRequestDto) {
		return await this.authService.signupStepTwo(otpVerifyDto);
	}

	@Post("signup/email")
	async email(@Body() emailValidateDto: EmailValidateRequestDto) {
		return await this.authService.signupStepThree(emailValidateDto);
	}

	@Post("signup/register")
	async signUp(@Body() signupDto: SignUpRequestDto) {
		return await this.authService.signupStepFinal(signupDto);
	}

	@Post("login")
	async login(@Body() loginDto: LoginRequestDto) {
		return await this.authService.loginUser(loginDto);
	}
}
