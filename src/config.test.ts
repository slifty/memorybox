import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type * as Config from './config';

// Expo inlines EXPO_PUBLIC_ variables at build time, so each case sets the
// variable and then loads the module fresh.
const setApiUrl = (value: string | undefined): void => {
	if (value === undefined) {
		delete process.env.EXPO_PUBLIC_PERMANENT_API_URL;
	} else {
		process.env.EXPO_PUBLIC_PERMANENT_API_URL = value;
	}
};

const loadApiUrl = (): string => {
	let url = '';
	jest.isolateModules(() => {
		({ permanentApiUrl: url } = jest.requireActual<typeof Config>('./config'));
	});
	return url;
};

afterEach(() => {
	setApiUrl(undefined);
});

describe('permanentApiUrl', () => {
	it.each([
		['unset', undefined, 'https://app.staging.permanent.org/api'],
		['blank', '  ', 'https://app.staging.permanent.org/api'],
		['set', 'https://dev.permanent.org/api', 'https://dev.permanent.org/api'],
		[
			'set with a trailing slash',
			'https://dev.permanent.org/api/',
			'https://dev.permanent.org/api',
		],
	])('uses the right URL when %s', (_, value, expected) => {
		setApiUrl(value);

		expect(loadApiUrl()).toBe(expected);
	});
});
