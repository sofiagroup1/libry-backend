import { Type, applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { ResponseDto } from "src/Dtos/Response.dto";

export const ApiOkResponseBody = <DataDto extends Type<unknown>>({
	description,
	type,
}: {
	description: string;
	type: DataDto;
}) => {
	return applyDecorators(
		ApiExtraModels(ResponseDto, type),
		ApiOkResponse({
			description: description,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(ResponseDto) },
					{
						properties: {
							data: { $ref: getSchemaPath(type) },
						},
					},
				],
			},
		}),
	);
};
