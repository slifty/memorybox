import {
	Asset,
	AssetField,
	MediaType,
	Query,
	requestPermissionsAsync,
} from 'expo-media-library';

export interface Photo {
	id: string;
	uri: string;
	takenAtMs: number;
}

export type PhotosResult =
	| { outcome: 'found'; photos: Photo[] }
	| { outcome: 'denied' }
	| { outcome: 'failed'; detail: string };

const startOfDay = (now: Date): number =>
	new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

const describe = (error: unknown): string =>
	error instanceof Error ? error.message : 'Unknown error';

const isFulfilled = <T>(
	result: PromiseSettledResult<T>,
): result is PromiseFulfilledResult<T> => result.status === 'fulfilled';

const isRejected = <T>(
	result: PromiseSettledResult<T>,
): result is PromiseRejectedResult => result.status === 'rejected';

export const findTodaysPhotos = async (
	now = new Date(),
): Promise<PhotosResult> => {
	try {
		const permission = await requestPermissionsAsync(false, ['photo']);
		if (!permission.granted) {
			return { outcome: 'denied' };
		}
		const since = startOfDay(now);
		const found = await new Query()
			.eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
			.gte(AssetField.CREATION_TIME, since)
			.orderBy({ key: AssetField.CREATION_TIME, ascending: false })
			.exeForMetadata();
		const lookups = await Promise.allSettled(
			found.map(async ({ id, creationTime }) => ({
				id,
				uri: await new Asset(id).getUri(),
				takenAtMs: creationTime ?? since,
			})),
		);
		const photos = lookups.filter(isFulfilled).map(({ value }) => value);
		const firstFailure = lookups.find(isRejected);
		if (photos.length === 0 && firstFailure !== undefined) {
			return { outcome: 'failed', detail: describe(firstFailure.reason) };
		}
		return { outcome: 'found', photos };
	} catch (error) {
		return { outcome: 'failed', detail: describe(error) };
	}
};
