export type ApiUtilResponse = {
	json: <T = unknown>() => Promise<T>;
} & Response;
