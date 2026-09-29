// Expo inlines `EXPO_PUBLIC_` variables into the bundle at build time, so
// every one declared here is public. Never use one for a secret.
//
// This adds to the `process.env` type that Expo and Node already declare,
// rather than declaring `process` again.
declare namespace NodeJS {
	interface ProcessEnv {
		// Expo only exposes variables with this exact prefix.
		// eslint-disable-next-line @typescript-eslint/naming-convention
		EXPO_PUBLIC_PERMANENT_API_URL?: string;
	}
}
