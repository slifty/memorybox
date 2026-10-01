import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import { uploadDeviceFile, uploadTextFile } from './records';
import {
	DESTINATION_URL,
	MEMORYBOX,
	UPLOAD_URL,
	fakeFiles,
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
	fetchMock.mockRejectedValue(new Error('Unstubbed request'));
	jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
});

afterEach(() => {
	jest.restoreAllMocks();
});

const json = (body: unknown): Response =>
	new Response(JSON.stringify(body), { status: 200 });

const uploadTarget = (): Response =>
	json({
		destinationUrl: DESTINATION_URL,
		presignedPost: { url: UPLOAD_URL, fields: { key: 'k' } },
	});

const photo = {
	uri: 'file:///photos/IMG_0001.jpg',
	name: '2026-09-30.jpg',
	type: 'image/jpeg',
};

const sentBody = (call: number): unknown => {
	const body = fetchMock.mock.calls[call]?.[1]?.body;
	return typeof body === 'string' ? JSON.parse(body) : undefined;
};

describe('uploadDeviceFile', () => {
	it('describes the file by its size on disk', async () => {
		fakeFiles.sizeBytes = 3_000_000;
		fetchMock
			.mockResolvedValueOnce(uploadTarget())
			.mockResolvedValueOnce(json({ recordId: 30 }));

		expect(await uploadDeviceFile(session, MEMORYBOX, photo)).toEqual({
			ok: true,
		});
		expect(sentBody(0)).toEqual({
			displayName: '2026-09-30.jpg',
			parentFolderId: 12,
			uploadFileName: '2026-09-30.jpg',
			fileType: 'image/jpeg',
			size: 3_000_000,
		});
		expect(fakeFiles.uploads).toMatchObject([
			{ uri: photo.uri, url: UPLOAD_URL },
		]);
	});

	it('explains a file it cannot read', async () => {
		fakeFiles.unreadableUris = [photo.uri];

		expect(await uploadDeviceFile(session, MEMORYBOX, photo)).toEqual({
			ok: false,
			detail: `Cannot read ${photo.uri}`,
		});
	});

	it('refuses an upload target with a field that is not text', async () => {
		fetchMock.mockResolvedValueOnce(
			json({
				destinationUrl: DESTINATION_URL,
				presignedPost: { url: UPLOAD_URL, fields: { key: 'k', status: 201 } },
			}),
		);

		expect(await uploadDeviceFile(session, MEMORYBOX, photo)).toEqual({
			ok: false,
			detail: 'Unreadable upload target',
		});
		expect(fakeFiles.uploads).toEqual([]);
	});

	it('explains a storage refusal by its code', async () => {
		fakeFiles.uploadStatus = 400;
		fakeFiles.uploadBody =
			'<?xml version="1.0"?><Error><Code>EntityTooLarge</Code></Error>';
		fetchMock.mockResolvedValueOnce(uploadTarget());

		expect(await uploadDeviceFile(session, MEMORYBOX, photo)).toEqual({
			ok: false,
			detail: 'HTTP 400 EntityTooLarge',
		});
	});

	it('explains a file that is not there', async () => {
		fakeFiles.missingUris = [photo.uri];

		expect(await uploadDeviceFile(session, MEMORYBOX, photo)).toEqual({
			ok: false,
			detail: 'File not found',
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('explains a registration that returned no record', async () => {
		fetchMock
			.mockResolvedValueOnce(uploadTarget())
			.mockResolvedValueOnce(json({}));

		expect(await uploadDeviceFile(session, MEMORYBOX, photo)).toEqual({
			ok: false,
			detail: 'No record registered',
		});
	});

	it('explains an upload target it cannot read', async () => {
		fetchMock.mockResolvedValueOnce(json({ destinationUrl: DESTINATION_URL }));

		expect(await uploadDeviceFile(session, MEMORYBOX, photo)).toEqual({
			ok: false,
			detail: 'Unreadable upload target',
		});
	});
});

describe('uploadTextFile', () => {
	it('uploads the text from a file in the cache', async () => {
		fetchMock
			.mockResolvedValueOnce(uploadTarget())
			.mockResolvedValueOnce(json({ recordId: 30 }));

		await uploadTextFile(session, MEMORYBOX, {
			name: 'notes.txt',
			type: 'text/plain',
			contents: 'Hello',
		});

		expect(fakeFiles.written.get('file:///cache/notes.txt')).toBe('Hello');
		expect(fakeFiles.uploads).toMatchObject([
			{ uri: 'file:///cache/notes.txt' },
		]);
	});
});
