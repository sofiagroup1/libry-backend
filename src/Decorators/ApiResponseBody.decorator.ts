import { Type, applyDecorators } from "@nestjs/common";
import {
	ApiAcceptedResponse,
	ApiExtraModels,
	ApiOkResponse,
	getSchemaPath,
} from "@nestjs/swagger";
import { ResponseDto } from "src/Dtos/Response.dto";

export const ApiOkResponseBody = <DataDto extends Type<unknown>>({
	description,
	type,
	isArray = false,
}: {
	description: string;
	type: DataDto;
	isArray?: boolean;
}) => {
	return applyDecorators(
		ApiExtraModels(ResponseDto, type),
		ApiOkResponse({
			description: description,
			isArray: isArray,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(ResponseDto) },
					{
						properties: {
							data: isArray
								? { type: "array", items: { $ref: getSchemaPath(type) } }
								: { $ref: getSchemaPath(type) },
						},
					},
				],
			},
		}),
	);
};

export const ApiExceptionResponse = ({ errors }: { errors: string[] }) => {
	return applyDecorators(
		ApiExtraModels(ResponseDto),
		ApiAcceptedResponse({
			description: `Error API Exception: ${errors.join(", ")}`,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(ResponseDto) },
					{
						properties: {
							message: { type: "string", example: errors[0] },
							status: { type: "string", example: "ERROR" },
						},
					},
				],
			},
		}),
	);
};
