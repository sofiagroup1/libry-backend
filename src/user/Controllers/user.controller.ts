import {
	Controller,
	Get,
	Param,
	Post,
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";
import { UserService } from "src/auth/Services/User.service";
import { SearchUserQuery } from "../Dto/SearchUserQuery.dto";
import { ApiOkResponseBody } from "src/Decorators/ApiResponseBody.decorator";
import { UserDto } from "src/auth/Dto/User.dto";
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { ReqUser } from "src/app.types";
import { AuthGuard } from "@nestjs/passport";
import { ResponseDto } from "src/Dtos/Response.dto";

@Controller("user")
@ApiTags("User")
@UseGuards(AuthGuard("jwt"))
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get("")
	@ApiOkResponseBody({
		description: "Find users",
		type: UserDto,
		isArray: true,
	})
	async getUsers(
		@Query() searchUserQuery: SearchUserQuery,
		@Req() request: Request,
	): Promise<ResponseDto<UserDto[]>> {
		const loggedInUser = request.user as ReqUser;
		const data = await this.userService.searchUsers(
			searchUserQuery,
			loggedInUser,
		);

		return { data, message: "USERS_FOUND" };
	}

	@Get("popular")
	@ApiOkResponseBody({
		description: "Get popular users",
		type: UserDto,
		isArray: true,
	})
	async getPopularUsers(
		@Req() request: Request,
	): Promise<ResponseDto<UserDto[]>> {
		const loggedInUser = request.user as ReqUser;

		const data = await this.userService.getPopularUsers(loggedInUser);
		return { data, message: "POPULAR_USERS_FOUND" };
	}

	@Get(":id")
	@ApiOkResponseBody({
		description: "Get user by id",
		type: UserDto,
	})
	async getUserById(@Param("id") id: string): Promise<ResponseDto<UserDto>> {
		const data = this.userService.toUserDto(
			await this.userService.findUser({
				where: { id },
				relations: ["followers", "following"],
			}),
		);

		return { data, message: "USER_FOUND" };
	}

	@Post(":id/follow")
	@ApiOkResponseBody({
		description: "Follow user by id",
		type: UserDto,
	})
	async followUser(
		@Param("id") id: string,
		@Req() request: Request,
	): Promise<ResponseDto<UserDto>> {
		const loggedInUser = request.user as ReqUser;

		const data = await this.userService.followUser(loggedInUser.user.id, id);

		return { data, message: "USER_FOLLOWED" };
	}

	@Post(":id/unfollow")
	@ApiOkResponseBody({
		description: "UnFollow user by id",
		type: UserDto,
	})
	async unfollowUser(
		@Param("id") id: string,
		@Req() request: Request,
	): Promise<ResponseDto<UserDto>> {
		const loggedInUser = request.user as ReqUser;

		const data = await this.userService.unfollowUser(loggedInUser.user.id, id);

		return { data, message: "USER_UNFOLLOWED" };
	}

	@Get(":id/followers")
	@ApiOkResponseBody({
		description: "get Followers by user id",
		type: UserDto,
		isArray: true,
	})
	async getFollowers(@Param("id") id: string): Promise<ResponseDto<UserDto[]>> {
		const data = await this.userService.getFollowers(id);

		return { data, message: "FOLLOWERS_FOUND" };
	}

	@Get(":id/following")
	@ApiOkResponseBody({
		description: "get Following by user id",
		type: UserDto,
		isArray: true,
	})
	async getFollowing(@Param("id") id: string): Promise<ResponseDto<UserDto[]>> {
		const data = await this.userService.getFollowing(id);

		return { data, message: "FOLLOWING_FOUND" };
	}
}
