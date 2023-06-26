import {
	Body,
	Controller,
	Delete,
	Get,
	HttpStatus,
	Post,
	Query,
} from "@nestjs/common";
import {
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiTags,
	ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import {
	ApiExceptionResponse,
	ApiOkResponseBody,
} from "src/Decorators/ApiResponseBody.decorator";
import { DeleteResult } from "typeorm";
import { DeleteUserRequestDTO } from "../Dto/DeleteUser.request.dto";
import { EmailValidateRequestDto } from "../Dto/EmailValidate.request.dto";
import { LoginRequestDto } from "../Dto/Login.request.dto";
import { NewPasswordRequestDto } from "../Dto/NewPassword.request.dto";
import { OtpSendRequestDto } from "../Dto/OtpSend.request.dto";
import { OtpVerifyRequestDto } from "../Dto/OtpVerify.request.dto";
import { PasswordResetDto } from "../Dto/PasswordReset.request.dto";
import { RefreshTokensRequestDto } from "../Dto/RefreshTokens.request.dto";
import { SignUpRequestDto } from "../Dto/Signup.request.dto";
import { SignupResponseDto } from "../Dto/Signup.response.dto";
import { SessionTokenResponse } from "../Dto/Token.response.dto";
import { AuthService } from "../Services/auth.service";
import { ErrorMessages } from "../Dto/enum/ErrorMessages";

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
		description: `UnprocessableEntity: ${[ErrorMessages.SESSION_ACTIVE]}`,
	})
	@ApiInternalServerErrorResponse({
		description: `InternalServerError: Error with twilio or unprocessed`,
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
		description: `UnprocessableEntity: ${[
			ErrorMessages.INVALID_DEVICE_ID,
			ErrorMessages.INVALID_TOKEN,
			ErrorMessages.OTP_RETRY_EXCEED,
		]}`,
	})
	@ApiExceptionResponse({
		errors: [ErrorMessages.INVALID_OTP, ErrorMessages.PHONE_NUMBER_EXISTS],
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
		status: HttpStatus.UNPROCESSABLE_ENTITY,
		description: `UnprocessableEntity: ${[
			ErrorMessages.INVALID_DEVICE_ID,
			ErrorMessages.INVALID_TOKEN,
		]}`,
	})
	@ApiExceptionResponse({
		errors: [ErrorMessages.EMAIL_TAKEN],
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
		status: HttpStatus.UNPROCESSABLE_ENTITY,
		description: `UnprocessableEntity: ${[
			ErrorMessages.INVALID_DEVICE_ID,
			ErrorMessages.INVALID_TOKEN,
			ErrorMessages.NOT_ALLOWED,
		]}`,
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
	@ApiExceptionResponse({
		errors: [ErrorMessages.USER_NOT_FOUND, ErrorMessages.PASSWORD_INVALID],
	})
	@ApiInternalServerErrorResponse({
		description: "Unhandled exception or AWS related exception",
	})
	async login(@Body() loginDto: LoginRequestDto) {
		return await this.authService.loginUser(loginDto);
	}

	@ApiOkResponseBody({
		description: "Send reset password code",
		type: String,
	})
	@ApiExceptionResponse({
		errors: [ErrorMessages.USER_NOT_FOUND],
	})
	@Post("reset-password")
	async resetPassword(@Body() resetDto: PasswordResetDto) {
		return await this.authService.sendResetPassword({ email: resetDto.email });
	}

	@ApiOkResponseBody({
		description: "Create new password with password reset code",
		type: String,
	})
	@ApiExceptionResponse({
		errors: [ErrorMessages.USER_NOT_FOUND],
	})
	@Post("new-password")
	async newPassword(@Body() newPasswordDto: NewPasswordRequestDto) {
		return await this.authService.confirmPassword({
			code: newPasswordDto.code,
			email: newPasswordDto.email,
			new_password: newPasswordDto.password,
		});
	}

	@Delete("")
	@ApiOkResponseBody({
		description: "Delete user : DEVELOPMENT ONLY!",
		type: DeleteResult,
	})
	async deleteUser(@Body() deleteUserRequestDto: DeleteUserRequestDTO) {
		return await this.authService.deleteUser(deleteUserRequestDto);
	}

	@Get("verify/email")
	@ApiOkResponse({
		description: "Verify email",
	})
	async validateEmail(
		@Query("email") email: string,
		@Query("token") token: string,
	) {
		return await this.authService.validateEmail(email, token);
	}

	@Post("refresh")
	@ApiOkResponse({
		description: "Refresh access token with refresh token",
	})
	async refreshTokens(@Body() data: RefreshTokensRequestDto) {
		return await this.authService.refreshTokens(data);
	}
}
