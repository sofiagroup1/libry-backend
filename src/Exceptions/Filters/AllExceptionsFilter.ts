import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from "@nestjs/common";
import { AbstractHttpAdapter } from "@nestjs/core";
import { ResponseDto, STATUS } from "src/Dtos/Response.dto";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly isDevelopment = process.env.DEV === "true" || false;
	constructor(private readonly httpAdapterHost: AbstractHttpAdapter) {}

	catch(exception: unknown, host: ArgumentsHost): void {
		// In certain situations `httpAdapter` might not be available in the
		// constructor method, thus we should resolve it here.
		const httpAdapter = this.httpAdapterHost;

		const ctx = host.switchToHttp();

		const httpStatus =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR;
		const message =
			exception instanceof HttpException
				? exception.message
				: "Internal server error";
		const cause =
			exception instanceof HttpException ? exception.cause : undefined;
		const stack =
			exception instanceof HttpException ? exception.stack : undefined;

		const responseBody = new ResponseDto<null>();
		responseBody.message = message;
		responseBody.status = STATUS.ERROR;
		responseBody.data = null;
		responseBody.error = {
			path: httpAdapter.getRequestUrl(ctx.getRequest()),
			timestamp: new Date().toISOString(),
			statusCode: httpStatus,
			error: cause,
			stack: this.isDevelopment ? stack : undefined,
		};

		httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
	}
}
