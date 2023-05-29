import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, Matches } from "class-validator";

export class LoginRequestDto {
	@IsEmail()
	@ApiProperty()
	email: string;

	// Match AWS default password requirements
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$&+,:;=?@#|'<>.^*()%!-])[A-Za-z\d@$&+,:;=?@#|'<>.^*()%!-]{8,}$/,
		{ message: "invalid password" },
	)
	@ApiProperty()
	password: string;
}
