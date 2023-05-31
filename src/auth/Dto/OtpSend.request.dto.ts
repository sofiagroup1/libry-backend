import { ApiProperty } from "@nestjs/swagger";
import { IsMobilePhone } from "class-validator";


export class OtpSendRequestDto {
    @IsMobilePhone()
    @ApiProperty()
    mobile_number: string;

    @ApiProperty()
    device_id: string;
}