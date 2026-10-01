import { useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { DEFAULT_PALETTE, usePalette } from './Palette';
import type { PaletteName } from './Palette';
import type { ReactElement, ReactNode } from 'react';

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		justifyContent: 'center',
		gap: theme.spacing.md,
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
	const insets = useSafeAreaInsets();

	useEffect(() => {
		show(palette);
	}, [palette, show]);

	return (
		<Animated.View
			style={[
				styles.screen,
				{
					backgroundColor: colors.background,
					paddingTop: theme.spacing.lg + insets.top,
					paddingRight: theme.spacing.lg + insets.right,
					paddingBottom: theme.spacing.lg + insets.bottom,
					paddingLeft: theme.spacing.lg + insets.left,
				},
			]}
			testID="screen"
		>
			{children}
		</Animated.View>
	);
};
