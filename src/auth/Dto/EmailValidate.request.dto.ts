import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

export class EmailValidateRequestDto {
    @IsString()
    @ApiProperty()
    device_id: string;

    @IsString()
    @ApiProperty()
    email: string;

    @IsUUID()
    @ApiProperty()
    token: string;
}