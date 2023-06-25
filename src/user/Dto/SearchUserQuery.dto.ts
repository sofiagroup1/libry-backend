import { ApiProperty } from "@nestjs/swagger";

export class SearchUserQuery {
	@ApiProperty()
	name?: string;

	@ApiProperty()
	email?: string;

	@ApiProperty()
	phone_number?: string;

	@ApiProperty()
	exclude_logged_user?: boolean = true;
}
