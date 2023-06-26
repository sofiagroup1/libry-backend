import {
	HttpException,
	HttpExceptionOptions,
	HttpStatus,
} from "@nestjs/common";

export class APIException extends HttpException {
	constructor(
		message: string,
		statusCode: number = HttpStatus.ACCEPTED,
		options?: HttpExceptionOptions,
	) {
		super(message, statusCode, options);
	}
}
