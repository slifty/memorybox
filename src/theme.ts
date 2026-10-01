// Design tokens. Components read their colors, spacing, and type from here,
// so a visual change is a change to this file rather than to every component.
export const theme = {
	palettes: {
		yellow: {
			background: '#fdf3c4',
			text: '#7a5200',
			mutedText: '#8a5a00',
			accent: '#8a5a00',
		},
		gray: {
			background: '#ececec',
			text: '#1f1f1f',
			mutedText: '#525252',
			accent: '#525252',
		},
	},
	colors: {
		error: '#b3261e',
	},
	durations: {
		paletteChange: 1500,
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
