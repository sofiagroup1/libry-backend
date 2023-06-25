import { ApiProperty } from "@nestjs/swagger";

export enum STATUS {
	SUCCESS = "SUCCESS",
	ERROR = "ERROR",
}

export class ResponseDto<T = object, U = unknown> {
	@ApiProperty()
	data: T;

	@ApiProperty()
	status?: STATUS = STATUS.SUCCESS;

	@ApiProperty()
	message: string;

	@ApiProperty()
	metadata?: U;

	@ApiProperty()
	error?: any;
}
