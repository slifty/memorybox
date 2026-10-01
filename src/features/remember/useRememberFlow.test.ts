import { describe, expect, it } from '@jest/globals';
import { INITIAL_STATE, rememberReducer } from './useRememberFlow';
import type { RememberState } from './useRememberFlow';
import type { PhotosResult } from '../../photos/library';

const photo = { id: 'a', uri: 'file:///a.jpg', takenAtMs: 0 };
const choosing: RememberState = { step: 'choosing', photos: [photo] };

const afterPhotos = (result: PhotosResult): RememberState =>
	rememberReducer(INITIAL_STATE, { type: 'photos', result });

const afterCheck = (days: string[]): RememberState =>
	rememberReducer(INITIAL_STATE, {
		type: 'checked',
		result: { outcome: 'found', days },
		today: '2026-09-30',
	});

describe('rememberReducer', () => {
	it('offers to remember a day without a memory', () => {
		expect(afterCheck(['2026-09-29'])).toEqual({ step: 'start' });
	});

	it('says so when today is already remembered', () => {
		expect(afterCheck(['2026-09-29', '2026-09-30'])).toEqual({
			step: 'already-remembered',
		});
	});

	it('explains a failure to check', () => {
		expect(
			rememberReducer(INITIAL_STATE, {
				type: 'checked',
				result: { outcome: 'failed', detail: 'HTTP 500' },
				today: '2026-09-30',
			}),
		).toEqual({ step: 'check-failed', detail: 'HTTP 500' });
	});

	it('signs out when the session expires while checking', () => {
		expect(
			rememberReducer(INITIAL_STATE, {
				type: 'checked',
				result: { outcome: 'signed-out' },
				today: '2026-09-30',
			}),
		).toEqual({ step: 'signed-out' });
	});

	it('checks again when asked', () => {
		expect(
			rememberReducer({ step: 'already-remembered' }, { type: 'check-again' }),
		).toEqual(INITIAL_STATE);
	});

	it('offers the photos found', () => {
		expect(afterPhotos({ outcome: 'found', photos: [photo] })).toEqual(
			choosing,
		);
	});

	it('says so when there are no photos today', () => {
		expect(afterPhotos({ outcome: 'found', photos: [] })).toEqual({
			step: 'no-photos',
		});
	});

	it('says so when access to photos is denied', () => {
		expect(afterPhotos({ outcome: 'denied' })).toEqual({ step: 'denied' });
	});

	it('explains a failure to find photos', () => {
		expect(afterPhotos({ outcome: 'failed', detail: 'Oops' })).toEqual({
			step: 'failed',
			detail: 'Oops',
		});
	});

	it('finishes once the memory is saved', () => {
		expect(
			rememberReducer(choosing, {
				type: 'saved',
				result: { outcome: 'saved' },
			}),
		).toEqual({ step: 'remembered' });
	});

	it('explains a failure to save', () => {
		expect(
			rememberReducer(choosing, {
				type: 'saved',
				result: { outcome: 'failed', detail: 'HTTP 500' },
			}),
		).toEqual({ step: 'save-failed', detail: 'HTTP 500' });
	});

	it('signs out when the session expires while saving', () => {
		expect(
			rememberReducer(choosing, {
				type: 'saved',
				result: { outcome: 'signed-out' },
			}),
		).toEqual({ step: 'signed-out' });
	});

	it('starts over without checking again', () => {
		expect(rememberReducer(choosing, { type: 'start-over' })).toEqual({
			step: 'start',
		});
	});

	it('reminisces, and comes back to the remembered day', () => {
		const reminiscing = rememberReducer(
			{ step: 'already-remembered' },
			{ type: 'reminisce' },
		);

		expect(reminiscing).toEqual({ step: 'reminiscing' });
		expect(rememberReducer(reminiscing, { type: 'stop-reminiscing' })).toEqual({
			step: 'already-remembered',
		});
	});
});
