import { ApiProperty } from "@nestjs/swagger";

export class UserDto {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	description: string;

	@ApiProperty()
	email: string;

	@ApiProperty()
	email_verified: boolean;

	@ApiProperty()
	phone_number: string;

	@ApiProperty()
	phone_number_verified: boolean;

	@ApiProperty()
	userConfirmed: boolean;

	@ApiProperty()
	birth_date: Date;

	@ApiProperty({ type: [UserDto], isArray: true })
	followers?: UserDto[];

	@ApiProperty({ type: [UserDto], isArray: true })
	following?: UserDto[];

	@ApiProperty()
	followingCount?: number;

	@ApiProperty()
	followerCount?: number;

	@ApiProperty()
	isFollowed?: boolean;
}
