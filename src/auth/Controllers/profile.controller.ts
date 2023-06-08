import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserService } from "../Services/User.service";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { ReqUser, ResponseBody } from "src/app.types";
import { UserDto } from "../Dto/User.dto";
import { OnboardingUserDetailsRequestDto } from "../Dto/onboarding.request.dto";
import { User } from "../Entities/User.entity";

@Controller("profile")
@ApiTags("Profile")
@UseGuards(AuthGuard("jwt"))
export class ProfileController {
	constructor(private userService: UserService) {}

	@Get()
	async getLoggedUser(@Req() request: Request): Promise<ResponseBody<UserDto>> {
		const loggedInUser = request.user as ReqUser;

		return {
			data: this.userService.toUserDto(loggedInUser.user),
			message: "USER FOUND",
		};
	}

	@Post("onboarding")
	async onboardingAddDetails(
		@Req() request: Request,
		@Body() reqBody: OnboardingUserDetailsRequestDto,
	) {
		const loggedInUser = request.user as ReqUser;

		let updatedUser: User = { ...loggedInUser.user };

		if (reqBody.name) {
			updatedUser = await this.userService.edit(
				{ cognitoSub: loggedInUser.sub },
				{ ...updatedUser, name: reqBody.name },
			);
		}

		if (reqBody.birth_date) {
			updatedUser = await this.userService.edit(
				{ cognitoSub: loggedInUser.sub },
				{ ...updatedUser, birth_date: new Date(reqBody.birth_date) },
			);
		}

		return {
			data: this.userService.toUserDto(updatedUser),
			message: "USER_DATA_UPDATED",
		};
	}
}
