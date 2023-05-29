import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
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
			email: data.email,
			id: data.id,
			name: data.name,
			userConfirmed: data.userConfirmed,
		};

		return dto;
	}

	async create(data: User) {
		return await this.userRepository.save(data);
	}
}
