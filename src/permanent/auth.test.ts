/* eslint-disable @typescript-eslint/naming-convention --
   Permanent's API names its fields in PascalCase (`RequestVO`, `AccountVO`). */
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import { permanentApiUrl } from '../config';
import { signIn, verifyCode } from './auth';
import {
	account,
	failure,
	httpError,
	loginSuccess,
	success,
	verifySuccess,
} from './testing';

const fetchMock = jest.fn<typeof fetch>();

beforeEach(() => {
	fetchMock.mockReset();
	fetchMock.mockRejectedValue(new Error('Unstubbed request'));
	jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
});

afterEach(() => {
	jest.restoreAllMocks();
});

const sentBody = (): unknown => {
	const body = fetchMock.mock.calls[0]?.[1]?.body;
	return typeof body === 'string' ? JSON.parse(body) : undefined;
};

describe('signIn', () => {
	it('posts the credentials to /auth/login', async () => {
		fetchMock.mockResolvedValueOnce(loginSuccess());
		await signIn('ada@example.com', 'correct horse');

		expect(fetchMock.mock.calls[0]?.[0]).toBe(`${permanentApiUrl}/auth/login`);
		expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
			method: 'POST',
			credentials: 'include',
		});
		expect(sentBody()).toEqual({
			RequestVO: {
				data: [
					{
						AccountVO: { primaryEmail: 'ada@example.com' },
						AccountPasswordVO: { password: 'correct horse' },
					},
				],
			},
		});
	});

	it('returns the session', async () => {
		fetchMock.mockResolvedValueOnce(loginSuccess());

		expect(await signIn('ada@example.com', 'correct horse')).toEqual({
			outcome: 'signed-in',
			session: {
				token: 'auth-token',
				account: { email: 'ada@example.com', name: 'Ada' },
			},
		});
	});

	it('treats an empty name as no name', async () => {
		fetchMock.mockResolvedValueOnce(
			success({
				AccountVO: { primaryEmail: 'ada@example.com', fullName: '' },
				SimpleVO: { key: 'authToken', value: 'auth-token' },
			}),
		);

		expect(await signIn('ada@example.com', 'correct horse')).toMatchObject({
			session: { account: { name: undefined } },
		});
	});

	it('reports when a verification code is required', async () => {
		fetchMock.mockResolvedValueOnce(failure('warning.auth.mfaToken'));

		expect(await signIn('ada@example.com', 'correct horse')).toEqual({
			outcome: 'code-required',
		});
	});

	it('recognizes rejected credentials', async () => {
		fetchMock.mockResolvedValueOnce(failure('warning.signin.unknown'));

		expect(await signIn('ada@example.com', 'wrong')).toEqual({
			outcome: 'failed',
			reason: 'invalid-credentials',
		});
	});

	it.each([
		[
			'an unrecognized code',
			failure('warning.something.new'),
			'warning.something.new',
		],
		['an HTTP error', httpError(500), 'HTTP 500'],
		['a success without a token', success(account), 'No session'],
	])('explains %s', async (_, response, detail) => {
		fetchMock.mockResolvedValueOnce(response);

		expect(await signIn('ada@example.com', 'correct horse')).toEqual({
			outcome: 'failed',
			reason: 'unexpected',
			detail,
		});
	});

	it('explains a network failure', async () => {
		fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

		expect(await signIn('ada@example.com', 'correct horse')).toEqual({
			outcome: 'failed',
			reason: 'unexpected',
			detail: 'Network request failed',
		});
	});
});

describe('verifyCode', () => {
	it('posts the code to /auth/verify', async () => {
		fetchMock.mockResolvedValueOnce(verifySuccess());
		await verifyCode('ada@example.com', '1234');

		expect(fetchMock.mock.calls[0]?.[0]).toBe(`${permanentApiUrl}/auth/verify`);
		expect(sentBody()).toEqual({
			RequestVO: {
				data: [
					{
						AccountVO: { primaryEmail: 'ada@example.com' },
						AuthVO: { type: 'type.auth.mfaValidation', token: '1234' },
					},
				],
			},
		});
	});

	it('returns the access token, not the trust token', async () => {
		fetchMock.mockResolvedValueOnce(verifySuccess());

		expect(await verifyCode('ada@example.com', '1234')).toMatchObject({
			session: { token: 'auth-token' },
		});
	});

	it.each([
		['warning.auth.token_does_not_match', 'invalid-code'],
		['warning.auth.token_expired', 'expired-code'],
	])('recognizes %s', async (code, reason) => {
		fetchMock.mockResolvedValueOnce(failure(code));

		expect(await verifyCode('ada@example.com', '0000')).toEqual({
			outcome: 'failed',
			reason,
		});
	});
});
