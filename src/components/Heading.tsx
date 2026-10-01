import { Animated, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { usePalette } from './Palette';
import type { ReactElement } from 'react';

const styles = StyleSheet.create({
	heading: {
		fontSize: theme.fontSizes.heading,
		fontWeight: theme.fontWeights.bold,
	},
});

interface HeadingProps {
	children: string;
}

export const Heading = ({ children }: HeadingProps): ReactElement => {
	const { colors } = usePalette();

	return (
		<Animated.Text
			accessibilityRole="header"
			style={[styles.heading, { color: colors.text }]}
		>
			{children}
		</Animated.Text>
	);
};
