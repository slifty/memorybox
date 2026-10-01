import { beforeEach, describe, expect, it } from '@jest/globals';
import { forgetSession, loadSession, saveSession } from './session';
import { fakeSecureStore, resetFakePermanent } from './testing';

const session = {
	token: 'auth-token',
	account: { email: 'ada@example.com', name: 'Ada' },
};

beforeEach(() => {
	resetFakePermanent();
});

describe('loadSession', () => {
	it('loads a saved session', async () => {
		await saveSession(session);

		expect(await loadSession()).toEqual(session);
	});

	it('loads a saved session without a name', async () => {
		const unnamed = {
			token: 'auth-token',
			account: { email: 'ada@example.com', name: undefined },
		};
		await saveSession(unnamed);

		expect(await loadSession()).toEqual(unnamed);
	});

	it('finds nothing before a session is saved', async () => {
		expect(await loadSession()).toBeUndefined();
	});

	it('finds nothing once the session is forgotten', async () => {
		await saveSession(session);
		await forgetSession();

		expect(await loadSession()).toBeUndefined();
	});

	it.each([
		['unreadable JSON', '{'],
		['a session without a token', JSON.stringify({ account: session.account })],
		[
			'a session without an email',
			JSON.stringify({ token: 'auth-token', account: {} }),
		],
	])('ignores %s', async (_, stored) => {
		fakeSecureStore.items.set('session', stored);

		expect(await loadSession()).toBeUndefined();
	});

	it('finds nothing when the store cannot be read', async () => {
		await saveSession(session);
		fakeSecureStore.failure = new Error('Keychain unavailable');

		expect(await loadSession()).toBeUndefined();
	});
});

describe('saveSession', () => {
	it('carries on when the store cannot be written', async () => {
		fakeSecureStore.failure = new Error('Keychain unavailable');

		await expect(saveSession(session)).resolves.toBeUndefined();
	});
});

describe('forgetSession', () => {
	it('carries on when the store cannot be written', async () => {
		fakeSecureStore.failure = new Error('Keychain unavailable');

		await expect(forgetSession()).resolves.toBeUndefined();
	});
});
