import { getFromStela, idAt, isValues, postVersionTwo, stringAt } from './api';
import type { Attempt, Values } from './api';
import type { Session } from './auth';

export interface Folder {
	folderId: string;
}

export type Child =
	| {
			kind: 'folder';
			name: string | undefined;
			type: string | undefined;
			folder: Folder;
	  }
	| {
			kind: 'record';
			name: string | undefined;
			fileName: string | undefined;
			imageUrl: string | undefined;
	  }
	| { kind: 'unreadable' };

const PAGE_SIZE = 500;

const MY_FILES_TYPE = 'private-root';

const THUMBNAIL_WIDTHS_LARGEST_FIRST = ['2000', '1000', '500', '256', '200'];

const ORIGINAL_FORMAT = 'file.format.original';

const imageUrlOf = (item: Values): string | undefined => {
	const thumbnailUrl = THUMBNAIL_WIDTHS_LARGEST_FIRST.map((width) =>
		stringAt(item.thumbnailUrls, width),
	).find((url) => url !== undefined);
	const files: unknown[] = Array.isArray(item.files) ? item.files : [];
	const original = files.find(
		(file) => stringAt(file, 'format') === ORIGINAL_FORMAT,
	);
	return thumbnailUrl ?? stringAt(original, 'fileUrl');
};

const toChild = (item: unknown): Child => {
	if (!isValues(item)) {
		return { kind: 'unreadable' };
	}
	const name = stringAt(item, 'displayName');
	if (item.itemType === 'record') {
		return {
			kind: 'record',
			name,
			fileName: stringAt(item, 'uploadFileName'),
			imageUrl: imageUrlOf(item),
		};
	}
	const folderId = idAt(item, 'folderId');
	return item.itemType === 'folder' && folderId !== undefined
		? {
				kind: 'folder',
				name,
				type: stringAt(item, 'type'),
				folder: { folderId },
			}
		: { kind: 'unreadable' };
};

interface Listing {
	cursor: string | undefined;
	children: Child[];
	cursorsSeen: ReadonlySet<string>;
}

const cursorQuery = (cursor: string | undefined): string | undefined => {
	if (cursor === undefined) {
		return '';
	}
	try {
		return `&cursor=${encodeURIComponent(cursor)}`;
	} catch {
		return undefined;
	}
};

const listFrom = async (
	session: Session,
	parent: Folder,
	{ cursor, children: earlier, cursorsSeen }: Listing,
): Promise<Attempt<Child[]>> => {
	const after = cursorQuery(cursor);
	if (after === undefined) {
		return { ok: false, detail: 'Unreadable folder cursor' };
	}
	const reply = await getFromStela(
		session.token,
		`/folders/${parent.folderId}/children?pageSize=${String(PAGE_SIZE)}${after}`,
	);
	if (!reply.ok) {
		return reply;
	}
	const {
		value: { items, pagination },
	} = reply;
	if (!Array.isArray(items)) {
		return { ok: false, detail: 'Unreadable folder contents' };
	}
	const children = [...earlier, ...items.map(toChild)];
	const nextCursor =
		items.length === 0 ? undefined : idAt(pagination, 'nextCursor');
	if (nextCursor === undefined) {
		return items.length < PAGE_SIZE
			? { ok: true, value: children }
			: { ok: false, detail: 'Folder contents were cut short' };
	}
	return cursorsSeen.has(nextCursor)
		? { ok: false, detail: 'Folder contents did not advance' }
		: await listFrom(session, parent, {
				cursor: nextCursor,
				children,
				cursorsSeen: new Set([...cursorsSeen, nextCursor]),
			});
};

export const listChildren = async (
	session: Session,
	parent: Folder,
): Promise<Attempt<Child[]>> =>
	await listFrom(session, parent, {
		cursor: undefined,
		children: [],
		cursorsSeen: new Set(),
	});

const idFrom = async (
	session: Session,
	path: string,
	key: string,
): Promise<Attempt<string | undefined>> => {
	const reply = await getFromStela(session.token, path);
	return reply.ok ? { ok: true, value: idAt(reply.value.data, key) } : reply;
};

export const findMyFiles = async (
	session: Session,
): Promise<Attempt<Folder>> => {
	const archiveId = await idFrom(session, '/accounts/me', 'defaultArchiveId');
	if (!archiveId.ok) {
		return archiveId;
	}
	if (archiveId.value === undefined) {
		return { ok: false, detail: 'No default archive' };
	}
	const rootFolderId = await idFrom(
		session,
		`/archives/${archiveId.value}`,
		'rootFolderId',
	);
	if (!rootFolderId.ok) {
		return rootFolderId;
	}
	if (rootFolderId.value === undefined) {
		return { ok: false, detail: 'No root folder' };
	}
	const roots = await listChildren(session, { folderId: rootFolderId.value });
	if (!roots.ok) {
		return roots;
	}
	const myFiles = roots.value.find(
		(child) => child.kind === 'folder' && child.type === MY_FILES_TYPE,
	);
	return myFiles?.kind === 'folder'
		? { ok: true, value: myFiles.folder }
		: { ok: false, detail: 'No My Files folder' };
};

export const createFolder = async (
	session: Session,
	parent: Folder,
	name: string,
): Promise<Attempt<Folder>> => {
	const reply = await postVersionTwo(session.token, '/folder/post', {
		displayName: name,
		parentFolderId: Number(parent.folderId),
		failOnDuplicateName: true,
	});
	if (!reply.ok) {
		return reply;
	}
	const folderId = idAt(reply.value, 'folderId');
	return folderId === undefined
		? { ok: false, detail: 'No folder created' }
		: { ok: true, value: { folderId } };
};
