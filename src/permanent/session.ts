import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';
import { isValues, stringAt } from './api';
import type { Session } from './auth';

const SESSION_KEY = 'session';

const toSession = (stored: unknown): Session | undefined => {
	const token = stringAt(stored, 'token');
	const account = isValues(stored) ? stored.account : undefined;
	const email = stringAt(account, 'email');
	return token === undefined || email === undefined
		? undefined
		: { token, account: { email, name: stringAt(account, 'name') } };
};

export const loadSession = async (): Promise<Session | undefined> => {
	try {
		const stored = await getItemAsync(SESSION_KEY);
		return stored === null
			? undefined
			: toSession(JSON.parse(stored) as unknown);
	} catch {
		return undefined;
	}
};

export const saveSession = async (session: Session): Promise<void> => {
	await setItemAsync(SESSION_KEY, JSON.stringify(session)).catch(
		() => undefined,
	);
};

export const forgetSession = async (): Promise<void> => {
	await deleteItemAsync(SESSION_KEY).catch(() => undefined);
};
