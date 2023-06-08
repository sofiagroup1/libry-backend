import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class OnboardingUserDetailsRequestDto {
	@IsString()
	@IsOptional()
	@ApiProperty()
	name: string;

	@IsDateString()
	@IsOptional()
	@ApiProperty()
	birth_date: string;
}
