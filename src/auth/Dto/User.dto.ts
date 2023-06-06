import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	email: string;

	@ApiProperty()
	email_verified: boolean;

	@ApiProperty()
	phone_number: string;

	@ApiProperty()
	phone_number_verified: boolean;

	@ApiProperty()
	userConfirmed: boolean;
}
