import { Animated, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { usePalette } from './Palette';
import type { PaletteColors } from './Palette';
import type { ReactElement, ReactNode } from 'react';

const styles = StyleSheet.create({
	default: {
		fontSize: theme.fontSizes.body,
	},
	muted: {
		fontSize: theme.fontSizes.small,
	},
});

type Tone = keyof typeof styles;

const TONE_COLORS: Record<Tone, keyof PaletteColors> = {
	default: 'text',
	muted: 'mutedText',
};

interface BodyTextProps {
	children: ReactNode;
	tone?: Tone;
}

export const BodyText = ({
	children,
	tone = 'default',
}: BodyTextProps): ReactElement => {
	const { colors } = usePalette();

	return (
		<Animated.Text style={[styles[tone], { color: colors[TONE_COLORS[tone]] }]}>
			{children}
		</Animated.Text>
	);
};
