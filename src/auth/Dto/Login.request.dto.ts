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
	@ApiProperty({
		description:
			"Password Minimum eight characters, at least one uppercase letter, one lowercase letter, one number, and one special character",
	})
	password: string;
}
