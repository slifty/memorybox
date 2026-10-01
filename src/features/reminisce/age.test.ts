import { describe, expect, it } from '@jest/globals';
import { daysBetween, describeAge } from './age';

describe('daysBetween', () => {
	it('counts calendar days', () => {
		expect(daysBetween('2026-09-28', '2026-10-01')).toBe(3);
	});

	it('counts a day that changes the clocks as one day', () => {
		expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
		expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
	});
});

describe('describeAge', () => {
	it.each([
		['2026-09-30', 'Yesterday'],
		['2026-09-28', '3 days ago'],
		['2025-10-01', '365 days ago'],
	])('describes %s as %s', (day, description) => {
		expect(describeAge(day, '2026-10-01')).toBe(description);
	});
});
