/* eslint-disable @typescript-eslint/naming-convention --
   Mirrors expo-media-library's enums, whose members are upper case. */
import { fakeLibrary } from '../photos/testing';
import type { FakePhoto } from '../photos/testing';

export const AssetField = {
	CREATION_TIME: 'creationTime',
	MEDIA_TYPE: 'mediaType',
} as const;

export const MediaType = { IMAGE: 'image' } as const;

export class Asset {
	readonly #id: string;

	public constructor(id: string) {
		this.#id = id;
	}

	public async getUri(): Promise<string> {
		if (fakeLibrary.unreadableIds.includes(this.#id)) {
			throw new Error(`Cannot read ${this.#id}`);
		}
		return await Promise.resolve(`file:///${this.#id}.jpg`);
	}
}

export class Query {
	readonly #filters: Array<(photo: FakePhoto) => boolean> = [];
	#ascending = true;

	public eq(field: 'mediaType', value: FakePhoto['mediaType']): this {
		this.#filters.push((photo) => photo[field] === value);
		return this;
	}

	public gte(field: 'creationTime', value: number): this {
		this.#filters.push((photo) => photo[field] >= value);
		return this;
	}

	public orderBy({ ascending }: { ascending: boolean }): this {
		this.#ascending = ascending;
		return this;
	}

	public async exeForMetadata(): Promise<FakePhoto[]> {
		if (fakeLibrary.failure !== undefined) {
			throw fakeLibrary.failure;
		}
		const direction = this.#ascending ? 1 : -1;
		return await Promise.resolve(
			fakeLibrary.photos
				.filter((photo) => this.#filters.every((matches) => matches(photo)))
				.toSorted(
					(first, second) =>
						direction * (first.creationTime - second.creationTime),
				),
		);
	}
}

export const requestPermissionsAsync = async (): Promise<{
	granted: boolean;
}> => await Promise.resolve({ granted: fakeLibrary.accessGranted });
