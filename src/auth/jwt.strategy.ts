import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AWSCognitoConfig } from "./aws-cognito.config";
import { passportJwtSecret } from "jwks-rsa";
import { AuthService } from "./Services/auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private awsCognitoConfig: AWSCognitoConfig,
		private authService: AuthService,
	) {
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
		if (payload && payload.sub) {
			const user = await this.authService.validateUser(payload.sub);

			if (!user) {
				throw new UnauthorizedException("User data not found");
			}

			return { sub: payload.sub, user: user };
		} else {
			throw new UnauthorizedException("Access token not found");
		}
	}
}
