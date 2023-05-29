import { Body, Controller, Post } from "@nestjs/common";
import { RegisterRequestDto } from "../Dto/Register.request.dto";
import { AwsCognitoService } from "../Services/aws-cognito.service";
import { LoginRequestDto } from "../Dto/Login.request.dto";

@Controller("auth")
export class AuthController {
	constructor(private awsCognitoService: AwsCognitoService) {}

	@Post("register")
	async register(@Body() registerDto: RegisterRequestDto) {
		return await this.awsCognitoService.registerUser(registerDto);
	}

	@Post("login")
	async login(@Body() loginDto: LoginRequestDto) {
		return await this.awsCognitoService.loginUser(loginDto);
	}
}
