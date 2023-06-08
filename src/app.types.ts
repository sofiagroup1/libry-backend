import { User } from "./auth/Entities/User.entity";

export interface ResponseBody<T = object, U = unknown> {
	data: T;
	message: string;
	metadata?: U;
	error?: any;
}

export type ReqUser = {
	sub: string;
	user: User;
};
