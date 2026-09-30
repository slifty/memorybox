import { useReducer, useRef } from 'react';
import { signIn, verifyCode } from '../../permanent/auth';
import type {
	FailureReason,
	Session,
	SignInResult,
} from '../../permanent/auth';

export type CodeError = 'invalid-code' | 'expired-code';

export type SignInState =
	| { step: 'credentials' }
	| { step: 'code'; email: string; error?: CodeError }
	| { step: 'signed-in'; session: Session }
	| { step: 'failed'; reason: FailureReason; detail?: string };

export type SignInAction =
	| { type: 'result'; email: string; result: SignInResult }
	| { type: 'start-over' };

export const INITIAL_STATE: SignInState = { step: 'credentials' };

const isCodeError = (reason: FailureReason): reason is CodeError =>
	reason === 'invalid-code' || reason === 'expired-code';

// A wrong or expired code keeps the user on the code step, so they can try
// again without re-entering their password. Any other failure ends the attempt.
const afterFailure = (
	state: SignInState,
	result: Extract<SignInResult, { outcome: 'failed' }>,
): SignInState =>
	state.step === 'code' && isCodeError(result.reason)
		? { step: 'code', email: state.email, error: result.reason }
		: { step: 'failed', reason: result.reason, detail: result.detail };

export const signInReducer = (
	state: SignInState,
	action: SignInAction,
): SignInState => {
	if (action.type === 'start-over') {
		return INITIAL_STATE;
	}
	const { email, result } = action;
	switch (result.outcome) {
		case 'signed-in':
			return { step: 'signed-in', session: result.session };
		case 'code-required':
			return { step: 'code', email };
		case 'failed':
			return afterFailure(state, result);
	}
};

interface SignInFlow {
	state: SignInState;
	submitCredentials: (email: string, password: string) => Promise<void>;
	submitCode: (code: string) => Promise<void>;
	startOver: () => void;
}

// The session lives in memory only, so it ends when the app does.
// Remembering it between launches is issue #8.
export const useSignInFlow = (): SignInFlow => {
	const [state, dispatch] = useReducer(signInReducer, INITIAL_STATE);
	// Counts attempts, so that a request the user has abandoned by starting
	// over cannot move the flow when its answer finally arrives.
	const attemptRef = useRef(0);

	const run = async (
		email: string,
		request: () => Promise<SignInResult>,
	): Promise<void> => {
		attemptRef.current += 1;
		const { current: thisAttempt } = attemptRef;
		const result = await request();
		if (thisAttempt === attemptRef.current) {
			dispatch({ type: 'result', email, result });
		}
	};

	const submitCredentials = async (
		email: string,
		password: string,
	): Promise<void> => {
		await run(email, async () => await signIn(email, password));
	};

	const submitCode = async (code: string): Promise<void> => {
		if (state.step === 'code') {
			const { email } = state;
			await run(email, async () => await verifyCode(email, code));
		}
	};

	const startOver = (): void => {
		attemptRef.current += 1;
		dispatch({ type: 'start-over' });
	};

	return { state, submitCredentials, submitCode, startOver };
};
