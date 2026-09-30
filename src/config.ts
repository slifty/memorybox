const STAGING_API_URL = 'https://app.staging.permanent.org/api';

const STAGING_STELA_URL = 'https://api.staging.permanent.org/api/v2';

// An unset or blank value means staging. A trailing slash is dropped so that
// paths can always be appended with one.
const withoutTrailingSlash = (url: string): string =>
	url.endsWith('/') ? url.slice(0, -1) : url;

const urlOrDefault = (
	configured: string | undefined,
	fallback: string,
): string => {
	const trimmed = configured?.trim() ?? '';
	return trimmed === '' ? fallback : withoutTrailingSlash(trimmed);
};

export const permanentApiUrl = urlOrDefault(
	process.env.EXPO_PUBLIC_PERMANENT_API_URL,
	STAGING_API_URL,
);

export const permanentStelaUrl = urlOrDefault(
	process.env.EXPO_PUBLIC_PERMANENT_STELA_URL,
	STAGING_STELA_URL,
);
