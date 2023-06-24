import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, Matches } from "class-validator";

export class NewPasswordRequestDto {
	@ApiProperty()
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$&+,:;=?@#|'<>.^*()%!-])[A-Za-z\d@$&+,:;=?@#|'<>.^*()%!-]{8,}$/,
		{ message: "invalid password" },
	)
	password: string;

	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty()
	code: string;
}
