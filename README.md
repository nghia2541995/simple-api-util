

## Benefits over plain `fetch`

- Simpler API
- Method shortcuts
- Treats non-2xx status codes as errors (after redirects)
- Retries failed requests
- JSON option
- Timeout support
- URL prefix option
- Instances with custom defaults
- Hooks

## Install

```sh
npm install 
```



## Usage

```js
import apiUtil from 'apiUtil';

const json = await apiUtil.post('https://example.com', {json: {foo: true}}).json();

console.log(json);
//=> `{data: '🦄'}`
```

With plain `fetch`, it would be:

```js
class HTTPError extends Error {}

const response = await fetch('https://example.com', {
	method: 'POST',
	body: JSON.stringify({foo: true}),
	headers: {
		'content-type': 'application/json'
	}
});

if (!response.ok) {
	throw new HTTPError(`Fetch error: ${response.statusText}`);
}

const json = await response.json();

console.log(json);
//=> `{data: '🦄'}`
```

If you are using [Deno](https://github.com/denoland/deno), import apiUtil from a URL. For example, using a CDN:

```js
import apiUtil from 'https://esm.sh/apiUtil';
```

## API

### apiUtil(input, options?)


### apiUtil.get(input, options?)
### apiUtil.post(input, options?)
### apiUtil.put(input, options?)
### apiUtil.patch(input, options?)
### apiUtil.head(input, options?)
### apiUtil.delete(input, options?)

Sets `options.method` to the method name and makes a request.

When using a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) instance as `input`, any URL altering options (such as `prefixUrl`) will be ignored.

#### options

Type: `object`

In addition to all the [`fetch` options](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options), it supports these options:

##### method

Type: `string`\
Default: `'get'`

HTTP method used to make the request.

Internally, the standard methods (`GET`, `POST`, `PUT`, `PATCH`, `HEAD` and `DELETE`) are uppercased in order to avoid server errors due to case sensitivity.

##### json


##### searchParams

Type: `string | object<string, string | number | boolean> | Array<Array<string | number | boolean>> | URLSearchParams`\
Default: `''`



##### prefixUrl

Type: `string | URL`



```js
import apiUtil from 'apiUtil';

// On https://example.com

const response = await apiUtil('unicorn', {prefixUrl: '/api'});
//=> 'https://example.com/api/unicorn'

const response2 = await apiUtil('unicorn', {prefixUrl: 'https://cats.com'});
//=> 'https://cats.com/unicorn'
```



##### retry

Type: `object | number`\
Default:
- `limit`: `2`
- `methods`: `get` `put` `head` `delete` `options` `trace`
- `statusCodes`: [`408`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/408) [`413`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/413) [`429`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) [`500`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500) [`502`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/502) [`503`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/503) [`504`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/504)
- `maxRetryAfter`: `undefined`
- `backoffLimit`: `undefined`
- `delay`: `attemptCount => 0.3 * (2 ** (attemptCount - 1)) * 1000`

An object representing `limit`, `methods`, `statusCodes` and `maxRetryAfter` fields for maximum retry count, allowed methods, allowed status codes and maximum [`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) time.

If `retry` is a number, it will be used as `limit` and other defaults will remain in place.

If `maxRetryAfter` is set to `undefined`, it will use `options.timeout`. If [`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After) header is greater than `maxRetryAfter`, it will cancel the request.

The `backoffLimit` option is the upper limit of the delay per retry in milliseconds.
To clamp the delay, set `backoffLimit` to 1000, for example.
By default, the delay is calculated with `0.3 * (2 ** (attemptCount - 1)) * 1000`. The delay increases exponentially.

The `delay` option can be used to change how the delay between retries is calculated. The function receives one parameter, the attempt count, starting at `1`.

Retries are not triggered following a [timeout](#timeout).

```js
import apiUtil from 'apiUtil';

const json = await apiUtil('https://example.com', {
	retry: {
		limit: 10,
		methods: ['get'],
		statusCodes: [413],
		backoffLimit: 3000
	}
}).json();
```

##### timeout

Type: `number | false`\
Default: `10000`

Timeout in milliseconds for getting a response, including any retries. Can not be greater than 2147483647.
If set to `false`, there will be no timeout.

##### hooks

Type: `object<string, Function[]>`\
Default: `{beforeRequest: [], beforeRetry: [], afterResponse: []}`

Hooks allow modifications during the request lifecycle. Hook functions may be async and are run serially.

###### hooks.beforeRequest

Type: `Function[]`\
Default: `[]`



```js
import apiUtil from 'apiUtil';

const api = apiUtil.extend({
	hooks: {
		beforeRequest: [
			request => {
				request.headers.set('X-Requested-With', 'apiUtil');
			}
		]
	}
});

const response = await api.get('https://example.com/api/users');
```

###### hooks.beforeRetry

Type: `Function[]`\
Default: `[]`



```js
import apiUtil from 'apiUtil';

const response = await apiUtil('https://example.com', {
	hooks: {
		beforeRetry: [
			async ({request, options, error, retryCount}) => {
				const token = await apiUtil('https://example.com/refresh-token');
				request.headers.set('Authorization', `token ${token}`);
			}
		]
	}
});
```

###### hooks.beforeError

Type: `Function[]`\
Default: `[]`

This hook enables you to modify the `HTTPError` right before it is thrown. The hook function receives a `HTTPError` as an argument and should return an instance of `HTTPError`.

```js
import apiUtil from 'apiUtil';

await apiUtil('https://example.com', {
	hooks: {
		beforeError: [
			error => {
				const {response} = error;
				if (response && response.body) {
					error.name = 'GitHubError';
					error.message = `${response.body.message} (${response.status})`;
				}

				return error;
			}
		]
	}
});
```

###### hooks.afterResponse

Type: `Function[]`\
Default: `[]`



```js
import apiUtil from 'apiUtil';

const response = await apiUtil('https://example.com', {
	hooks: {
		afterResponse: [
			(_request, _options, response) => {
				// You could do something with the response, for example, logging.
				log(response);

				// Or return a `Response` instance to overwrite the response.
				return new Response('A different response', {status: 200});
			},

			// Or retry with a fresh token on a 403 error
			async (request, options, response) => {
				if (response.status === 403) {
					// Get a fresh token
					const token = await apiUtil('https://example.com/token').text();

					// Retry with the token
					request.headers.set('Authorization', `token ${token}`);

					return apiUtil(request);
				}
			}
		]
	}
});
```

##### throwHttpErrors

Type: `boolean`\
Default: `true`



##### onDownloadProgress

Type: `Function`

Download progress event handler.



```js
import apiUtil from 'apiUtil';

const response = await apiUtil('https://example.com', {
	onDownloadProgress: (progress, chunk) => {
		// Example output:
		// `0% - 0 of 1271 bytes`
		// `100% - 1271 of 1271 bytes`
		console.log(`${progress.percent * 100}% - ${progress.transferredBytes} of ${progress.totalBytes} bytes`);
	}
});
```

##### parseJson

Type: `Function`\
Default: `JSON.parse()`



```js
import apiUtil from 'apiUtil';
import bourne from '@hapijs/bourne';

const json = await apiUtil('https://example.com', {
	parseJson: text => bourne(text)
}).json();
```

##### stringifyJson

Type: `Function`\
Default: `JSON.stringify()`

User-defined JSON-stringifying function.

Use-cases:
1. Stringify JSON with a custom `replacer` function.

```js
import apiUtil from 'apiUtil';
import {DateTime} from 'luxon';

const json = await apiUtil('https://example.com', {
	stringifyJson: data => JSON.stringify(data, (key, value) => {
		if (key.endsWith('_at')) {
			return DateTime.fromISO(value).toSeconds();
		}

		return value;
	})
}).json();
```

##### fetch

Type: `Function`\
Default: `fetch`



```js
import apiUtil from 'apiUtil';
import fetch from 'isomorphic-unfetch';

const json = await apiUtil('https://example.com', {fetch}).json();
```

### apiUtil.extend(defaultOptions)



```js
import apiUtil from 'apiUtil';

const url = 'https://sindresorhus.com';

const original = apiUtil.create({
	headers: {
		rainbow: 'rainbow',
		unicorn: 'unicorn'
	}
});

const extended = original.extend({
	headers: {
		rainbow: undefined
	}
});

const response = await extended(url).json();

console.log('rainbow' in response);
//=> false

console.log('unicorn' in response);
//=> true
```

### apiUtil.create(defaultOptions)

Create a new apiUtil instance with complete new defaults.

```js
import apiUtil from 'apiUtil';

// On https://my-site.com

const api = apiUtil.create({prefixUrl: 'https://example.com/api'});

const response = await api.get('users/123');
//=> 'https://example.com/api/users/123'

const response = await api.get('/status', {prefixUrl: ''});
//=> 'https://my-site.com/status'
```

#### defaultOptions

Type: `object`

### apiUtil.stop



```js
import apiUtil from 'apiUtil';

const options = {
	hooks: {
		beforeRetry: [
			async ({request, options, error, retryCount}) => {
				const shouldStopRetry = await apiUtil('https://example.com/api');
				if (shouldStopRetry) {
					return apiUtil.stop;
				}
			}
		]
	}
};

// Note that response will be `undefined` in case `apiUtil.stop` is returned.
const response = await apiUtil.post('https://example.com', options);

// Using `.text()` or other body methods is not supported.
const text = await apiUtil('https://example.com', options).text();
```

### HTTPError



```js
try {
	await apiUtil('https://example.com').json();
} catch (error) {
	if (error.name === 'HTTPError') {
		const errorJson = await error.response.json();
	}
}
```

### TimeoutError



## Tips

### Sending form data



```js
import apiUtil from 'apiUtil';

// `multipart/form-data`
const formData = new FormData();
formData.append('food', 'fries');
formData.append('drink', 'icetea');

const response = await apiUtil.post(url, {body: formData});
```


```js
import apiUtil from 'apiUtil';

// `application/x-www-form-urlencoded`
const searchParams = new URLSearchParams();
searchParams.set('food', 'fries');
searchParams.set('drink', 'icetea');

const response = await apiUtil.post(url, {body: searchParams});
```

### Setting a custom `Content-Type`



```js
import apiUtil from 'apiUtil';

const json = await apiUtil.post('https://example.com', {
	headers: {
		'content-type': 'application/json'
	},
	json: {
		foo: true
	},
}).json();

console.log(json);
//=> `{data: '🦄'}`
```

### Cancellation



Example:

```js
import apiUtil from 'apiUtil';

const controller = new AbortController();
const {signal} = controller;

setTimeout(() => {
	controller.abort();
}, 5000);

try {
	console.log(await apiUtil(url, {signal}).text());
} catch (error) {
	if (error.name === 'AbortError') {
		console.log('Fetch aborted');
	} else {
		console.error('Fetch error:', error);
	}
}
```

