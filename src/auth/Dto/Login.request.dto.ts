import { IsEmail, Matches } from "class-validator";

export class LoginRequestDto {
	@IsEmail()
	email: string;

	// Match AWS default password requirements
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$&+,:;=?@#|'<>.^*()%!-])[A-Za-z\d@$&+,:;=?@#|'<>.^*()%!-]{8,}$/,
		{ message: "invalid password" },
	)
	password: string;
}
