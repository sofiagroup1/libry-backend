import { Injectable } from "@nestjs/common";
import {
	AuthenticationDetails,
	CognitoUser,
	CognitoUserAttribute,
	CognitoUserPool,
} from "amazon-cognito-identity-js";
import { LoginRequestDto } from "../Dto/Login.request.dto";
import { RegisterRequestDto } from "../Dto/Register.request.dto";
import { User } from "../Entities/User.entity";
import { AWSCognitoConfig } from "../aws-cognito.config";
import { UserService } from "./User.service";
import {
	CognitoIdentityProviderClient,
	AdminConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

@Injectable()
export class AwsCognitoService {
	private userPool: CognitoUserPool;
	private awsClient: CognitoIdentityProviderClient;

	constructor(
		private awsCognitoConfig: AWSCognitoConfig,
		private userService: UserService,
	) {
		this.userPool = new CognitoUserPool({
			UserPoolId: this.awsCognitoConfig.userPoolID,
			ClientId: this.awsCognitoConfig.clientId,
		});

		this.awsClient = new CognitoIdentityProviderClient({
			region: this.awsCognitoConfig.region,
			credentials: {
				accessKeyId: this.awsCognitoConfig.accessKeyId,
				secretAccessKey: this.awsCognitoConfig.secretAccessKey,
			},
		});
	}

	async registerUser(data: {
		email: string;
		phone_number: string;
		password: string;
	}): Promise<User> {
		const { email, password, phone_number } = data;

		return new Promise((resolve, reject) => {
			this.userPool.signUp(
				phone_number,
				password,
				[
					new CognitoUserAttribute({ Name: "email", Value: email }),
					new CognitoUserAttribute({
						Name: "phone_number",
						Value: phone_number,
					}),
				],
				null,
				async (err, result) => {
					if (!result) {
						reject(err);
					} else {
						let user: User = new User();
						user = {
							...user,
							phone_number: result.user.getUsername(),
							email: email,
							cognitoSub: result.userSub,
							userConfirmed: result.userConfirmed,
						};

						console.log(result);

						resolve(await this.userService.create(user));
					}
				},
			);
		});
	}

	async confirmAccount(data: {
		username: string;
		userId: string;
	}): Promise<User> {
		const { username, userId } = data;

		const adminConfirmSignUpCommand = new AdminConfirmSignUpCommand({
			Username: username,
			UserPoolId: this.awsCognitoConfig.userPoolID,
		});

		return new Promise((resolve, reject) => {
			this.awsClient.send(adminConfirmSignUpCommand).then(async (value) => {
				console.log(value);

				const user = await this.userService.markUserConfirmedStatus(
					userId,
					true,
				);

				resolve(user);
			});
		});
	}

	async loginUser(data: { username: string; password: string }) {
		const { username, password } = data;

		const userData = { Username: username, Pool: this.userPool };

		const authenticatedDetails = new AuthenticationDetails({
			Username: username,
			Password: password,
		});

		const userCognito = new CognitoUser(userData);

		return new Promise((resolve, reject) => {
			userCognito.authenticateUser(authenticatedDetails, {
				onSuccess: (result) => {
					resolve({
						accessToken: result.getAccessToken().getJwtToken(),
						refreshToken: result.getRefreshToken().getToken(),
					});
				},
				onFailure: (err) => {
					reject(err);
				},
			});
		});
	}
}
