// Transport for Permanent's API: request envelopes, and reading the responses.
//
// A request through `post` wraps its payload as
// `{ RequestVO: { data: [payload] } }`. Its response is HTTP 200 with a body
// shaped like
// `{ isSuccessful, Results: [{ message: [code], data: [values] }] }`, whether
// or not the call succeeded; `message` holds codes such as
// `warning.signin.unknown` when it did not.

/* eslint-disable @typescript-eslint/naming-convention --
   Permanent's API names its fields in PascalCase (`RequestVO`, `Results`). */
import { HTTP_STATUS } from '@pdc/http-status-codes';
import { permanentApiUrl, permanentStelaUrl } from '../config';

export type Values = Record<string, unknown>;

export type Reply =
	| { ok: true; values: Values }
	| { ok: false; code: string }
	// The call did not produce a readable reply at all.
	| { ok: false; code: undefined; detail: string };

export const isValues = (value: unknown): value is Values =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const firstOf = (value: unknown): unknown =>
	Array.isArray(value) ? (value as unknown[])[0] : undefined;

// Reads a non-empty string field, treating anything else as absent.
export const stringAt = (values: unknown, key: string): string | undefined =>
	isValues(values) && typeof values[key] === 'string' && values[key] !== ''
		? values[key]
		: undefined;

const read = (body: unknown): Reply => {
	const result = isValues(body) ? firstOf(body.Results) : undefined;
	if (!isValues(body) || !isValues(result)) {
		return { ok: false, code: undefined, detail: 'Unreadable response' };
	}
	if (body.isSuccessful !== true) {
		const code = firstOf(result.message);
		return typeof code === 'string'
			? { ok: false, code }
			: { ok: false, code: undefined, detail: 'Failure without a code' };
	}
	const values = firstOf(result.data);
	return isValues(values)
		? { ok: true, values }
		: { ok: false, code: undefined, detail: 'Success without data' };
};

export const describe = (error: unknown): string =>
	error instanceof Error ? error.message : 'Unknown error';

export const post = async (path: string, payload: Values): Promise<Reply> => {
	try {
		const response = await fetch(`${permanentApiUrl}${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			// Permanent ties some multi-step calls together with a session cookie,
			// such as a sign-in and its two-factor verification.
			credentials: 'include',
			body: JSON.stringify({ RequestVO: { data: [payload] } }),
		});
		if (!response.ok) {
			return {
				ok: false,
				code: undefined,
				detail: `HTTP ${String(response.status)}`,
			};
		}
		return read(await response.json());
	} catch (error) {
		return { ok: false, code: undefined, detail: describe(error) };
	}
};

export interface Failure {
	ok: false;
	detail: string;
	signedOut?: true;
}

export type Attempt<T> = { ok: true; value: T } | Failure;

export type Done = { ok: true } | Failure;

export const idAt = (values: unknown, key: string): string | undefined => {
	if (!isValues(values)) {
		return undefined;
	}
	const { [key]: value } = values;
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}
	return typeof value === 'string' && value !== '' ? value : undefined;
};

const send = async (
	url: string,
	init: RequestInit,
): Promise<Attempt<Values>> => {
	try {
		const response = await fetch(url, init);
		if (response.status === HTTP_STATUS.CLIENT_ERROR.UNAUTHORIZED.valueOf()) {
			return { ok: false, detail: 'HTTP 401', signedOut: true };
		}
		if (!response.ok) {
			return { ok: false, detail: `HTTP ${String(response.status)}` };
		}
		const body: unknown = await response.json();
		return isValues(body)
			? { ok: true, value: body }
			: { ok: false, detail: 'Unreadable response' };
	} catch (error) {
		return { ok: false, detail: describe(error) };
	}
};

const versionTwoHeaders = (token: string): Record<string, string> => ({
	Authorization: `Bearer ${token}`,
	'Content-Type': 'application/json',
	'Request-Version': '2',
});

export const getFromStela = async (
	token: string,
	path: string,
): Promise<Attempt<Values>> =>
	await send(`${permanentStelaUrl}${path}`, {
		headers: versionTwoHeaders(token),
	});

export const postVersionTwo = async (
	token: string,
	path: string,
	body: Values,
): Promise<Attempt<Values>> =>
	await send(`${permanentApiUrl}${path}`, {
		method: 'POST',
		headers: versionTwoHeaders(token),
		body: JSON.stringify(body),
	});
