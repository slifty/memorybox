import { listChildren } from './folders';
import { uploadDeviceFile } from './records';
import type { Failure } from './api';
import type { Session } from './auth';
import type { Child, Folder } from './folders';

export interface Memory {
	photoUri: string;
	takenAtMs: number;
}

type Failed = { outcome: 'failed'; detail: string } | { outcome: 'signed-out' };

const failed = ({ detail, signedOut }: Failure): Failed =>
	signedOut === true
		? { outcome: 'signed-out' }
		: { outcome: 'failed', detail };

export type SaveMemoryResult = { outcome: 'saved' } | Failed;

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

export const dayOf = (timeMs: number): string => {
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
	return uploaded.ok ? { outcome: 'saved' } : failed(uploaded);
};

export type RememberedDaysResult =
	{ outcome: 'found'; days: string[] } | Failed;

const DAY_PART_LENGTHS = [4, 2, 2];

const DIGITS = '0123456789';

const isDigits = (text: string): boolean =>
	text !== '' &&
	Array.from({ length: text.length }, (_, index) => text.charAt(index)).every(
		(character) => DIGITS.includes(character),
	);

const dayIn = (name: string | undefined): string | undefined => {
	const [day = ''] = (name ?? '').split('.');
	const parts = day.split('-');
	const isDay =
		parts.length === DAY_PART_LENGTHS.length &&
		parts.every(
			(part, index) =>
				isDigits(part) && part.length === DAY_PART_LENGTHS[index],
		);
	return isDay ? day : undefined;
};

const isUnreadable = (child: Child): boolean =>
	child.kind === 'unreadable' ||
	(child.kind === 'record' &&
		child.name === undefined &&
		child.fileName === undefined);

const rememberedDayOf = (child: Child): string | undefined =>
	child.kind === 'record' ? dayIn(child.name ?? child.fileName) : undefined;

export const findRememberedDays = async (
	session: Session,
	memorybox: Folder,
): Promise<RememberedDaysResult> => {
	const children = await listChildren(session, memorybox);
	if (!children.ok) {
		return failed(children);
	}
	if (children.value.some(isUnreadable)) {
		return { outcome: 'failed', detail: 'Unreadable memory in Memorybox' };
	}
	const days = children.value
		.map(rememberedDayOf)
		.filter((day) => day !== undefined);
	return { outcome: 'found', days: [...new Set(days)] };
};
