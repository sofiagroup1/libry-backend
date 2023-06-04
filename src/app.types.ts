export interface ResponseBody<T = object, U = unknown> {
	data: T;
	message: string;
	metadata?: U;
	error?: any;
}
