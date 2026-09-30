import { beforeEach, describe, expect, it } from '@jest/globals';
import { findTodaysPhotos } from './library';
import { fakeLibrary, photoTakenAt, resetFakeLibrary } from './testing';

const now = new Date(2026, 8, 29, 15, 30);
const morning = new Date(2026, 8, 29, 9, 15);
const noon = new Date(2026, 8, 29, 12, 0);
const yesterday = new Date(2026, 8, 28, 23, 59);

beforeEach(resetFakeLibrary);

describe('findTodaysPhotos', () => {
	it('finds the photos taken today, newest first', async () => {
		fakeLibrary.photos = [photoTakenAt(morning), photoTakenAt(noon)];

		expect(await findTodaysPhotos(now)).toEqual({
			outcome: 'found',
			photos: [
				{
					id: photoTakenAt(noon).id,
					uri: `file:///${photoTakenAt(noon).id}.jpg`,
					takenAtMs: noon.getTime(),
				},
				{
					id: photoTakenAt(morning).id,
					uri: `file:///${photoTakenAt(morning).id}.jpg`,
					takenAtMs: morning.getTime(),
				},
			],
		});
	});

	it.each([
		['photos from yesterday', photoTakenAt(yesterday)],
		['videos', photoTakenAt(noon, 'video')],
	])('leaves out %s', async (_, photo) => {
		fakeLibrary.photos = [photo];

		expect(await findTodaysPhotos(now)).toEqual({
			outcome: 'found',
			photos: [],
		});
	});

	it('leaves out a photo it cannot read', async () => {
		fakeLibrary.photos = [photoTakenAt(morning), photoTakenAt(noon)];
		fakeLibrary.unreadableIds = [photoTakenAt(noon).id];

		expect(await findTodaysPhotos(now)).toMatchObject({
			outcome: 'found',
			photos: [{ id: photoTakenAt(morning).id }],
		});
	});

	it('explains a failure when it can read none of the photos', async () => {
		fakeLibrary.photos = [photoTakenAt(noon)];
		fakeLibrary.unreadableIds = [photoTakenAt(noon).id];

		expect(await findTodaysPhotos(now)).toEqual({
			outcome: 'failed',
			detail: `Cannot read ${photoTakenAt(noon).id}`,
		});
	});

	it('reports when access is denied', async () => {
		fakeLibrary.accessGranted = false;

		expect(await findTodaysPhotos(now)).toEqual({ outcome: 'denied' });
	});

	it('explains a failure', async () => {
		fakeLibrary.failure = new Error('Library unavailable');

		expect(await findTodaysPhotos(now)).toEqual({
			outcome: 'failed',
			detail: 'Library unavailable',
		});
	});
});
