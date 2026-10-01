import { describe, expect, it } from '@jest/globals';
import { INITIAL_STATE, reminisceReducer } from './useReminisceFlow';
import type { ReminisceAction, ReminisceState } from './useReminisceFlow';
import type { MemoriesResult } from '../../permanent/memories';

const memories = [
	{ day: '2026-09-28', imageUrl: 'https://cdn.example.com/a' },
	{ day: '2026-09-29', imageUrl: 'https://cdn.example.com/b' },
	{ day: '2026-09-30', imageUrl: 'https://cdn.example.com/c' },
];

const gathered = (
	result: MemoriesResult,
	randomFraction = 0,
): ReminisceAction => ({
	type: 'gathered',
	result,
	today: '2026-10-01',
	randomFraction,
});

describe('reminisceReducer', () => {
	it.each([
		[0, memories[0]],
		[0.5, memories[1]],
		[0.999, memories[2]],
	])(
		'shows the memory a random fraction of %d lands on',
		(fraction, memory) => {
			expect(
				reminisceReducer(
					INITIAL_STATE,
					gathered({ outcome: 'found', memories }, fraction),
				),
			).toEqual({ step: 'showing', memory, today: '2026-10-01' });
		},
	);

	it('leaves out today and any later day', () => {
		const later = [
			{ day: '2026-10-01', imageUrl: 'https://cdn.example.com/today' },
			{ day: '2026-10-02', imageUrl: 'https://cdn.example.com/tomorrow' },
		];

		expect(
			reminisceReducer(
				INITIAL_STATE,
				gathered(
					{ outcome: 'found', memories: [...memories, ...later] },
					0.999,
				),
			),
		).toEqual({ step: 'showing', memory: memories[2], today: '2026-10-01' });
	});

	it('says when there are no memories', () => {
		expect(
			reminisceReducer(
				INITIAL_STATE,
				gathered({ outcome: 'found', memories: [] }),
			),
		).toEqual({ step: 'empty' });
	});

	it('explains a failure', () => {
		expect(
			reminisceReducer(
				INITIAL_STATE,
				gathered({ outcome: 'failed', detail: 'HTTP 500' }),
			),
		).toEqual({ step: 'failed', detail: 'HTTP 500' });
	});

	it('signs out when the session has expired', () => {
		expect(
			reminisceReducer(INITIAL_STATE, gathered({ outcome: 'signed-out' })),
		).toEqual({ step: 'signed-out' });
	});

	it('gathers again after a failure', () => {
		const failed: ReminisceState = { step: 'failed', detail: 'HTTP 500' };

		expect(reminisceReducer(failed, { type: 'try-again' })).toEqual(
			INITIAL_STATE,
		);
	});
});
