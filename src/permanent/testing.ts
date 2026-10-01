// Builders for Permanent's responses, for tests that stub `fetch`.

/* eslint-disable @typescript-eslint/naming-convention --
   Permanent's API names its fields in PascalCase (`Results`, `AccountVO`). */
import { permanentApiUrl, permanentStelaUrl } from '../config';

const respond = (body: unknown, status = 200): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});

export const account = {
	AccountVO: { primaryEmail: 'ada@example.com', fullName: 'Ada' },
};

export const success = (values: Record<string, unknown>): Response =>
	respond({ isSuccessful: true, Results: [{ message: [], data: [values] }] });

// What /auth/login returns for a correct password.
export const loginSuccess = (): Response =>
	success({
		...account,
		SimpleVO: { key: 'authToken', value: 'auth-token' },
	});

// What /auth/verify returns for a correct code. The trust token comes first,
// so a client that takes the first token it sees gets the wrong one.
export const verifySuccess = (): Response =>
	success({
		...account,
		SimpleVO: { key: 'trustToken', value: 'trust-token' },
		AuthSimpleVO: { key: 'authToken', value: 'auth-token' },
	});

// Permanent reports failures with HTTP 200 and a message code.
export const failure = (code: string): Response =>
	respond({ isSuccessful: false, Results: [{ message: [code], data: null }] });

export const httpError = (status: number): Response => respond({}, status);

export const UPLOAD_URL = 'https://uploads.example.com/';

export const DESTINATION_URL = 'https://uploads.example.com/memorybox-marker';

export const UPLOAD_FIELDS = { key: 'marker-key', Policy: 'policy' };

export const MY_FILES = { folderId: '11' };

export const MEMORYBOX = { folderId: '12' };

interface FakeUpload {
	uri: string;
	url: string;
	options: Record<string, unknown>;
}

interface FakeFiles {
	sizeBytes: number;
	missingUris: string[];
	unreadableUris: string[];
	written: Map<string, string>;
	uploads: FakeUpload[];
	uploadStatus: number;
	uploadBody: string;
}

export const fakeFiles: FakeFiles = {
	sizeBytes: 2048,
	missingUris: [],
	unreadableUris: [],
	written: new Map(),
	uploads: [],
	uploadStatus: 204,
	uploadBody: '',
};

interface FakePermanent {
	memorybox: 'missing' | 'empty' | 'unclaimed' | 'unreadable' | 'claimed';
	failingPath: string | undefined;
	memories: string[];
	memoryboxListingsBeforeFailure: number;
}

export const fakePermanent: FakePermanent = {
	memorybox: 'claimed',
	failingPath: undefined,
	memories: [],
	memoryboxListingsBeforeFailure: Infinity,
};

export const resetFakePermanent = (): void => {
	fakePermanent.memorybox = 'claimed';
	fakePermanent.failingPath = undefined;
	fakePermanent.memories = [];
	fakePermanent.memoryboxListingsBeforeFailure = Infinity;
	fakeFiles.sizeBytes = 2048;
	fakeFiles.missingUris = [];
	fakeFiles.unreadableUris = [];
	fakeFiles.written = new Map();
	fakeFiles.uploads = [];
	fakeFiles.uploadStatus = 204;
	fakeFiles.uploadBody = '';
};

type Item = Record<string, unknown>;

const folderItem = (
	displayName: string,
	type: string,
	folderId: string,
	folderLinkId: string,
): Item => ({ itemType: 'folder', displayName, type, folderId, folderLinkId });

const recordItem = (
	displayName: string,
	uploadFileName: string,
	folderLinkId: string,
): Item => ({ itemType: 'record', displayName, uploadFileName, folderLinkId });

const memoryItems = (): Item[] =>
	fakePermanent.memories.map((name, index) =>
		recordItem(name, name, String(200 + index)),
	);

const memoryboxContents = (): Item[] => {
	switch (fakePermanent.memorybox) {
		case 'missing':
		case 'empty':
			return [];
		case 'unclaimed':
			return [recordItem('Notes', 'notes.txt', '123')];
		case 'unreadable':
			return [{ itemType: 'something-new', folderLinkId: '124' }];
		case 'claimed':
			return [recordItem('.memorybox', '.memorybox', '122'), ...memoryItems()];
	}
};

const childrenOf = (folderId: string): Item[] => {
	switch (folderId) {
		case '10':
			return [
				folderItem('My Files', 'private-root', MY_FILES.folderId, '111'),
				folderItem('Public', 'public-root', '13', '113'),
			];
		case MY_FILES.folderId:
			return [
				recordItem('Holiday', 'holiday.jpg', '120'),
				...(fakePermanent.memorybox === 'missing'
					? []
					: [folderItem('Memorybox', 'private', MEMORYBOX.folderId, '112')]),
			];
		case MEMORYBOX.folderId:
			return memoryboxContents();
		default:
			return [];
	}
};

const isNewMemoryboxListing = (folderId: string, path: string): boolean =>
	folderId === MEMORYBOX.folderId && !path.includes('cursor=');

const childrenPage = (path: string): Response => {
	const [, , folderId = ''] = path.split('/');
	if (isNewMemoryboxListing(folderId, path)) {
		if (fakePermanent.memoryboxListingsBeforeFailure <= 0) {
			return httpError(500);
		}
		fakePermanent.memoryboxListingsBeforeFailure -= 1;
	}
	const items = path.includes('cursor=') ? [] : childrenOf(folderId);
	return respond({
		items,
		pagination: { nextCursor: items.at(-1)?.folderLinkId },
	});
};

const answerStela = (path: string): Response | undefined => {
	if (path === '/accounts/me') {
		return respond({ data: { defaultArchiveId: '1' } });
	}
	if (path === '/archives/1') {
		return respond({ data: { id: '1', rootFolderId: '10' } });
	}
	return path.startsWith('/folders/') ? childrenPage(path) : undefined;
};

const registeredName = (body: unknown): string | undefined => {
	const sent: unknown = typeof body === 'string' ? JSON.parse(body) : undefined;
	return typeof sent === 'object' &&
		sent !== null &&
		'uploadFileName' in sent &&
		typeof sent.uploadFileName === 'string'
		? sent.uploadFileName
		: undefined;
};

const register = (body: unknown): void => {
	const name = registeredName(body);
	if (name === '.memorybox') {
		fakePermanent.memorybox = 'claimed';
	} else if (name !== undefined) {
		fakePermanent.memories.push(name);
	}
};

const answerApi = (path: string, body: unknown): Response | undefined => {
	switch (path) {
		case '/folder/post':
			fakePermanent.memorybox = 'empty';
			return respond({ folderId: 12, folder_linkId: 112 });
		case '/record/getPresignedUrl':
			return respond({
				destinationUrl: DESTINATION_URL,
				presignedPost: {
					url: UPLOAD_URL,
					fields: UPLOAD_FIELDS,
				},
			});
		case '/record/registerRecord':
			register(body);
			return respond({ recordId: 30 });
		default:
			return undefined;
	}
};

const answer = (url: string, body: unknown): Response | undefined => {
	if (url.startsWith(permanentStelaUrl)) {
		return answerStela(url.slice(permanentStelaUrl.length));
	}
	if (url.startsWith(permanentApiUrl)) {
		return answerApi(url.slice(permanentApiUrl.length), body);
	}
	return undefined;
};

const urlOf = (input: RequestInfo | URL): string => {
	if (typeof input === 'string') {
		return input;
	}
	return input instanceof URL ? input.href : input.url;
};

export const fakePermanentFetch = async (
	input: RequestInfo | URL,
	init?: RequestInit,
): Promise<Response> => {
	const url = urlOf(input);
	const { failingPath } = fakePermanent;
	if (failingPath !== undefined && url.includes(failingPath)) {
		return await Promise.resolve(httpError(500));
	}
	const response = answer(url, init?.body);
	return response === undefined
		? await Promise.reject(new Error(`Unstubbed request: ${url}`))
		: await Promise.resolve(response);
};
