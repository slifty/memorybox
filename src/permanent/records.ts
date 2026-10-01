import { File, Paths, UploadType } from 'expo-file-system';
import { describe, idAt, isValues, postVersionTwo, stringAt } from './api';
import type { Attempt, Done, Failure } from './api';
import type { Session } from './auth';
import type { Folder } from './folders';

export interface TextFile {
	name: string;
	type: string;
	contents: string;
}

export interface DeviceFile {
	uri: string;
	name: string;
	type: string;
}

interface Upload extends DeviceFile {
	source: File;
	size: number;
}

interface UploadTarget {
	destinationUrl: string;
	url: string;
	fields: Array<[string, string]>;
}

const toUploadTarget = (value: unknown): UploadTarget | undefined => {
	const destinationUrl = stringAt(value, 'destinationUrl');
	const presignedPost = isValues(value) ? value.presignedPost : undefined;
	const url = stringAt(presignedPost, 'url');
	const fields = isValues(presignedPost) ? presignedPost.fields : undefined;
	if (destinationUrl === undefined || url === undefined || !isValues(fields)) {
		return undefined;
	}
	const entries = Object.entries(fields);
	const stringEntries = entries.filter(
		(field): field is [string, string] => typeof field[1] === 'string',
	);
	return stringEntries.length === entries.length
		? { destinationUrl, url, fields: stringEntries }
		: undefined;
};

const describeUpload = (
	parent: Folder,
	upload: Upload,
): Record<string, unknown> => ({
	displayName: upload.name,
	parentFolderId: Number(parent.folderId),
	uploadFileName: upload.name,
	fileType: upload.type,
	size: upload.size,
});

const requestUploadTarget = async (
	session: Session,
	parent: Folder,
	upload: Upload,
): Promise<Attempt<UploadTarget>> => {
	const reply = await postVersionTwo(
		session.token,
		'/record/getPresignedUrl',
		describeUpload(parent, upload),
	);
	if (!reply.ok) {
		return reply;
	}
	const target = toUploadTarget(reply.value);
	return target === undefined
		? { ok: false, detail: 'Unreadable upload target' }
		: { ok: true, value: target };
};

const isSuccessStatus = (status: number): boolean =>
	status >= 200 && status < 300;

const storageErrorCode = (body: string): string | undefined => {
	const start = body.indexOf('<Code>');
	const end = body.indexOf('</Code>');
	return start === -1 || end <= start
		? undefined
		: body.slice(start + '<Code>'.length, end);
};

const storageFailure = (status: number, body: string): Failure => {
	const code = storageErrorCode(body);
	const httpStatus = `HTTP ${String(status)}`;
	return {
		ok: false,
		detail: code === undefined ? httpStatus : `${httpStatus} ${code}`,
	};
};

const uploadTo = async (
	target: UploadTarget,
	upload: Upload,
): Promise<Done> => {
	try {
		const { status, body } = await upload.source.upload(target.url, {
			uploadType: UploadType.MULTIPART,
			fieldName: 'file',
			mimeType: upload.type,
			parameters: {
				...Object.fromEntries(target.fields),
				'Content-Type': upload.type,
			},
			sessionType: 'foreground',
		});
		return isSuccessStatus(status)
			? { ok: true }
			: storageFailure(status, body);
	} catch (error) {
		return { ok: false, detail: describe(error) };
	}
};

const register = async (
	session: Session,
	parent: Folder,
	upload: Upload,
	s3url: string,
): Promise<Done> => {
	const reply = await postVersionTwo(session.token, '/record/registerRecord', {
		...describeUpload(parent, upload),
		s3url,
		failOnDuplicateName: true,
	});
	if (!reply.ok) {
		return reply;
	}
	return idAt(reply.value, 'recordId') === undefined
		? { ok: false, detail: 'No record registered' }
		: { ok: true };
};

const toUpload = (file: DeviceFile): Attempt<Upload> => {
	try {
		const source = new File(file.uri);
		const info = source.info();
		return info.exists && info.size !== undefined
			? { ok: true, value: { ...file, source, size: info.size } }
			: { ok: false, detail: 'File not found' };
	} catch (error) {
		return { ok: false, detail: describe(error) };
	}
};

export const uploadDeviceFile = async (
	session: Session,
	parent: Folder,
	file: DeviceFile,
): Promise<Done> => {
	const upload = toUpload(file);
	if (!upload.ok) {
		return upload;
	}
	const target = await requestUploadTarget(session, parent, upload.value);
	if (!target.ok) {
		return target;
	}
	const uploaded = await uploadTo(target.value, upload.value);
	if (!uploaded.ok) {
		return uploaded;
	}
	return await register(
		session,
		parent,
		upload.value,
		target.value.destinationUrl,
	);
};

const writeToCache = (file: TextFile): Attempt<string> => {
	try {
		const cached = new File(Paths.cache, file.name);
		cached.create({ overwrite: true });
		cached.write(file.contents);
		return { ok: true, value: cached.uri };
	} catch (error) {
		return { ok: false, detail: describe(error) };
	}
};

export const uploadTextFile = async (
	session: Session,
	parent: Folder,
	file: TextFile,
): Promise<Done> => {
	const cached = writeToCache(file);
	return cached.ok
		? await uploadDeviceFile(session, parent, {
				uri: cached.value,
				name: file.name,
				type: file.type,
			})
		: cached;
};
