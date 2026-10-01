import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import { permanentApiUrl } from '../config';
import { saveMemory } from './memories';
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
});
