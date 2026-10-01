import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import { permanentApiUrl } from '../config';
import { findRememberedDays, saveMemory } from './memories';
import {
	MEMORYBOX,
	fakeFiles,
	fakePermanent,
	fakePermanentFetch,
	resetFakePermanent,
} from './testing';

const fetchMock = jest.fn<typeof fetch>();

const session = {
	token: 'auth-token',
	account: { email: 'ada@example.com', name: 'Ada' },
};

beforeEach(() => {
	resetFakePermanent();
	fetchMock.mockReset();
	fetchMock.mockImplementation(fakePermanentFetch);
	jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
});

afterEach(() => {
	jest.restoreAllMocks();
});

const registered = (): unknown => {
	const body = fetchMock.mock.calls.find(
		([url]) => url === `${permanentApiUrl}/record/registerRecord`,
	)?.[1]?.body;
	return typeof body === 'string' ? JSON.parse(body) : undefined;
};

const lateEvening = new Date(2026, 8, 30, 23, 45).getTime();

describe('saveMemory', () => {
	it('names the photo after the day it was taken', async () => {
		expect(
			await saveMemory(session, MEMORYBOX, {
				photoUri: 'file:///photos/IMG_0001.HEIC',
				takenAtMs: lateEvening,
			}),
		).toEqual({ outcome: 'saved' });
		expect(registered()).toMatchObject({
			displayName: '2026-09-30.heic',
			uploadFileName: '2026-09-30.heic',
			fileType: 'image/heic',
			parentFolderId: 12,
		});
	});

	it('uploads the photo file itself', async () => {
		await saveMemory(session, MEMORYBOX, {
			photoUri: 'file:///photos/IMG_0001.jpg',
			takenAtMs: lateEvening,
		});

		expect(fakeFiles.uploads).toMatchObject([
			{ uri: 'file:///photos/IMG_0001.jpg' },
		]);
	});

	it('uploads a format it does not recognize as plain data', async () => {
		await saveMemory(session, MEMORYBOX, {
			photoUri: 'file:///photos/IMG_0001.xyz',
			takenAtMs: lateEvening,
		});

		expect(registered()).toMatchObject({
			displayName: '2026-09-30.xyz',
			fileType: 'application/octet-stream',
		});
	});

	it('explains a photo without a format', async () => {
		expect(
			await saveMemory(session, MEMORYBOX, {
				photoUri: 'file:///photos/IMG_0001',
				takenAtMs: lateEvening,
			}),
		).toEqual({ outcome: 'failed', detail: 'Unknown photo format' });
	});

	it('explains a failed upload', async () => {
		fakePermanent.failingPath = '/record/getPresignedUrl';

		expect(
			await saveMemory(session, MEMORYBOX, {
				photoUri: 'file:///photos/IMG_0001.jpg',
				takenAtMs: lateEvening,
			}),
		).toEqual({ outcome: 'failed', detail: 'HTTP 500' });
	});

	it('reports an expired token as signed out', async () => {
		fakePermanent.tokenExpired = true;

		expect(
			await saveMemory(session, MEMORYBOX, {
				photoUri: 'file:///photos/IMG_0001.jpg',
				takenAtMs: lateEvening,
			}),
		).toEqual({ outcome: 'signed-out' });
	});
});

const json = (body: unknown): Response =>
	new Response(JSON.stringify(body), { status: 200 });

const record = (
	displayName: string,
	uploadFileName: string,
	folderLinkId: string,
): Record<string, unknown> => ({
	itemType: 'record',
	displayName,
	uploadFileName,
	folderLinkId,
});

describe('findRememberedDays', () => {
	it('finds the days its memories are named for', async () => {
		fakePermanent.memories = ['2026-09-29.jpg', '2026-09-30.heic'];

		expect(await findRememberedDays(session, MEMORYBOX)).toEqual({
			outcome: 'found',
			days: ['2026-09-29', '2026-09-30'],
		});
	});

	it('reads the day from the display name when the file name has none', async () => {
		fetchMock
			.mockResolvedValueOnce(
				json({
					items: [record('2026-09-30', 'upload.bin', '1')],
					pagination: { nextCursor: '1' },
				}),
			)
			.mockResolvedValueOnce(json({ items: [], pagination: {} }));

		expect(await findRememberedDays(session, MEMORYBOX)).toEqual({
			outcome: 'found',
			days: ['2026-09-30'],
		});
	});

	it('ignores files that are not named for a day', async () => {
		fetchMock
			.mockResolvedValueOnce(
				json({
					items: [
						record('.memorybox', '.memorybox', '1'),
						record('Notes', 'notes.txt', '2'),
						record('2026-9-30', '2026-9-30.jpg', '3'),
						record('2026-09-3x', '2026-09-3x.jpg', '4'),
						{
							itemType: 'folder',
							folderId: '5',
							folderLinkId: '5',
							displayName: '2026-09-30',
						},
					],
					pagination: { nextCursor: '5' },
				}),
			)
			.mockResolvedValueOnce(json({ items: [], pagination: {} }));

		expect(await findRememberedDays(session, MEMORYBOX)).toEqual({
			outcome: 'found',
			days: [],
		});
	});

	it('goes by the display name when a memory was renamed', async () => {
		fetchMock
			.mockResolvedValueOnce(
				json({
					items: [record('2026-10-01', '2026-09-30.jpg', '1')],
					pagination: { nextCursor: '1' },
				}),
			)
			.mockResolvedValueOnce(json({ items: [], pagination: {} }));

		expect(await findRememberedDays(session, MEMORYBOX)).toEqual({
			outcome: 'found',
			days: ['2026-10-01'],
		});
	});

	it.each([
		[
			'an item of a kind it does not know',
			{ itemType: 'something-new', folderLinkId: '1' },
		],
		['a record without a name', { itemType: 'record', folderLinkId: '1' }],
	])('fails rather than guess past %s', async (_, item) => {
		fetchMock
			.mockResolvedValueOnce(
				json({ items: [item], pagination: { nextCursor: '1' } }),
			)
			.mockResolvedValueOnce(json({ items: [], pagination: {} }));

		expect(await findRememberedDays(session, MEMORYBOX)).toEqual({
			outcome: 'failed',
			detail: 'Unreadable memory in Memorybox',
		});
	});

	it('does not count a memory renamed to something other than a day', async () => {
		fetchMock
			.mockResolvedValueOnce(
				json({
					items: [record('Notes', '2026-09-30.jpg', '1')],
					pagination: { nextCursor: '1' },
				}),
			)
			.mockResolvedValueOnce(json({ items: [], pagination: {} }));

		expect(await findRememberedDays(session, MEMORYBOX)).toEqual({
			outcome: 'found',
			days: [],
		});
	});

	it('reads the day from the file name when there is no display name', async () => {
		fetchMock
			.mockResolvedValueOnce(
				json({
					items: [
						{
							itemType: 'record',
							uploadFileName: '2026-09-30.jpg',
							folderLinkId: '1',
						},
					],
					pagination: { nextCursor: '1' },
				}),
			)
			.mockResolvedValueOnce(json({ items: [], pagination: {} }));

		expect(await findRememberedDays(session, MEMORYBOX)).toEqual({
			outcome: 'found',
			days: ['2026-09-30'],
		});
	});

	it('counts a day once however many files it has', async () => {
		fakePermanent.memories = ['2026-09-30.jpg', '2026-09-30.heic'];

		expect(await findRememberedDays(session, MEMORYBOX)).toEqual({
			outcome: 'found',
			days: ['2026-09-30'],
		});
	});

	it('explains a folder it cannot read', async () => {
		fakePermanent.failingPath = '/folders/';

		expect(await findRememberedDays(session, MEMORYBOX)).toEqual({
			outcome: 'failed',
			detail: 'HTTP 500',
		});
	});

	it('reports an expired token as signed out', async () => {
		fakePermanent.tokenExpired = true;

		expect(await findRememberedDays(session, MEMORYBOX)).toEqual({
			outcome: 'signed-out',
		});
	});
});
