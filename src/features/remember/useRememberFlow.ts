import { useReducer, useRef } from 'react';
import { saveMemory } from '../../permanent/memories';
import { findTodaysPhotos } from '../../photos/library';
import type { Session } from '../../permanent/auth';
import type { Folder } from '../../permanent/folders';
import type { SaveMemoryResult } from '../../permanent/memories';
import type { Photo, PhotosResult } from '../../photos/library';

export type RememberState =
	| { step: 'start' }
	| { step: 'choosing'; photos: Photo[] }
	| { step: 'no-photos' }
	| { step: 'denied' }
	| { step: 'failed'; detail: string }
	| { step: 'remembered' };

export type RememberAction =
	| { type: 'photos'; result: PhotosResult }
	| { type: 'saved'; result: SaveMemoryResult }
	| { type: 'start-over' };

export const INITIAL_STATE: RememberState = { step: 'start' };

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

const afterSave = (result: SaveMemoryResult): RememberState =>
	result.outcome === 'saved'
		? { step: 'remembered' }
		: { step: 'failed', detail: result.detail };

export const rememberReducer = (
	_state: RememberState,
	action: RememberAction,
): RememberState => {
	switch (action.type) {
		case 'photos':
			return afterPhotos(action.result);
		case 'saved':
			return afterSave(action.result);
		case 'start-over':
			return INITIAL_STATE;
	}
};

interface RememberFlow {
	state: RememberState;
	findPhotos: () => Promise<void>;
	capture: (photo: Photo) => Promise<void>;
	startOver: () => void;
}

export const useRememberFlow = (
	session: Session,
	memorybox: Folder,
): RememberFlow => {
	const [state, dispatch] = useReducer(rememberReducer, INITIAL_STATE);
	const attemptRef = useRef(0);

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

	return { state, findPhotos, capture, startOver };
};
