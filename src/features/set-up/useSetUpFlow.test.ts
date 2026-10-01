import { describe, expect, it } from '@jest/globals';
import { INITIAL_STATE, setUpReducer } from './useSetUpFlow';
import type { SetUpState } from './useSetUpFlow';

const memorybox = { archiveId: '1', folderId: '12', folderLinkId: '112' };

describe('setUpReducer', () => {
	it('is ready once the folder is', () => {
		expect(
			setUpReducer(INITIAL_STATE, {
				type: 'prepared',
				result: { outcome: 'ready', memorybox },
			}),
		).toEqual({ step: 'ready', memorybox });
	});

	it('explains a failure', () => {
		expect(
			setUpReducer(INITIAL_STATE, {
				type: 'prepared',
				result: { outcome: 'failed', reason: 'unexpected', detail: 'HTTP 500' },
			}),
		).toEqual({ step: 'failed', reason: 'unexpected', detail: 'HTTP 500' });
	});

	it('signs out when the session has expired', () => {
		expect(
			setUpReducer(INITIAL_STATE, {
				type: 'prepared',
				result: { outcome: 'signed-out' },
			}),
		).toEqual({ step: 'signed-out' });
	});

	it('prepares again after a failure', () => {
		const failed: SetUpState = { step: 'failed', reason: 'unclaimed-folder' };

		expect(setUpReducer(failed, { type: 'try-again' })).toEqual(INITIAL_STATE);
	});
});
