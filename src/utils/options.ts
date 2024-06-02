import {apiUtilOptionKeys, requestOptionsRegistry} from '../core/constants.js';

export const findUnknownOptions = (
	request: Request,
	options: Record<string, unknown>,
): Record<string, unknown> => {
	const unknownOptions: Record<string, unknown> = {};

	for (const key in options) {
		if (!(key in requestOptionsRegistry) && !(key in apiUtilOptionKeys) && !(key in request)) {
			unknownOptions[key] = options[key];
		}
	}

	return unknownOptions;
};
