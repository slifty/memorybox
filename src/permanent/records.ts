import { idAt, isValues, postForm, postVersionTwo, stringAt } from './api';
import type { Attempt, Done } from './api';
import type { Session } from './auth';
import type { Folder } from './folders';

export interface TextFile {
	name: string;
	type: string;
	contents: string;
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
	return {
		destinationUrl,
		url,
		fields: Object.entries(fields).filter(
			(field): field is [string, string] => typeof field[1] === 'string',
		),
	};
};

const ESCAPED_BYTE_LENGTH = 3;

const utf8ByteLength = (text: string): number => {
	const encoded = encodeURIComponent(text);
	const escapedBytes = encoded.split('%').length - 1;
	return encoded.length - escapedBytes * (ESCAPED_BYTE_LENGTH - 1);
};

const describeFile = (
	parent: Folder,
	file: TextFile,
): Record<string, unknown> => ({
	displayName: file.name,
	parentFolderId: Number(parent.folderId),
	uploadFileName: file.name,
	fileType: file.type,
	size: utf8ByteLength(file.contents),
});

const requestUploadTarget = async (
	session: Session,
	parent: Folder,
	file: TextFile,
): Promise<Attempt<UploadTarget>> => {
	const reply = await postVersionTwo(
		session.token,
		'/record/getPresignedUrl',
		describeFile(parent, file),
	);
	if (!reply.ok) {
		return reply;
	}
	const target = toUploadTarget(reply.value);
	return target === undefined
		? { ok: false, detail: 'No upload URL' }
		: { ok: true, value: target };
};

const uploadTo = async (
	target: UploadTarget,
	file: TextFile,
): Promise<Done> => {
	const form = new FormData();
	target.fields.forEach(([key, value]) => {
		form.append(key, value);
	});
	form.append('Content-Type', file.type);
	form.append('file', file.contents);
	return await postForm(target.url, form);
};

const register = async (
	session: Session,
	parent: Folder,
	file: TextFile,
	s3url: string,
): Promise<Done> => {
	const reply = await postVersionTwo(session.token, '/record/registerRecord', {
		...describeFile(parent, file),
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

export const uploadTextFile = async (
	session: Session,
	parent: Folder,
	file: TextFile,
): Promise<Done> => {
	const target = await requestUploadTarget(session, parent, file);
	if (!target.ok) {
		return target;
	}
	const uploaded = await uploadTo(target.value, file);
	if (!uploaded.ok) {
		return uploaded;
	}
	return await register(session, parent, file, target.value.destinationUrl);
};
