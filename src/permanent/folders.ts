import { getFromStela, idAt, isValues, postVersionTwo, stringAt } from './api';
import type { Attempt } from './api';
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
	| { kind: 'record'; name: string | undefined; fileName: string | undefined }
	| { kind: 'unreadable' };

const PAGE_SIZE = 500;

const MY_FILES_TYPE = 'private-root';

const toChild = (item: unknown): Child => {
	if (!isValues(item)) {
		return { kind: 'unreadable' };
	}
	const name = stringAt(item, 'displayName');
	if (item.itemType === 'record') {
		return { kind: 'record', name, fileName: stringAt(item, 'uploadFileName') };
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

const listFrom = async (
	session: Session,
	parent: Folder,
	cursor: string | undefined,
	earlier: Child[],
): Promise<Attempt<Child[]>> => {
	const after =
		cursor === undefined ? '' : `&cursor=${encodeURIComponent(cursor)}`;
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
	return nextCursor === undefined
		? { ok: true, value: children }
		: await listFrom(session, parent, nextCursor, children);
};

export const listChildren = async (
	session: Session,
	parent: Folder,
): Promise<Attempt<Child[]>> => await listFrom(session, parent, undefined, []);

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
