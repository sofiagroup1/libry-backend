import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { User } from "./auth/Entities/User.entity";
import { SignUpAuthSession } from "./auth/Entities/signup_auth_session.entity";
import { UserModule } from "./user/user.module";
import * as Joi from "joi";

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: [".env", `.env.${process.env.NODE_ENV}`],
			isGlobal: true,
			validationSchema: Joi.object({
				DEV: Joi.boolean().default(true),
				// DB
				DB_HOST: Joi.string().required(),
				DB_PORT: Joi.string().required(),
				DB_USERNAME: Joi.string().required(),
				DB_PASSWORD: Joi.string().required(),
				DB_DATABASE: Joi.string().required(),
				// AWS COGNITO
				AWS_COGNITO_USER_POOL_ID: Joi.string().required(),
				AWS_COGNITO_CLIENT_ID: Joi.string().required(),
				AWS_COGNITO_REGION: Joi.string().required(),
				AWS_COGNITO_DOMAIN_URL: Joi.string().required(),
				AWS_ACCESS_KEY: Joi.string().required(),
				AWS_SECRET_ACCESS_KEY: Joi.string().required(),
				// TWILIO
				TWILIO_ACCOUNT_SID: Joi.string().required(),
				TWILIO_AUTH_TOKEN: Joi.string().required(),
				TWILIO_VERIFICATION_SERVICE_SID: Joi.string().required(),
				TWILIO_CHANNEL: Joi.string().default("whatsapp"),
			}),
		}),
		TypeOrmModule.forRoot({
			type: "postgres",
			host: process.env.DB_HOST || "localhost",
			port: parseInt(process.env.DB_PORT) || 5432,
			username: process.env.DB_USERNAME || "postgres",
			password: process.env.DB_PASSWORD || "password",
			database: process.env.DB_DATABASE || "libry_dev_db",
			synchronize: true,
			entities: [User, SignUpAuthSession],
			autoLoadEntities: true,
			logging: process.env.DEV === "false" || false,
		}),
		AuthModule,
		UserModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
