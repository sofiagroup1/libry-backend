import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Configs } from "src/app.constants";

@Injectable()
export class AWSCognitoConfig {
	constructor(private readonly configService: ConfigService) {}

	public accessKeyId: string = this.configService.get(Configs.AWS_ACCESS_KEY);
	public secretAccessKey: string = this.configService.get(
		Configs.AWS_SECRET_ACCESS_KEY,
	);

	public userPoolID: string = this.configService.get(
		Configs.AWS_COGNITO_USER_POOL_ID,
	);
	public clientId: string = this.configService.get(
		Configs.AWS_COGNITO_CLIENT_ID,
	);
	public region: string = this.configService.get(Configs.AWS_COGNITO_REGION);
	public authority = `https://cognito-idp.${this.configService.get(
		Configs.AWS_COGNITO_REGION,
	)}.amazonaws.com/${this.configService.get(Configs.AWS_COGNITO_USER_POOL_ID)}`;
}
