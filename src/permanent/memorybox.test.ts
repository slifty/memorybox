import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import { permanentApiUrl, permanentStelaUrl } from '../config';
import { prepareMemorybox } from './memorybox';
import {
	DESTINATION_URL,
	MEMORYBOX,
	UPLOAD_FIELDS,
	UPLOAD_URL,
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

const requestTo = (url: string): RequestInit | undefined =>
	fetchMock.mock.calls.find(([input]) => input === url)?.[1];

const sentJson = (url: string): unknown => {
	const body = requestTo(url)?.body;
	return typeof body === 'string' ? JSON.parse(body) : undefined;
};

const sentHeaders = (url: string): unknown => requestTo(url)?.headers;

const writes = (): unknown[] =>
	fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST');

describe('prepareMemorybox', () => {
	it('uses a Memorybox folder it created before, changing nothing', async () => {
		expect(await prepareMemorybox(session)).toEqual({
			outcome: 'ready',
			memorybox: MEMORYBOX,
		});
		expect(writes()).toEqual([]);
	});

	it('reads with the access token', async () => {
		await prepareMemorybox(session);

		expect(sentHeaders(`${permanentStelaUrl}/accounts/me`)).toHaveProperty(
			'Authorization',
			'Bearer auth-token',
		);
	});

	it('refuses a Memorybox folder it did not create', async () => {
		fakePermanent.memorybox = 'unclaimed';

		expect(await prepareMemorybox(session)).toEqual({
			outcome: 'failed',
			reason: 'unclaimed-folder',
		});
		expect(writes()).toEqual([]);
	});

	it('refuses a Memorybox folder whose contents it cannot read', async () => {
		fakePermanent.memorybox = 'unreadable';

		expect(await prepareMemorybox(session)).toEqual({
			outcome: 'failed',
			reason: 'unclaimed-folder',
		});
		expect(writes()).toEqual([]);
	});

	it('finishes setting up an empty Memorybox folder', async () => {
		fakePermanent.memorybox = 'empty';

		expect(await prepareMemorybox(session)).toEqual({
			outcome: 'ready',
			memorybox: MEMORYBOX,
		});
		expect(fakePermanent.memorybox).toBe('claimed');
		expect(requestTo(`${permanentApiUrl}/folder/post`)).toBeUndefined();
	});

	describe('without a Memorybox folder', () => {
		beforeEach(() => {
			fakePermanent.memorybox = 'missing';
		});

		it('creates one and marks it as its own', async () => {
			expect(await prepareMemorybox(session)).toEqual({
				outcome: 'ready',
				memorybox: MEMORYBOX,
			});
			expect(fakePermanent.memorybox).toBe('claimed');
		});

		it('creates the folder in My Files', async () => {
			await prepareMemorybox(session);

			const headers = sentHeaders(`${permanentApiUrl}/folder/post`);
			expect(headers).toHaveProperty('Authorization', 'Bearer auth-token');
			expect(headers).toHaveProperty(['Request-Version'], '2');
			expect(sentJson(`${permanentApiUrl}/folder/post`)).toEqual({
				displayName: 'Memorybox',
				parentFolderId: 11,
				failOnDuplicateName: true,
			});
		});

		it('asks where to upload the marker', async () => {
			await prepareMemorybox(session);

			expect(sentJson(`${permanentApiUrl}/record/getPresignedUrl`)).toEqual({
				displayName: '.memorybox',
				parentFolderId: 12,
				uploadFileName: '.memorybox',
				fileType: 'application/json',
				size: 25,
			});
		});

		it('uploads the marker to the storage URL it was given', async () => {
			await prepareMemorybox(session);

			expect(fakeFiles.uploads).toEqual([
				{
					uri: 'file:///cache/.memorybox',
					url: UPLOAD_URL,
					options: expect.objectContaining({
						fieldName: 'file',
						parameters: {
							...UPLOAD_FIELDS,
							'Content-Type': 'application/json',
						},
					}),
				},
			]);
			expect(fakeFiles.written.get('file:///cache/.memorybox')).toBe(
				'{"createdBy":"memorybox"}',
			);
		});

		it('explains a failed upload to storage', async () => {
			fakeFiles.uploadStatus = 403;

			expect(await prepareMemorybox(session)).toEqual({
				outcome: 'failed',
				reason: 'unexpected',
				detail: 'HTTP 403',
			});
		});

		it('registers the uploaded marker', async () => {
			await prepareMemorybox(session);

			const headers = sentHeaders(`${permanentApiUrl}/record/registerRecord`);
			expect(headers).toHaveProperty('Authorization', 'Bearer auth-token');
			expect(headers).toHaveProperty(['Request-Version'], '2');
			expect(sentJson(`${permanentApiUrl}/record/registerRecord`)).toEqual({
				displayName: '.memorybox',
				parentFolderId: 12,
				uploadFileName: '.memorybox',
				fileType: 'application/json',
				size: 25,
				s3url: DESTINATION_URL,
				failOnDuplicateName: true,
			});
		});

		it.each([
			'/folder/post',
			'/record/getPresignedUrl',
			'/record/registerRecord',
		])('explains a failure at %s', async (failingPath) => {
			fakePermanent.failingPath = failingPath;

			expect(await prepareMemorybox(session)).toEqual({
				outcome: 'failed',
				reason: 'unexpected',
				detail: 'HTTP 500',
			});
		});
	});

	it.each(['/accounts/me', '/archives/', '/folders/'])(
		'explains a failure at %s',
		async (failingPath) => {
			fakePermanent.failingPath = failingPath;

			expect(await prepareMemorybox(session)).toEqual({
				outcome: 'failed',
				reason: 'unexpected',
				detail: 'HTTP 500',
			});
		},
	);

	it('reports an expired token as signed out', async () => {
		fakePermanent.tokenExpired = true;

		expect(await prepareMemorybox(session)).toEqual({ outcome: 'signed-out' });
	});

	it('explains a network failure', async () => {
		fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

		expect(await prepareMemorybox(session)).toEqual({
			outcome: 'failed',
			reason: 'unexpected',
			detail: 'Network request failed',
		});
	});
});
