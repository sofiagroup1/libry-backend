import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Configs } from "src/app.constants";
import * as Twilio from "twilio";

@Injectable()
export class VerifyService {
	constructor(private configService: ConfigService) {}

	private twilioClient = Twilio(
		this.configService.get(Configs.TWILIO_ACCOUNT_SID),
		this.configService.get(Configs.TWILIO_AUTH_TOKEN),
	);

	private isDevelopment = this.configService.get(Configs.DEV);

	async sendVerificationCode(phone_number: string) {
		if (this.isDevelopment) {
			console.info(`DEVELOPMENT MODE: Verification code: 12345`);
			return true;
		} else {
			try {
				const verification = await this.twilioClient.verify.v2
					.services(
						this.configService.get(Configs.TWILIO_VERIFICATION_SERVICE_SID),
					)
					.verifications.create({
						to: phone_number,
						channel: this.configService.get(Configs.TWILIO_CHANNEL),
					});
				console.log(verification);
				return true;
			} catch (error) {
				throw new UnprocessableEntityException(`Error with twilio: ${error}`);
			}
		}
	}

	async verifyCode(phone_number: string, code: string) {
		if (this.isDevelopment) {
			return code === "12345";
		} else {
			try {
				const verification = await this.twilioClient.verify.v2
					.services(
						this.configService.get(Configs.TWILIO_VERIFICATION_SERVICE_SID),
					)
					.verificationChecks.create({
						to: phone_number,
						code: code,
					});
				console.log(verification);
				return verification.status === "approved";
			} catch (error) {
				throw new UnprocessableEntityException(`Error with twilio: ${error}`);
			}
		}
	}

	async sendVerificationLink(email: string) {
		if (this.isDevelopment) {
			console.info(
				`DEVELOPMENT MODE: Verification link: http://localhost:3000/verify/email?email=${email}&token=12345`,
			);
			return true;
		} else {
			try {
				const verification = await this.twilioClient.verify.v2
					.services(
						this.configService.get(Configs.TWILIO_VERIFICATION_SERVICE_SID),
					)
					.verifications.create({
						to: email,
						channel: "email",
					});
				console.log(verification);
				return true;
			} catch (error) {
				throw new UnprocessableEntityException(`Error with twilio: ${error}`);
			}
		}
	}

	async verifyLink(email: string, code: string) {
		if (this.isDevelopment) {
			return code === "12345";
		} else {
			try {
				const verification = await this.twilioClient.verify.v2
					.services(
						this.configService.get(Configs.TWILIO_VERIFICATION_SERVICE_SID),
					)
					.verificationChecks.create({ to: email, code: code });
				return verification.status === "approved";
			} catch (error) {
				throw new UnprocessableEntityException(`Error with twilio: ${error}`);
			}
		}
	}
}
