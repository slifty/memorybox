import { describe, expect, it } from '@jest/globals';
import { INITIAL_STATE, signInReducer } from './useSignInFlow';
import type { SignInState } from './useSignInFlow';
import type { SignInResult } from '../../permanent/auth';

const email = 'ada@example.com';
const session = { token: 'auth-token', account: { email, name: 'Ada' } };
const credentialsStep: SignInState = { step: 'credentials' };
const codeStep: SignInState = { step: 'code', email };

const after = (state: SignInState, result: SignInResult): SignInState =>
	signInReducer(state, { type: 'result', email, result });

describe('signInReducer', () => {
	it('restores a remembered session', () => {
		expect(signInReducer(INITIAL_STATE, { type: 'restored', session })).toEqual(
			{ step: 'signed-in', session },
		);
	});

	it('asks for credentials when no session is remembered', () => {
		expect(
			signInReducer(INITIAL_STATE, { type: 'restored', session: undefined }),
		).toEqual(credentialsStep);
	});

	it('ignores a restored session once restoring is over', () => {
		expect(signInReducer(codeStep, { type: 'restored', session })).toEqual(
			codeStep,
		);
	});

	it('signs in', () => {
		expect(after(credentialsStep, { outcome: 'signed-in', session })).toEqual({
			step: 'signed-in',
			session,
		});
	});

	it('asks for a code when one is required', () => {
		expect(after(credentialsStep, { outcome: 'code-required' })).toEqual(
			codeStep,
		);
	});

	it('ends the attempt when the credentials are rejected', () => {
		expect(
			after(credentialsStep, {
				outcome: 'failed',
				reason: 'invalid-credentials',
			}),
		).toEqual({ step: 'failed', reason: 'invalid-credentials' });
	});

	it.each(['invalid-code', 'expired-code'] as const)(
		'stays on the code step after %s',
		(reason) => {
			expect(after(codeStep, { outcome: 'failed', reason })).toEqual({
				step: 'code',
				email,
				error: reason,
			});
		},
	);

	it('ends the attempt on an unexpected failure during the code step', () => {
		expect(
			after(codeStep, {
				outcome: 'failed',
				reason: 'unexpected',
				detail: 'HTTP 500',
			}),
		).toEqual({ step: 'failed', reason: 'unexpected', detail: 'HTTP 500' });
	});

	it('starts over from any step', () => {
		expect(signInReducer(codeStep, { type: 'start-over' })).toEqual(
			credentialsStep,
		);
	});
});
