import type { Session } from './auth';

export interface Memory {
	photoUri: string;
	takenAtMs: number;
}

export type SaveMemoryResult =
	{ outcome: 'saved' } | { outcome: 'failed'; detail: string };

export const saveMemory = async (
	_session: Session,
	_memory: Memory,
): Promise<SaveMemoryResult> => await Promise.resolve({ outcome: 'saved' });
