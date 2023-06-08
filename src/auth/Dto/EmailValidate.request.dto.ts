import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class EmailValidateRequestDto {
	@IsString()
	@ApiProperty({ description: "Device ID" })
	device_id: string;

	@IsString()
	@ApiProperty()
	email: string;

	@IsString()
	@ApiProperty({ description: "session token from previous response" })
	token: string;
}
