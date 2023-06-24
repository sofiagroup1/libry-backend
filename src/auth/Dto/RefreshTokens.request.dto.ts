import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class RefreshTokensRequestDto {
	@ApiProperty({
		description: "Refresh Token",
	})
	@IsNotEmpty()
	refreshToken: string;

	@ApiProperty({
		description: "Access Token",
	})
	@IsNotEmpty()
	accessToken: string;
}
