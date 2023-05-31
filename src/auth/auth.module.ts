import { Module } from "@nestjs/common";
import { AwsCognitoService } from "./Services/aws-cognito.service";
import { AuthController } from "./Controllers/auth.controller";
import { AWSCognitoConfig } from "./aws-cognito.config";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt.strategy";
import { UserService } from "./Services/User.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./Entities/User.entity";
import { SignUpAuthSession } from "./Entities/signup_auth_session.entity";

@Module({
	imports: [
		PassportModule.register({ defaultStrategy: "jwt" }),
		TypeOrmModule.forFeature([User, SignUpAuthSession]),
	],
	providers: [AWSCognitoConfig, AwsCognitoService, JwtStrategy, UserService],
	controllers: [AuthController],
})
export class AuthModule {}
