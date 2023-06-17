import { ApiProperty } from "@nestjs/swagger";

export class SessionTokenResponse {
	@ApiProperty()
	token: string;
}
