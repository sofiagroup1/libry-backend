import { User } from "./auth/Entities/User.entity";

export type ReqUser = {
	sub: string;
	user: User;
};
