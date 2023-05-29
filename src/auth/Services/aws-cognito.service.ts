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

@Injectable()
export class AwsCognitoService {
	private userPool: CognitoUserPool;

	constructor(
		private awsCognitoConfig: AWSCognitoConfig,
		private userService: UserService,
	) {
		this.userPool = new CognitoUserPool({
			UserPoolId: this.awsCognitoConfig.userPoolID,
			ClientId: this.awsCognitoConfig.clientId,
		});
	}

	async registerUser(registerRequest: RegisterRequestDto) {
		const { email, name, password } = registerRequest;

		return new Promise((resolve, reject) => {
			this.userPool.signUp(
				email,
				password,
				[new CognitoUserAttribute({ Name: "name", Value: name })],
				null,
				async (err, result) => {
					if (!result) {
						reject(err);
					} else {
						let user: User = new User();
						user = {
							...user,
							email: result.user.getUsername(),
							cognitoSub: result.userSub,
							name: name,
							userConfirmed: result.userConfirmed,
						};

						console.log(result);

						resolve(
							this.userService.toUserDto(await this.userService.create(user)),
						);
					}
				},
			);
		});
	}

	async loginUser(loginRequest: LoginRequestDto) {
		const { email, password } = loginRequest;

		const userData = { Username: email, Pool: this.userPool };

		const authenticatedDetails = new AuthenticationDetails({
			Username: email,
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
