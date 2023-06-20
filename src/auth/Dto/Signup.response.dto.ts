import { ApiProperty } from "@nestjs/swagger";
import { UserDto } from "./User.dto";

export class SignupResponseDto {
	@ApiProperty()
	user: UserDto;

	@ApiProperty()
	token: string;
}
