import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { FindOneOptions, FindOptionsWhere, Repository } from "typeorm";
import { User } from "../Entities/User.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { UserDto } from "../Dto/User.dto";
import { SearchUserQuery } from "src/user/Dto/SearchUserQuery.dto";

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
			name: data.name,
			birth_date: data.birth_date,
			userConfirmed: data.userConfirmed,
			email_verified: data.email_verified,
			phone_number_verified: data.phone_number_verified,
			followers: data.followers?.map((user) => this.toUserDto(user)) || [],
			following: data.following?.map((user) => this.toUserDto(user)) || [],
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

	async searchUsers(searchUserQuery: SearchUserQuery) {
		const { name, email, phone_number } = searchUserQuery;

		const where: FindOptionsWhere<User> = {};

		if (name) {
			where.name = name;
		}
		if (email) {
			where.email = email;
		}
		if (phone_number) {
			where.phone_number = phone_number;
		}

		const users = await this.userRepository.find({ where });

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
			throw new UnprocessableEntityException("USER_ALREADY_FOLLOWED");
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
			throw new UnprocessableEntityException("USER_NOT_FOLLOWED");
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
}
