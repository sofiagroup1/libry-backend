import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";


export class OtpVerifyRequestDto {
    @IsString()
    @ApiProperty()
    device_id: string;

    @IsString()
    @ApiProperty()
    otp_code: string;

    @IsUUID()
    @ApiProperty()
    token: string;
}