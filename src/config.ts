const STAGING_API_URL = 'https://app.staging.permanent.org/api';

// An unset or blank value means staging. A trailing slash is dropped so that
// paths can always be appended with one.
const configuredApiUrl =
	process.env.EXPO_PUBLIC_PERMANENT_API_URL?.trim() ?? '';

const withoutTrailingSlash = (url: string): string =>
	url.endsWith('/') ? url.slice(0, -1) : url;

export const permanentApiUrl =
	configuredApiUrl === ''
		? STAGING_API_URL
		: withoutTrailingSlash(configuredApiUrl);
