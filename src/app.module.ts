import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { User } from "./auth/Entities/User.entity";
import { Otp } from "./auth/Entities/Otp.entity";

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: [".env", `.env.${process.env.NODE_ENV}`],
			isGlobal: true,
		}),
		TypeOrmModule.forRoot({
			type: "postgres",
			host: process.env.DB_HOST || "localhost",
			port: parseInt(process.env.DB_PORT) || 5432,
			username: process.env.DB_USERNAME || "postgres",
			password: process.env.DB_PASSWORD || "password",
			database: process.env.DB_DATABASE || "libry_dev_db",
			synchronize: true,
			entities: [User, Otp],
			autoLoadEntities: true,
		}),
		AuthModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
