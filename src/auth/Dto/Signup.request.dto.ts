import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsUUID, Matches } from "class-validator";

export class SignUpRequestDto {
	@IsString()
	@ApiProperty({ description: "session token from previous response" })
	token: string;

	// Match AWS default password requirements
	// Minimum eight characters, at least one uppercase letter, one lowercase letter, one number, and one special character
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$&+,:;=?@#|'<>.^*()%!-])[A-Za-z\d@$&+,:;=?@#|'<>.^*()%!-]{8,}$/,
		{ message: "invalid password" },
	)
	@ApiProperty({
		description:
			"Password Minimum eight characters, at least one uppercase letter, one lowercase letter, one number, and one special character",
	})
	password: string;

	@IsString()
	@ApiProperty({ description: "Device ID" })
	device_id: string;
}
