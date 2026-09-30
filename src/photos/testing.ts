export interface FakePhoto {
	id: string;
	creationTime: number;
	mediaType: 'image' | 'video';
}

interface FakeLibrary {
	accessGranted: boolean;
	photos: FakePhoto[];
	failure: Error | undefined;
	unreadableIds: string[];
}

export const fakeLibrary: FakeLibrary = {
	accessGranted: true,
	photos: [],
	failure: undefined,
	unreadableIds: [],
};

export const resetFakeLibrary = (): void => {
	fakeLibrary.accessGranted = true;
	fakeLibrary.photos = [];
	fakeLibrary.failure = undefined;
	fakeLibrary.unreadableIds = [];
};

export const photoTakenAt = (
	time: Date,
	mediaType: FakePhoto['mediaType'] = 'image',
): FakePhoto => ({
	id: `${mediaType}-${time.toISOString()}`,
	creationTime: time.getTime(),
	mediaType,
});
