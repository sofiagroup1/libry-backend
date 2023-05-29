import { Inject, Injectable } from "@nestjs/common";
import {
	AuthenticationDetails,
	CognitoUser,
	CognitoUserAttribute,
	CognitoUserPool,
} from "amazon-cognito-identity-js";
import { AWSCognitoConfig } from "./aws-cognito.config";
import { RegisterRequestDto } from "./Dto/Register.request.dto";
import { LoginRequestDto } from "./Dto/Login.request.dto";

@Injectable()
export class AwsCognitoService {
	private userPool: CognitoUserPool;

	constructor(
		@Inject("AWSCognitoConfig")
		private readonly awsCognitoConfig: AWSCognitoConfig,
	) {
		this.userPool = new CognitoUserPool({
			UserPoolId: awsCognitoConfig.userPoolID,
			ClientId: awsCognitoConfig.clientId,
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
				(err, result) => {
					if (!result) {
						reject(err);
					} else {
						resolve(result);
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
