import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { APIExceptionFilter } from "./Exceptions/Filters/APIExceptionFilter";
import { AllExceptionsFilter } from "./Exceptions/Filters/AllExceptionsFilter";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const config = new DocumentBuilder()
		.setTitle("Libry - Backend")
		.setDescription("Libry")
		.setVersion("0.0.1")
		.addTag("libry")
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api", app, document);
	const { httpAdapter } = app.get(HttpAdapterHost);

	app.useGlobalFilters(new APIExceptionFilter());
	app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
	await app.listen(process.env.PORT);
}
bootstrap();
