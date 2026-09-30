// Signing in to Permanent.
//
// Permanent signs users in through FusionAuth, but on its own servers: the app
// posts credentials to Permanent, which returns the FusionAuth access token.
// No FusionAuth configuration or secret belongs in the app.

/* eslint-disable @typescript-eslint/naming-convention --
   Permanent's API names its fields in PascalCase (`AccountVO`, `AuthVO`). */
import { isValues, post, stringAt } from './api';
import type { Reply, Values } from './api';

export interface Account {
	email: string;
	name: string | undefined;
}

export interface Session {
	token: string;
	account: Account;
}

export type FailureReason =
	'invalid-credentials' | 'invalid-code' | 'expired-code' | 'unexpected';

export type SignInResult =
	| { outcome: 'signed-in'; session: Session }
	| { outcome: 'code-required' }
	| { outcome: 'failed'; reason: FailureReason; detail?: string };

const CODE_REQUIRED = 'warning.auth.mfaToken';

const FAILURE_REASONS = new Map<string, FailureReason>([
	['warning.signin.unknown', 'invalid-credentials'],
	['warning.auth.token_does_not_match', 'invalid-code'],
	['warning.auth.token_expired', 'expired-code'],
]);

// Permanent labels each value it returns with a `key`. The access token is the
// one keyed `authToken`; a two-factor verification also returns a
// `trustToken`, which must not be mistaken for it.
const findAuthToken = (values: Values): string | undefined =>
	Object.values(values)
		.filter(isValues)
		.filter((value) => value.key === 'authToken')
		.map((value) => stringAt(value, 'value'))
		.find((token) => token !== undefined);

const toSession = (values: Values): Session | undefined => {
	const token = findAuthToken(values);
	const email = stringAt(values.AccountVO, 'primaryEmail');
	if (token === undefined || email === undefined) {
		return undefined;
	}
	return {
		token,
		account: { email, name: stringAt(values.AccountVO, 'fullName') },
	};
};

const interpret = (reply: Reply): SignInResult => {
	if (reply.ok) {
		const session = toSession(reply.values);
		return session === undefined
			? { outcome: 'failed', reason: 'unexpected', detail: 'No session' }
			: { outcome: 'signed-in', session };
	}
	if (reply.code === undefined) {
		return { outcome: 'failed', reason: 'unexpected', detail: reply.detail };
	}
	if (reply.code === CODE_REQUIRED) {
		return { outcome: 'code-required' };
	}
	const reason = FAILURE_REASONS.get(reply.code);
	return reason === undefined
		? { outcome: 'failed', reason: 'unexpected', detail: reply.code }
		: { outcome: 'failed', reason };
};

export const signIn = async (
	email: string,
	password: string,
): Promise<SignInResult> =>
	interpret(
		await post('/auth/login', {
			AccountVO: { primaryEmail: email },
			AccountPasswordVO: { password },
		}),
	);

// Completes a sign-in that `signIn` answered with `code-required`, using the
// code Permanent sent by email or text message.
export const verifyCode = async (
	email: string,
	code: string,
): Promise<SignInResult> =>
	interpret(
		await post('/auth/verify', {
			AccountVO: { primaryEmail: email },
			AuthVO: { type: 'type.auth.mfaValidation', token: code },
		}),
	);
