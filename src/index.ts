
import {ApiUtil} from './core/ApiUtil.js';
import {requestMethods, stop} from './core/constants.js';
import type {ApiUtilInstance} from './types/apiUtil.js';
import type {Input, Options} from './types/options.js';
import {validateAndMerge} from './utils/merge.js';
import {type Mutable} from './utils/types.js';

const createInstance = (defaults?: Partial<Options>): ApiUtilInstance => {
	// eslint-disable-next-line @typescript-eslint/promise-function-async
	const apiUtil: Partial<Mutable<ApiUtilInstance>> = (input: Input, options?: Options) => ApiUtil.create(input, validateAndMerge(defaults, options));

	for (const method of requestMethods) {
		// eslint-disable-next-line @typescript-eslint/promise-function-async
		apiUtil[method] = (input: Input, options?: Options) => ApiUtil.create(input, validateAndMerge(defaults, options, {method}));
	}

	apiUtil.create = (newDefaults?: Partial<Options>) => createInstance(validateAndMerge(newDefaults));
	apiUtil.extend = (newDefaults?: Partial<Options>) => createInstance(validateAndMerge(defaults, newDefaults));
	apiUtil.stop = stop;

	return apiUtil as ApiUtilInstance;
};

const apiUtil = createInstance();

export default apiUtil;

export type {ApiUtilInstance} from './types/apiUtil.js';

export type {
	Input,
	Options,
	NormalizedOptions,
	RetryOptions,
	SearchParamsOption,
	DownloadProgress,
} from './types/options.js';

export type {
	Hooks,
	BeforeRequestHook,
	BeforeRetryHook,
	BeforeRetryState,
	BeforeErrorHook,
	AfterResponseHook,
} from './types/hooks.js';

export type {ResponsePromise} from './types/ResponsePromise.js';
export type {ApiUtilResponse} from './types/response.js';
export {HTTPError} from './errors/HTTPError.js';
export {TimeoutError} from './errors/TimeoutError.js';
