import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type * as Config from './config';

// Expo inlines EXPO_PUBLIC_ variables at build time, so each case sets the
// variable and then loads the module fresh.
const setVariable = (name: string, value: string | undefined): void => {
	if (value === undefined) {
		Reflect.deleteProperty(process.env, name);
	} else {
		process.env[name] = value;
	}
};

const loadConfig = (): typeof Config => {
	const loaded: Array<typeof Config> = [];
	jest.isolateModules(() => {
		loaded.push(jest.requireActual<typeof Config>('./config'));
	});
	const [config] = loaded;
	if (config === undefined) {
		throw new Error('Config did not load');
	}
	return config;
};

afterEach(() => {
	setVariable('EXPO_PUBLIC_PERMANENT_API_URL', undefined);
	setVariable('EXPO_PUBLIC_PERMANENT_STELA_URL', undefined);
});

interface Setting {
	name: 'permanentApiUrl' | 'permanentStelaUrl';
	variable: string;
	staging: string;
	other: string;
}

const SETTINGS: Setting[] = [
	{
		name: 'permanentApiUrl',
		variable: 'EXPO_PUBLIC_PERMANENT_API_URL',
		staging: 'https://app.staging.permanent.org/api',
		other: 'https://dev.permanent.org/api',
	},
	{
		name: 'permanentStelaUrl',
		variable: 'EXPO_PUBLIC_PERMANENT_STELA_URL',
		staging: 'https://api.staging.permanent.org/api/v2',
		other: 'https://api.permanent.org/api/v2',
	},
];

describe.each(SETTINGS)('$name', ({ name, variable, staging, other }) => {
	it.each([
		['unset', undefined, staging],
		['blank', '  ', staging],
		['set', other, other],
		['set with a trailing slash', `${other}/`, other],
	])('uses the right URL when %s', (_, value, expected) => {
		setVariable(variable, value);

		expect(loadConfig()[name]).toBe(expected);
	});
});
