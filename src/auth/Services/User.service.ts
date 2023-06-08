import { Injectable } from "@nestjs/common";
import { FindOneOptions, FindOptionsWhere, Repository } from "typeorm";
import { User } from "../Entities/User.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { UserDto } from "../Dto/User.dto";

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
}
