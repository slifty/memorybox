import { useCallback, useEffect, useReducer, useRef } from 'react';
import { signIn, verifyCode } from '../../permanent/auth';
import {
	forgetSession,
	loadSession,
	saveSession,
} from '../../permanent/session';
import type {
	FailureReason,
	Session,
	SignInResult,
} from '../../permanent/auth';

export type CodeError = 'invalid-code' | 'expired-code';

export type SignInState =
	| { step: 'restoring' }
	| { step: 'credentials' }
	| { step: 'code'; email: string; error?: CodeError }
	| { step: 'signed-in'; session: Session }
	| { step: 'failed'; reason: FailureReason; detail?: string };

export type SignInAction =
	| { type: 'restored'; session: Session | undefined }
	| { type: 'result'; email: string; result: SignInResult }
	| { type: 'start-over' };

export const INITIAL_STATE: SignInState = { step: 'restoring' };

const CREDENTIALS: SignInState = { step: 'credentials' };

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

const afterRestoring = (
	state: SignInState,
	session: Session | undefined,
): SignInState => {
	if (state.step !== 'restoring') {
		return state;
	}
	return session === undefined ? CREDENTIALS : { step: 'signed-in', session };
};

const afterResult = (
	state: SignInState,
	email: string,
	result: SignInResult,
): SignInState => {
	switch (result.outcome) {
		case 'signed-in':
			return { step: 'signed-in', session: result.session };
		case 'code-required':
			return { step: 'code', email };
		case 'failed':
			return afterFailure(state, result);
	}
};

export const signInReducer = (
	state: SignInState,
	action: SignInAction,
): SignInState => {
	switch (action.type) {
		case 'restored':
			return afterRestoring(state, action.session);
		case 'result':
			return afterResult(state, action.email, action.result);
		case 'start-over':
			return CREDENTIALS;
	}
};

interface SignInFlow {
	state: SignInState;
	submitCredentials: (email: string, password: string) => Promise<void>;
	submitCode: (code: string) => Promise<void>;
	startOver: () => void;
	signOut: () => void;
}

export const useSignInFlow = (): SignInFlow => {
	const [state, dispatch] = useReducer(signInReducer, INITIAL_STATE);
	// Counts attempts, so that a request the user has abandoned by starting
	// over cannot move the flow when its answer finally arrives.
	const attemptRef = useRef(0);

	useEffect(() => {
		let abandoned = false;
		void loadSession().then((session) => {
			if (!abandoned) {
				dispatch({ type: 'restored', session });
			}
		});
		return (): void => {
			abandoned = true;
		};
	}, []);

	const run = async (
		email: string,
		request: () => Promise<SignInResult>,
	): Promise<void> => {
		attemptRef.current += 1;
		const { current: thisAttempt } = attemptRef;
		const isAbandoned = (): boolean => thisAttempt !== attemptRef.current;
		const result = await request();
		if (isAbandoned()) {
			return;
		}
		if (result.outcome === 'signed-in') {
			await saveSession(result.session);
			if (isAbandoned()) {
				await forgetSession();
				return;
			}
		}
		dispatch({ type: 'result', email, result });
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

	const signOut = useCallback((): void => {
		attemptRef.current += 1;
		void forgetSession().then(() => {
			dispatch({ type: 'start-over' });
		});
	}, []);

	return { state, submitCredentials, submitCode, startOver, signOut };
};
