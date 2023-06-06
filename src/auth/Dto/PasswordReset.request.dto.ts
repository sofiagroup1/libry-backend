import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class PasswordResetDto {
	@IsEmail()
	@ApiProperty()
	email: string;
}
