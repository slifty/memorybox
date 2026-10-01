import { createFolder, findMyFiles, listChildren } from './folders';
import { uploadTextFile } from './records';
import type { Failure } from './api';
import type { Session } from './auth';
import type { Child, Folder } from './folders';

export const MEMORYBOX_FOLDER_NAME = 'Memorybox';

export const MARKER_FILE_NAME = '.memorybox';

export type PrepareFailureReason = 'unclaimed-folder' | 'unexpected';

export type PrepareResult =
	| { outcome: 'ready'; memorybox: Folder }
	| { outcome: 'failed'; reason: PrepareFailureReason; detail?: string }
	| { outcome: 'signed-out' };

const unexpected = ({ detail, signedOut }: Failure): PrepareResult =>
	signedOut === true
		? { outcome: 'signed-out' }
		: { outcome: 'failed', reason: 'unexpected', detail };

const isMarker = (child: Child): boolean =>
	child.kind === 'record' &&
	(child.name === MARKER_FILE_NAME || child.fileName === MARKER_FILE_NAME);

const claim = async (
	session: Session,
	memorybox: Folder,
): Promise<PrepareResult> => {
	const marked = await uploadTextFile(session, memorybox, {
		name: MARKER_FILE_NAME,
		type: 'application/json',
		contents: JSON.stringify({ createdBy: 'memorybox' }),
	});
	return marked.ok ? { outcome: 'ready', memorybox } : unexpected(marked);
};

const adoptExisting = async (
	session: Session,
	memorybox: Folder,
): Promise<PrepareResult> => {
	const children = await listChildren(session, memorybox);
	if (!children.ok) {
		return unexpected(children);
	}
	if (children.value.some(isMarker)) {
		return { outcome: 'ready', memorybox };
	}
	return children.value.length === 0
		? await claim(session, memorybox)
		: { outcome: 'failed', reason: 'unclaimed-folder' };
};

const createMemorybox = async (
	session: Session,
	myFiles: Folder,
): Promise<PrepareResult> => {
	const created = await createFolder(session, myFiles, MEMORYBOX_FOLDER_NAME);
	return created.ok ? await claim(session, created.value) : unexpected(created);
};

export const prepareMemorybox = async (
	session: Session,
): Promise<PrepareResult> => {
	const myFiles = await findMyFiles(session);
	if (!myFiles.ok) {
		return unexpected(myFiles);
	}
	const children = await listChildren(session, myFiles.value);
	if (!children.ok) {
		return unexpected(children);
	}
	const existing = children.value.find(
		(child) => child.kind === 'folder' && child.name === MEMORYBOX_FOLDER_NAME,
	);
	return existing?.kind === 'folder'
		? await adoptExisting(session, existing.folder)
		: await createMemorybox(session, myFiles.value);
};
