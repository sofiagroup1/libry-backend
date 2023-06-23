import { ApiProperty } from "@nestjs/swagger";
import { IsMobilePhone } from "class-validator";

export class DeleteUserRequestDTO {
	@IsMobilePhone()
	@ApiProperty({ description: "Mobile number", example: "+94770000000" })
	phone_number: string;
}
