import { ApiProperty } from "@nestjs/swagger";

export enum STATUS {
	SUCCESS = "SUCCESS",
	ERROR = "ERROR",
}

export class ResponseDto<T = object, U = unknown> {
	constructor({
		data,
		message,
		status = STATUS.SUCCESS,
		metadata,
		error,
	}: {
		data: T;
		message: string;
		status?: STATUS;
		metadata?: U;
		error?: any;
	}) {
		this.status = status;
		this.message = message;
		this.data = data;
		this.metadata = metadata;
		this.error = error;
	}

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
