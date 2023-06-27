import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserService } from "../Services/User.service";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { ReqUser } from "src/app.types";
import { UserDto } from "../Dto/User.dto";
import { OnboardingUserDetailsRequestDto } from "../Dto/onboarding.request.dto";
import { User } from "../Entities/User.entity";
import { ApiOkResponseBody } from "src/Decorators/ApiResponseBody.decorator";
import { ResponseDto } from "src/Dtos/Response.dto";

@Controller("profile")
@ApiTags("Profile")
@UseGuards(AuthGuard("jwt"))
export class ProfileController {
	constructor(private userService: UserService) {}

	@Get()
	@ApiOkResponseBody({ description: "Logged in user", type: UserDto })
	async getLoggedUser(@Req() request: Request): Promise<ResponseDto<UserDto>> {
		const loggedInUser = request.user as ReqUser;

		const user = await this.userService.findUser({
			where: { id: loggedInUser.user.id },
			relations: ["followers", "following"],
		});

		return {
			data: this.userService.toUserDetailedDto(user),
			message: "USER FOUND",
		};
	}

	@Post("onboarding")
	@ApiOkResponseBody({ description: "Updated user details", type: UserDto })
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
			data: this.userService.toUserDetailedDto(updatedUser),
			message: "USER_DATA_UPDATED",
		};
	}
}
