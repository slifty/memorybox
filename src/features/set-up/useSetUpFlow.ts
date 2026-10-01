import { useEffect, useReducer } from 'react';
import { prepareMemorybox } from '../../permanent/memorybox';
import type { Session } from '../../permanent/auth';
import type { Folder } from '../../permanent/folders';
import type {
	PrepareFailureReason,
	PrepareResult,
} from '../../permanent/memorybox';

export type SetUpState =
	| { step: 'preparing' }
	| { step: 'ready'; memorybox: Folder }
	| { step: 'failed'; reason: PrepareFailureReason; detail?: string };

export type SetUpAction =
	{ type: 'prepared'; result: PrepareResult } | { type: 'try-again' };

export const INITIAL_STATE: SetUpState = { step: 'preparing' };

export const setUpReducer = (
	_state: SetUpState,
	action: SetUpAction,
): SetUpState => {
	if (action.type === 'try-again') {
		return INITIAL_STATE;
	}
	const { result } = action;
	return result.outcome === 'ready'
		? { step: 'ready', memorybox: result.memorybox }
		: { step: 'failed', reason: result.reason, detail: result.detail };
};

interface SetUpFlow {
	state: SetUpState;
	tryAgain: () => void;
}

export const useSetUpFlow = (session: Session): SetUpFlow => {
	const [state, dispatch] = useReducer(setUpReducer, INITIAL_STATE);
	const preparing = state.step === 'preparing';

	useEffect(() => {
		if (!preparing) {
			return undefined;
		}
		let abandoned = false;
		void prepareMemorybox(session).then((result) => {
			if (!abandoned) {
				dispatch({ type: 'prepared', result });
			}
		});
		return (): void => {
			abandoned = true;
		};
	}, [session, preparing]);

	const tryAgain = (): void => {
		dispatch({ type: 'try-again' });
	};

	return { state, tryAgain };
};
