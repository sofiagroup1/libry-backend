import { Type, applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
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
