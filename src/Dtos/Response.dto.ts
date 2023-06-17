import { ApiProperty } from "@nestjs/swagger";

export class ResponseDto<T = object, U = unknown> {
	@ApiProperty()
	data: T;

	@ApiProperty()
	message: string;

	@ApiProperty()
	metadata?: U;

	@ApiProperty()
	error?: any;
}
