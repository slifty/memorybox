import { useEffect, useReducer } from 'react';
import { dayOf, findMemories } from '../../permanent/memories';
import type { Session } from '../../permanent/auth';
import type { Folder } from '../../permanent/folders';
import type { MemoriesResult, SavedMemory } from '../../permanent/memories';

export type ReminisceState =
	| { step: 'gathering' }
	| { step: 'showing'; memory: SavedMemory; today: string }
	| { step: 'empty' }
	| { step: 'failed'; detail: string }
	| { step: 'signed-out' };

export type ReminisceAction =
	| {
			type: 'gathered';
			result: MemoriesResult;
			today: string;
			randomFraction: number;
	  }
	| { type: 'try-again' };

export const INITIAL_STATE: ReminisceState = { step: 'gathering' };

export const reminisceReducer = (
	_state: ReminisceState,
	action: ReminisceAction,
): ReminisceState => {
	if (action.type === 'try-again') {
		return INITIAL_STATE;
	}
	const { result, today, randomFraction } = action;
	switch (result.outcome) {
		case 'found': {
			const earlier = result.memories.filter(({ day }) => day < today);
			const { [Math.floor(randomFraction * earlier.length)]: memory } = earlier;
			return memory === undefined
				? { step: 'empty' }
				: { step: 'showing', memory, today };
		}
		case 'failed':
			return { step: 'failed', detail: result.detail };
		case 'signed-out':
			return { step: 'signed-out' };
	}
};

interface ReminisceFlow {
	state: ReminisceState;
	tryAgain: () => void;
}

export const useReminisceFlow = (
	session: Session,
	memorybox: Folder,
	onSignedOut: () => void,
): ReminisceFlow => {
	const [state, dispatch] = useReducer(reminisceReducer, INITIAL_STATE);
	const gathering = state.step === 'gathering';
	const signedOut = state.step === 'signed-out';

	useEffect(() => {
		if (signedOut) {
			onSignedOut();
		}
	}, [signedOut, onSignedOut]);

	useEffect(() => {
		if (!gathering) {
			return undefined;
		}
		let abandoned = false;
		void findMemories(session, memorybox).then((result) => {
			if (!abandoned) {
				dispatch({
					type: 'gathered',
					result,
					today: dayOf(Date.now()),
					randomFraction: Math.random(),
				});
			}
		});
		return (): void => {
			abandoned = true;
		};
	}, [session, memorybox, gathering]);

	const tryAgain = (): void => {
		dispatch({ type: 'try-again' });
	};

	return { state, tryAgain };
};
