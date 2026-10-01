import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import { uploadTextFile } from './records';
import { DESTINATION_URL, MEMORYBOX, UPLOAD_URL } from './testing';

const fetchMock = jest.fn<typeof fetch>();

const session = {
	token: 'auth-token',
	account: { email: 'ada@example.com', name: 'Ada' },
};

beforeEach(() => {
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

const file = { name: 'notes.txt', type: 'text/plain', contents: 'café' };

const sentSize = (call: number): unknown => {
	const body = fetchMock.mock.calls[call]?.[1]?.body;
	const sent: unknown = typeof body === 'string' ? JSON.parse(body) : undefined;
	return typeof sent === 'object' && sent !== null && 'size' in sent
		? sent.size
		: undefined;
};

describe('uploadTextFile', () => {
	it('gives the size in bytes, not characters', async () => {
		fetchMock
			.mockResolvedValueOnce(uploadTarget())
			.mockResolvedValueOnce(new Response(null, { status: 204 }))
			.mockResolvedValueOnce(json({ recordId: 30 }));

		expect(await uploadTextFile(session, MEMORYBOX, file)).toEqual({
			ok: true,
		});
		expect(sentSize(0)).toBe(5);
	});

	it('explains a registration that returned no record', async () => {
		fetchMock
			.mockResolvedValueOnce(uploadTarget())
			.mockResolvedValueOnce(new Response(null, { status: 204 }))
			.mockResolvedValueOnce(json({}));

		expect(await uploadTextFile(session, MEMORYBOX, file)).toEqual({
			ok: false,
			detail: 'No record registered',
		});
	});

	it('explains an upload target it cannot read', async () => {
		fetchMock.mockResolvedValueOnce(json({ destinationUrl: DESTINATION_URL }));

		expect(await uploadTextFile(session, MEMORYBOX, file)).toEqual({
			ok: false,
			detail: 'No upload URL',
		});
	});
});
