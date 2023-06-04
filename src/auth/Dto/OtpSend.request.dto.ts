import { ApiProperty } from "@nestjs/swagger";
import { IsMobilePhone } from "class-validator";

export class OtpSendRequestDto {
	@IsMobilePhone()
	@ApiProperty({ description: "Mobile number", example: "+94770000000" })
	mobile_number: string;

	@ApiProperty({ description: "Device ID" })
	device_id: string;
}
