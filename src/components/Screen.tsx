import { useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { DEFAULT_PALETTE, usePalette } from './Palette';
import type { PaletteName } from './Palette';
import type { ReactElement, ReactNode } from 'react';

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		justifyContent: 'center',
		gap: theme.spacing.md,
		padding: theme.spacing.lg,
	},
});

interface ScreenProps {
	children?: ReactNode;
	palette?: PaletteName;
}

// The outermost container of every screen.
export const Screen = ({
	children,
	palette = DEFAULT_PALETTE,
}: ScreenProps): ReactElement => {
	const { colors, show } = usePalette();

	useEffect(() => {
		show(palette);
	}, [palette, show]);

	return (
		<Animated.View
			style={[styles.screen, { backgroundColor: colors.background }]}
			testID="screen"
		>
			{children}
		</Animated.View>
	);
};
