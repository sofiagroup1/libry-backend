import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ResponseDto, STATUS } from "src/Dtos/Response.dto";
import { APIException } from "../APIException";

@Catch(APIException)
export class APIExceptionFilter implements ExceptionFilter {
	private readonly isDevelopment = process.env.DEV === "true" || false;

	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();
		const status = exception.getStatus();

		const res = new ResponseDto<null>({
			data: null,
			message: exception.message,
			status: STATUS.ERROR,
			error: {
				path: request.url,
				timestamp: new Date().toISOString(),
				statusCode: status,
				error: exception.cause,
				stack: this.isDevelopment ? exception.stack : undefined,
			},
		});

		response.status(HttpStatus.ACCEPTED).json(res);
	}
}
