import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import { permanentStelaUrl } from '../config';
import { createFolder, findMyFiles, listChildren } from './folders';
import {
	MY_FILES,
	fakePermanentFetch,
	httpError,
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

const json = (body: unknown): Response =>
	new Response(JSON.stringify(body), { status: 200 });

const page = (...folderLinkIds: string[]): Response =>
	json({
		items: folderLinkIds.map((folderLinkId) => ({
			itemType: 'record',
			displayName: `Record ${folderLinkId}`,
			folderLinkId,
		})),
		pagination: { nextCursor: folderLinkIds.at(-1) },
	});

describe('listChildren', () => {
	it('reads every page, continuing after the last item of each', async () => {
		fetchMock
			.mockResolvedValueOnce(page('1', '2'))
			.mockResolvedValueOnce(page('3'))
			.mockResolvedValueOnce(page());

		const listed = await listChildren(session, MY_FILES);

		expect(listed).toMatchObject({
			ok: true,
			value: [{ name: 'Record 1' }, { name: 'Record 2' }, { name: 'Record 3' }],
		});
		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
			`${permanentStelaUrl}/folders/11/children?pageSize=500`,
			`${permanentStelaUrl}/folders/11/children?pageSize=500&cursor=2`,
			`${permanentStelaUrl}/folders/11/children?pageSize=500&cursor=3`,
		]);
	});

	it('keeps items it does not recognize, as unreadable', async () => {
		fetchMock
			.mockResolvedValueOnce(
				json({
					items: [{ itemType: 'something-new', folderLinkId: '1' }],
					pagination: { nextCursor: '1' },
				}),
			)
			.mockResolvedValueOnce(page());

		expect(await listChildren(session, MY_FILES)).toEqual({
			ok: true,
			value: [{ kind: 'unreadable' }],
		});
	});

	it('stops when the server repeats a page', async () => {
		fetchMock.mockImplementation(async () => await Promise.resolve(page('1')));

		expect(await listChildren(session, MY_FILES)).toEqual({
			ok: false,
			detail: 'Folder contents did not advance',
		});
	});

	it('stops when the server cycles back to an earlier page', async () => {
		fetchMock.mockImplementation(
			async (url) =>
				await Promise.resolve(
					typeof url === 'string' && url.endsWith('cursor=A')
						? page('B')
						: page('A'),
				),
		);

		expect(await listChildren(session, MY_FILES)).toEqual({
			ok: false,
			detail: 'Folder contents did not advance',
		});
	});

	it('refuses a full page that gives no way to the next', async () => {
		fetchMock.mockResolvedValueOnce(
			json({
				items: Array.from({ length: 500 }, (_, index) => ({
					itemType: 'record',
					displayName: `Record ${String(index)}`,
					folderLinkId: String(index),
				})),
				pagination: {},
			}),
		);

		expect(await listChildren(session, MY_FILES)).toEqual({
			ok: false,
			detail: 'Folder contents were cut short',
		});
	});

	it('refuses a cursor it cannot send back', async () => {
		fetchMock.mockResolvedValueOnce(
			json({
				items: [{ itemType: 'record', displayName: 'A', folderLinkId: '1' }],
				pagination: { nextCursor: '\ud800' },
			}),
		);

		expect(await listChildren(session, MY_FILES)).toEqual({
			ok: false,
			detail: 'Unreadable folder cursor',
		});
	});

	it('explains contents it cannot read', async () => {
		fetchMock.mockResolvedValueOnce(json({ error: 'Nope' }));

		expect(await listChildren(session, MY_FILES)).toEqual({
			ok: false,
			detail: 'Unreadable folder contents',
		});
	});
});

describe('findMyFiles', () => {
	it('finds My Files in the default archive', async () => {
		expect(await findMyFiles(session)).toEqual({ ok: true, value: MY_FILES });
	});

	it('explains an account without a default archive', async () => {
		fetchMock.mockResolvedValueOnce(json({ data: { defaultArchiveId: null } }));

		expect(await findMyFiles(session)).toEqual({
			ok: false,
			detail: 'No default archive',
		});
	});

	it('explains an archive without My Files', async () => {
		fetchMock
			.mockResolvedValueOnce(json({ data: { defaultArchiveId: '1' } }))
			.mockResolvedValueOnce(json({ data: { rootFolderId: '10' } }))
			.mockResolvedValueOnce(page());

		expect(await findMyFiles(session)).toEqual({
			ok: false,
			detail: 'No My Files folder',
		});
	});
});

describe('createFolder', () => {
	it('explains a refusal', async () => {
		fetchMock.mockResolvedValueOnce(httpError(409));

		expect(await createFolder(session, MY_FILES, 'Memorybox')).toEqual({
			ok: false,
			detail: 'HTTP 409',
		});
	});

	it('explains a success that created nothing', async () => {
		fetchMock.mockResolvedValueOnce(json({}));

		expect(await createFolder(session, MY_FILES, 'Memorybox')).toEqual({
			ok: false,
			detail: 'No folder created',
		});
	});
});
