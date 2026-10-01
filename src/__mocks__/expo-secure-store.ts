import { fakeSecureStore } from '../permanent/testing';

const available = async (): Promise<void> => {
	if (fakeSecureStore.failure !== undefined) {
		throw fakeSecureStore.failure;
	}
	await Promise.resolve();
};

export const getItemAsync = async (key: string): Promise<string | null> => {
	await available();
	return fakeSecureStore.items.get(key) ?? null;
};

export const setItemAsync = async (
	key: string,
	value: string,
): Promise<void> => {
	await available();
	await fakeSecureStore.writesFinish;
	fakeSecureStore.items.set(key, value);
};

export const deleteItemAsync = async (key: string): Promise<void> => {
	await available();
	fakeSecureStore.items.delete(key);
};
