import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class OtpVerifyRequestDto {
	@IsString()
	@ApiProperty({ description: "Device ID" })
	device_id: string;

	@IsString()
	@ApiProperty()
	otp_code: string;

	@IsString()
	@ApiProperty({ description: "session token from previous response" })
	token: string;
}
