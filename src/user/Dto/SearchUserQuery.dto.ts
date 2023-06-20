import { ApiProperty } from "@nestjs/swagger";

export class SearchUserQuery {
	@ApiProperty()
	name?: string;

	@ApiProperty()
	email?: string;

	@ApiProperty()
	phone_number?: string;
}
