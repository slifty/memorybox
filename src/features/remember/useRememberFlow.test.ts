import { describe, expect, it } from '@jest/globals';
import { INITIAL_STATE, rememberReducer } from './useRememberFlow';
import type { RememberState } from './useRememberFlow';
import type { PhotosResult } from '../../photos/library';

const photo = { id: 'a', uri: 'file:///a.jpg', takenAtMs: 0 };
const choosing: RememberState = { step: 'choosing', photos: [photo] };

const afterPhotos = (result: PhotosResult): RememberState =>
	rememberReducer(INITIAL_STATE, { type: 'photos', result });

describe('rememberReducer', () => {
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
		).toEqual({ step: 'failed', detail: 'HTTP 500' });
	});

	it('starts over from any step', () => {
		expect(rememberReducer(choosing, { type: 'start-over' })).toEqual(
			INITIAL_STATE,
		);
	});
});
