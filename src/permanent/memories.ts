import { uploadDeviceFile } from './records';
import type { Session } from './auth';
import type { Folder } from './folders';

export interface Memory {
	photoUri: string;
	takenAtMs: number;
}

export type SaveMemoryResult =
	{ outcome: 'saved' } | { outcome: 'failed'; detail: string };

const TYPES_BY_EXTENSION = new Map([
	['jpg', 'image/jpeg'],
	['jpeg', 'image/jpeg'],
	['heic', 'image/heic'],
	['heif', 'image/heif'],
	['png', 'image/png'],
	['gif', 'image/gif'],
	['webp', 'image/webp'],
	['tif', 'image/tiff'],
	['tiff', 'image/tiff'],
	['dng', 'image/x-adobe-dng'],
]);

const UNKNOWN_TYPE = 'application/octet-stream';

const extensionOf = (uri: string): string | undefined => {
	const [path = ''] = uri.split('?');
	const fileName = path.split('/').at(-1) ?? '';
	const dot = fileName.lastIndexOf('.');
	return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : undefined;
};

const twoDigits = (value: number): string => String(value).padStart(2, '0');

const dayOf = (timeMs: number): string => {
	const time = new Date(timeMs);
	return [
		String(time.getFullYear()),
		twoDigits(time.getMonth() + 1),
		twoDigits(time.getDate()),
	].join('-');
};

export const saveMemory = async (
	session: Session,
	memorybox: Folder,
	{ photoUri, takenAtMs }: Memory,
): Promise<SaveMemoryResult> => {
	const extension = extensionOf(photoUri);
	if (extension === undefined) {
		return { outcome: 'failed', detail: 'Unknown photo format' };
	}
	const uploaded = await uploadDeviceFile(session, memorybox, {
		uri: photoUri,
		name: `${dayOf(takenAtMs)}.${extension}`,
		type: TYPES_BY_EXTENSION.get(extension) ?? UNKNOWN_TYPE,
	});
	return uploaded.ok
		? { outcome: 'saved' }
		: { outcome: 'failed', detail: uploaded.detail };
};
