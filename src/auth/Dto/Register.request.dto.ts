import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Matches } from "class-validator";

export class RegisterRequestDto {
	@IsString()
	@ApiProperty()
	name: string;

	@IsEmail()
	@ApiProperty()
	email: string;

	// Match AWS default password requirements
	// Minimum eight characters, at least one uppercase letter, one lowercase letter, one number, and one special character

	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$&+,:;=?@#|'<>.^*()%!-])[A-Za-z\d@$&+,:;=?@#|'<>.^*()%!-]{8,}$/,
		{ message: "invalid password" },
	)
	@ApiProperty()
	password: string;
}
