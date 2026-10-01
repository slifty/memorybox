/* eslint-disable @typescript-eslint/naming-convention --
   Mirrors expo-file-system's enums, whose members are upper case. */
import { UPLOAD_URL, fakeFiles } from '../permanent/testing';

interface Location {
	uri: string;
}

export const Paths = { cache: { uri: 'file:///cache/' } };

export const UploadType = { BINARY_CONTENT: 0, MULTIPART: 1 } as const;

export class File {
	public readonly uri: string;

	public constructor(first: string | Location, ...rest: string[]) {
		const base = typeof first === 'string' ? first : first.uri;
		this.uri = [base, ...rest].join('');
	}

	public info(): { exists: boolean; size?: number } {
		if (fakeFiles.unreadableUris.includes(this.uri)) {
			throw new Error(`Cannot read ${this.uri}`);
		}
		const written = fakeFiles.written.get(this.uri);
		if (written !== undefined) {
			return { exists: true, size: written.length };
		}
		return fakeFiles.missingUris.includes(this.uri)
			? { exists: false }
			: { exists: true, size: fakeFiles.sizeBytes };
	}

	public create(): void {
		fakeFiles.written.set(this.uri, '');
	}

	public write(contents: string): void {
		fakeFiles.written.set(this.uri, contents);
	}

	public async upload(
		url: string,
		options: Record<string, unknown>,
	): Promise<{ status: number; body: string; headers: object }> {
		if (url !== UPLOAD_URL) {
			return await Promise.reject(new Error(`Unstubbed upload: ${url}`));
		}
		fakeFiles.uploads.push({ uri: this.uri, url, options });
		return await Promise.resolve({
			status: fakeFiles.uploadStatus,
			body: fakeFiles.uploadBody,
			headers: {},
		});
	}
}
