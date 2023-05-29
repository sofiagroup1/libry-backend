import { Module } from "@nestjs/common";
import { AwsCognitoService } from "./aws-cognito.service";

@Module({
	providers: [AwsCognitoService],
})
export class AuthModule {}
