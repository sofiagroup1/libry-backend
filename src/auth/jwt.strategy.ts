import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AWSCognitoConfig } from "./aws-cognito.config";
import { passportJwtSecret } from "jwks-rsa";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private awsCognitoConfig: AWSCognitoConfig) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			_audience: awsCognitoConfig.clientId,
			issuer: awsCognitoConfig.authority,
			algorithms: ["RS256"],
			secretOrKeyProvider: passportJwtSecret({
				cache: true,
				rateLimit: true,
				jwksRequestsPerMinute: 5,
				jwksUri: awsCognitoConfig.authority + "/.well-known/jwks.json",
			}),
		});
	}

	async validate(payload: any) {
		return { userId: payload.sub, email: payload.email };
	}
}
