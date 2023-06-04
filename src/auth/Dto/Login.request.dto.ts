import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches } from "class-validator";

export class LoginRequestDto {
	@IsOptional()
	@IsEmail()
	@ApiProperty()
	email: string;

	@IsOptional()
	@IsString()
	@ApiProperty()
	phone_number: string;

	// Match AWS default password requirements
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$&+,:;=?@#|'<>.^*()%!-])[A-Za-z\d@$&+,:;=?@#|'<>.^*()%!-]{8,}$/,
		{ message: "invalid password" },
	)
	@ApiProperty()
	password: string;
}
