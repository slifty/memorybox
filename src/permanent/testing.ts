// Builders for Permanent's responses, for tests that stub `fetch`.

/* eslint-disable @typescript-eslint/naming-convention --
   Permanent's API names its fields in PascalCase (`Results`, `AccountVO`). */

const respond = (body: unknown, status = 200): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});

export const account = {
	AccountVO: { primaryEmail: 'ada@example.com', fullName: 'Ada' },
};

export const success = (values: Record<string, unknown>): Response =>
	respond({ isSuccessful: true, Results: [{ message: [], data: [values] }] });

// What /auth/login returns for a correct password.
export const loginSuccess = (): Response =>
	success({
		...account,
		SimpleVO: { key: 'authToken', value: 'auth-token' },
	});

// What /auth/verify returns for a correct code. The trust token comes first,
// so a client that takes the first token it sees gets the wrong one.
export const verifySuccess = (): Response =>
	success({
		...account,
		SimpleVO: { key: 'trustToken', value: 'trust-token' },
		AuthSimpleVO: { key: 'authToken', value: 'auth-token' },
	});

// Permanent reports failures with HTTP 200 and a message code.
export const failure = (code: string): Response =>
	respond({ isSuccessful: false, Results: [{ message: [code], data: null }] });

export const httpError = (status: number): Response => respond({}, status);
