import { Body, Controller, Post } from "@nestjs/common";
import { RegisterRequestDto } from "../Dto/Register.request.dto";
import { AwsCognitoService } from "../Services/aws-cognito.service";
import { LoginRequestDto } from "../Dto/Login.request.dto";
import { OtpSendRequestDto } from "../Dto/OtpSend.request.dto";
import { OtpVerifyRequestDto } from "../Dto/OtpVerify.request.dto";
import { EmailValidateRequestDto } from "../Dto/EmailValidate.request.dto";
import { SignUpRequestDto } from "../Dto/Signup.request.dto";
import { AuthService } from "../Services/auth.service";

@Controller("auth")
export class AuthController {
	constructor(
		private awsCognitoService: AwsCognitoService,
		private authService: AuthService,
	) {}

	@Post("register")
	async register(@Body() registerDto: RegisterRequestDto) {
		return await this.awsCognitoService.registerUser(registerDto);
	}

	@Post("otp")
	async sendOtp(@Body() otpSendDto: OtpSendRequestDto) {
		return await this.authService.sendOtp(otpSendDto);
	}

	@Post("otp/verify")
	async verifyOtp(@Body() otpVerifyDto: OtpVerifyRequestDto) {
		return await this.authService.verifyOtp(otpVerifyDto);
	}

	@Post("email")
	async email(@Body() emailValidateDto: EmailValidateRequestDto) {
		this.authService.insertEmail(emailValidateDto);
	}

	@Post("signup")
	async signUp(@Body() sigupDto: SignUpRequestDto) {}

	@Post("login")
	async login(@Body() loginDto: LoginRequestDto) {
		return await this.awsCognitoService.loginUser(loginDto);
	}
}
