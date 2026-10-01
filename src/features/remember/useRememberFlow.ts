import { useEffect, useReducer, useRef } from 'react';
import { AppState } from 'react-native';
import {
	dayOf,
	findRememberedDays,
	saveMemory,
} from '../../permanent/memories';
import { findTodaysPhotos } from '../../photos/library';
import type { Session } from '../../permanent/auth';
import type { Folder } from '../../permanent/folders';
import type {
	RememberedDaysResult,
	SaveMemoryResult,
} from '../../permanent/memories';
import type { Photo, PhotosResult } from '../../photos/library';

export type RememberState =
	| { step: 'checking' }
	| { step: 'check-failed'; detail: string }
	| { step: 'already-remembered' }
	| { step: 'start' }
	| { step: 'choosing'; photos: Photo[] }
	| { step: 'no-photos' }
	| { step: 'denied' }
	| { step: 'failed'; detail: string }
	| { step: 'save-failed'; detail: string }
	| { step: 'remembered' }
	| { step: 'reminiscing' }
	| { step: 'signed-out' };

export type RememberAction =
	| { type: 'checked'; result: RememberedDaysResult; today: string }
	| { type: 'check-again' }
	| { type: 'photos'; result: PhotosResult }
	| { type: 'saved'; result: SaveMemoryResult }
	| { type: 'start-over' }
	| { type: 'reminisce' }
	| { type: 'stop-reminiscing' };

export const INITIAL_STATE: RememberState = { step: 'checking' };

const afterCheck = (
	result: RememberedDaysResult,
	today: string,
): RememberState => {
	switch (result.outcome) {
		case 'failed':
			return { step: 'check-failed', detail: result.detail };
		case 'signed-out':
			return { step: 'signed-out' };
		case 'found':
			return result.days.includes(today)
				? { step: 'already-remembered' }
				: { step: 'start' };
	}
};

const afterPhotos = (result: PhotosResult): RememberState => {
	switch (result.outcome) {
		case 'found':
			return result.photos.length === 0
				? { step: 'no-photos' }
				: { step: 'choosing', photos: result.photos };
		case 'denied':
			return { step: 'denied' };
		case 'failed':
			return { step: 'failed', detail: result.detail };
	}
};

const afterSave = (result: SaveMemoryResult): RememberState => {
	switch (result.outcome) {
		case 'saved':
			return { step: 'remembered' };
		case 'failed':
			return { step: 'save-failed', detail: result.detail };
		case 'signed-out':
			return { step: 'signed-out' };
	}
};

export const rememberReducer = (
	_state: RememberState,
	action: RememberAction,
): RememberState => {
	switch (action.type) {
		case 'checked':
			return afterCheck(action.result, action.today);
		case 'check-again':
			return INITIAL_STATE;
		case 'photos':
			return afterPhotos(action.result);
		case 'saved':
			return afterSave(action.result);
		case 'start-over':
			return { step: 'start' };
		case 'reminisce':
			return { step: 'reminiscing' };
		case 'stop-reminiscing':
			return { step: 'already-remembered' };
	}
};

interface RememberFlow {
	state: RememberState;
	findPhotos: () => Promise<void>;
	capture: (photo: Photo) => Promise<void>;
	startOver: () => void;
	checkAgain: () => void;
	reminisce: () => void;
	stopReminiscing: () => void;
}

export const useRememberFlow = (
	session: Session,
	memorybox: Folder,
	onSignedOut: () => void,
): RememberFlow => {
	const [state, dispatch] = useReducer(rememberReducer, INITIAL_STATE);
	const attemptRef = useRef(0);
	const checking = state.step === 'checking';
	const alreadyRemembered = state.step === 'already-remembered';
	const signedOut = state.step === 'signed-out';

	useEffect(() => {
		if (signedOut) {
			onSignedOut();
		}
	}, [signedOut, onSignedOut]);

	useEffect(() => {
		if (!alreadyRemembered) {
			return undefined;
		}
		const subscription = AppState.addEventListener('change', (appState) => {
			if (appState === 'active') {
				dispatch({ type: 'check-again' });
			}
		});
		return (): void => {
			subscription.remove();
		};
	}, [alreadyRemembered]);

	useEffect(() => {
		if (!checking) {
			return undefined;
		}
		let abandoned = false;
		void findRememberedDays(session, memorybox).then((result) => {
			if (!abandoned) {
				dispatch({ type: 'checked', result, today: dayOf(Date.now()) });
			}
		});
		return (): void => {
			abandoned = true;
		};
	}, [session, memorybox, checking]);

	const run = async (request: () => Promise<RememberAction>): Promise<void> => {
		attemptRef.current += 1;
		const { current: thisAttempt } = attemptRef;
		const action = await request();
		if (thisAttempt === attemptRef.current) {
			dispatch(action);
		}
	};

	const findPhotos = async (): Promise<void> => {
		await run(async () => ({
			type: 'photos',
			result: await findTodaysPhotos(),
		}));
	};

	const capture = async ({ uri, takenAtMs }: Photo): Promise<void> => {
		await run(async () => ({
			type: 'saved',
			result: await saveMemory(session, memorybox, {
				photoUri: uri,
				takenAtMs,
			}),
		}));
	};

	const startOver = (): void => {
		attemptRef.current += 1;
		dispatch({ type: 'start-over' });
	};

	const checkAgain = (): void => {
		dispatch({ type: 'check-again' });
	};

	const reminisce = (): void => {
		dispatch({ type: 'reminisce' });
	};

	const stopReminiscing = (): void => {
		dispatch({ type: 'stop-reminiscing' });
	};

	return {
		state,
		findPhotos,
		capture,
		startOver,
		checkAgain,
		reminisce,
		stopReminiscing,
	};
};
