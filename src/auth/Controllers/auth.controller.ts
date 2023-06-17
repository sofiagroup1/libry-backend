import { Body, Controller, Post } from "@nestjs/common";
import {
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ApiOkResponseBody } from "src/Decorators/ApiResponseBody.decorator";
import { EmailValidateRequestDto } from "../Dto/EmailValidate.request.dto";
import { LoginRequestDto } from "../Dto/Login.request.dto";
import { OtpSendRequestDto } from "../Dto/OtpSend.request.dto";
import { OtpVerifyRequestDto } from "../Dto/OtpVerify.request.dto";
import { PasswordResetDto } from "../Dto/PasswordReset.request.dto";
import { SignUpRequestDto } from "../Dto/Signup.request.dto";
import { SignupResponseDto } from "../Dto/Signup.response.dto";
import { SessionTokenResponse } from "../Dto/Token.response.dto";
import { AuthService } from "../Services/auth.service";

@Controller("auth")
@ApiTags("Authentication")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post("signup/otp")
	@ApiOkResponseBody({
		description: "OTP Sent and signup session created successfully",
		type: SessionTokenResponse,
	})
	@ApiUnprocessableEntityResponse({
		status: 422,
		description: "UnprocessableEntity: Previous Sign up is active, try again",
	})
	@ApiInternalServerErrorResponse({
		description: "Error with twilio or unprocessed",
	})
	async sendOtp(@Body() otpSendDto: OtpSendRequestDto) {
		return await this.authService.signupStepOne(otpSendDto);
	}

	@Post("signup/otp-verify")
	@ApiOkResponseBody({
		description: "OTP verified and signup session updated successfully",
		type: SessionTokenResponse,
	})
	@ApiUnprocessableEntityResponse({
		status: 422,
		description:
			"UnprocessableEntity: Signup Session invalid, Device Id mismatch",
	})
	@ApiForbiddenResponse({
		description:
			"Account with same phone number exists, maximum OTP retry count exceeds",
	})
	@ApiInternalServerErrorResponse({
		description: "Error with twilio or unprocessed",
	})
	async verifyOtp(@Body() otpVerifyDto: OtpVerifyRequestDto) {
		return await this.authService.signupStepTwo(otpVerifyDto);
	}

	@Post("signup/email")
	@ApiOkResponseBody({
		description: "signup session updated successfully",
		type: SessionTokenResponse,
	})
	@ApiUnprocessableEntityResponse({
		status: 422,
		description:
			"UnprocessableEntity: Signup Session invalid, Device Id mismatch",
	})
	@ApiForbiddenResponse({
		description: "Email taken",
	})
	@ApiInternalServerErrorResponse({
		description: "Unhandled exception",
	})
	async email(@Body() emailValidateDto: EmailValidateRequestDto) {
		return await this.authService.signupStepThree(emailValidateDto);
	}

	@Post("signup/register")
	@ApiOkResponseBody({
		description: "User created and tokens generated successfully",
		type: SignupResponseDto,
	})
	@ApiUnprocessableEntityResponse({
		status: 422,
		description:
			"UnprocessableEntity: Signup Session invalid, Device Id mismatch",
	})
	@ApiForbiddenResponse({
		description: "Signup Pre conditions unmet",
	})
	@ApiInternalServerErrorResponse({
		description: "Unhandled exception or AWS related exception",
	})
	async signUp(@Body() signupDto: SignUpRequestDto) {
		return await this.authService.signupStepFinal(signupDto);
	}

	@Post("login")
	@ApiOkResponse({
		description: "User logged in and tokens generated successfully",
	})
	@ApiUnprocessableEntityResponse({
		status: 422,
		description: "Username or password invalid",
	})
	@ApiInternalServerErrorResponse({
		description: "Unhandled exception or AWS related exception",
	})
	async login(@Body() loginDto: LoginRequestDto) {
		return await this.authService.loginUser(loginDto);
	}

	async resetPassword(@Body() resetDto: PasswordResetDto) {
		return await this.authService.sendResetPassword({ email: resetDto.email });
	}
}
