import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { FindOneOptions, FindOptionsWhere, Repository } from "typeorm";
import { User } from "../Entities/User.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { UserDto } from "../Dto/User.dto";
import { SearchUserQuery } from "src/user/Dto/SearchUserQuery.dto";
import { DeleteUserRequestDTO } from "../Dto/DeleteUser.request.dto";
import { ReqUser } from "src/app.types";
import { APIException } from "src/Exceptions/APIException";
import { ErrorMessages } from "../Dto/enum/ErrorMessages";

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User)
		private userRepository: Repository<User>,
	) {}

	toUserDto(data: User): UserDto {
		const dto: UserDto = {
			id: data.id,
			email: data.email,
			phone_number: data.phone_number,
			description: data.description,
			name: data.name,
			birth_date: data.birth_date,
			userConfirmed: data.userConfirmed,
			email_verified: data.email_verified,
			phone_number_verified: data.phone_number_verified,
			followers: data.followers?.map((user) => this.toUserDto(user)) || [],
			following: data.following?.map((user) => this.toUserDto(user)) || [],
			isFollowed: data.isFollowed,
		};

		return dto;
	}

	async findUser(options: FindOneOptions<User>) {
		return await this.userRepository.findOne(options);
	}

	async create(data: User) {
		return await this.userRepository.save(data);
	}

	async edit(where: FindOptionsWhere<User>, data: User) {
		const org_data = await this.userRepository.findOne({ where });
		const mut_data = { ...org_data, ...data };
		return await this.userRepository.save(mut_data);
	}

	async markUserConfirmedStatus(userId: string, status: boolean) {
		const user = await this.userRepository.findOne({ where: { id: userId } });

		user.userConfirmed = status;
		return await this.userRepository.save(user);
	}

	async markVerifiedStatus(
		userId: string,
		attribute: "email_verified" | "phone_number_verified",
		status: boolean,
	) {
		const user = await this.userRepository.findOne({ where: { id: userId } });

		if (attribute === "email_verified") {
			user.email_verified = status;
		}
		if (attribute === "phone_number_verified") {
			user.phone_number_verified = status;
		}

		return await this.userRepository.save(user);
	}

	async searchUsers(searchUserQuery: SearchUserQuery, loggedInUser: ReqUser) {
		const { name, email, phone_number, exclude_logged_user } = searchUserQuery;

		const queryBuilder = this.userRepository.createQueryBuilder("user");

		if (exclude_logged_user) {
			queryBuilder.andWhere("user.id != :id", { id: loggedInUser.user.id }); // exclude logged in user
		}

		queryBuilder
			.leftJoinAndSelect("user.followers", "followers")
			.leftJoinAndSelect("user.following", "following");

		queryBuilder
			.leftJoinAndSelect(
				"user.following",
				"follower",
				"follower.id = :loggedInUserId",
				{ loggedInUserId: loggedInUser.user.id },
			)
			.loadRelationCountAndMap(
				"user.isFollowed",
				"user.following",
				"follower",
				(qb) =>
					qb
						.andWhere("follower.id = :loggedInUserId", {
							loggedInUserId: loggedInUser.user.id,
						})
						.limit(1),
			);

		if (name) {
			queryBuilder.andWhere("user.name = :name", { name });
		}
		if (email) {
			queryBuilder.andWhere("user.email = :email", { email });
		}
		if (phone_number) {
			queryBuilder.andWhere("user.phone_number = :phone_number", {
				phone_number,
			});
		}

		const users = await queryBuilder.getMany();

		users.forEach((user) => {
			user.isFollowed = !!user.isFollowed;
		});

		console.log(users);

		return users.map((user) => this.toUserDto(user));
	}

	async followUser(userId: string, followerId: string) {
		let user = await this.userRepository.findOne({
			where: { id: userId },
			relations: ["followers"],
		});
		const follower = await this.userRepository.findOne({
			where: { id: followerId },
			relations: ["following"],
		});

		if (user.followers.find((user) => user.id === follower.id)) {
			throw new APIException(ErrorMessages.USER_ALREADY_FOLLOWED);
		}

		user.followers.push(follower);
		user = await this.userRepository.save(user);

		return this.toUserDto(user);
	}

	async unfollowUser(userId: string, followerId: string) {
		let user = await this.userRepository.findOne({
			where: { id: userId },
			relations: ["followers"],
		});
		const follower = await this.userRepository.findOne({
			where: { id: followerId },
			relations: ["following"],
		});

		if (user.followers.find((user) => user.id !== follower.id)) {
			throw new APIException(ErrorMessages.USER_NOT_FOLLOWED);
		}

		user.followers = user.followers.filter((user) => user.id !== follower.id);
		user = await this.userRepository.save(user);

		return this.toUserDto(user);
	}

	async getFollowers(userId: string) {
		const user = await this.userRepository.findOne({
			where: { id: userId },
			relations: ["followers"],
		});

		return user.followers.map((user) => this.toUserDto(user));
	}

	async getFollowing(userId: string) {
		const user = await this.userRepository.findOne({
			where: { id: userId },
			relations: ["following"],
		});

		return user.following.map((user) => this.toUserDto(user));
	}

	async deleteUser(deleteUserRequestDto: DeleteUserRequestDTO) {
		const user = await this.userRepository.delete({
			phone_number: deleteUserRequestDto.phone_number,
		});
		return user;
	}

	async getPopularUsers(loggedInUser: ReqUser) {
		try {
			const queryBuilder = this.userRepository
				.createQueryBuilder("user")
				.andWhere("user.id != :id", { id: loggedInUser.user.id }) // exclude logged in user
				.leftJoinAndSelect("user.following", "following")
				.loadRelationCountAndMap("user.followingCount", "user.following");

			queryBuilder
				.leftJoinAndSelect(
					"user.following",
					"follower",
					"follower.id = :loggedInUserId",
					{ loggedInUserId: loggedInUser.user.id },
				)
				.loadRelationCountAndMap(
					"user.isFollowed",
					"user.following",
					"follower",
					(qb) =>
						qb
							.andWhere("follower.id = :loggedInUserId", {
								loggedInUserId: loggedInUser.user.id,
							})
							.limit(1),
				);

			let users = await queryBuilder.getMany();

			// TODO figure out a way to do this in query builder
			users.forEach((user) => {
				user.isFollowed = !!user.isFollowed;
			});
			users = users.filter((user) => user.followingCount > 0);
			users = users.sort((a, b) => b.followingCount - a.followingCount);

			return users.map((user) => this.toUserDto(user));
		} catch (error) {
			console.log(error);
		}
	}
}
