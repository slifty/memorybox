// Design tokens. Components read their colors, spacing, and type from here,
// so a visual change is a change to this file rather than to every component.
export const theme = {
	colors: {
		background: '#ffffff',
		text: '#1a1a1a',
		mutedText: '#5c5c5c',
		border: '#c4c4c4',
		primary: '#131b4a',
		onPrimary: '#ffffff',
		error: '#b3261e',
	},
	spacing: {
		xs: 4,
		sm: 8,
		md: 16,
		lg: 24,
	},
	radii: {
		md: 8,
	},
	fontSizes: {
		small: 14,
		body: 16,
		heading: 24,
	},
	fontWeights: {
		bold: '600',
	},
} as const;
