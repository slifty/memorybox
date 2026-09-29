import { StyleSheet, Text } from 'react-native';
import { theme } from '../theme';
import type { ReactElement } from 'react';

const styles = StyleSheet.create({
	heading: {
		color: theme.colors.text,
		fontSize: theme.fontSizes.heading,
		fontWeight: theme.fontWeights.bold,
	},
});

interface HeadingProps {
	children: string;
}

export const Heading = ({ children }: HeadingProps): ReactElement => (
	<Text accessibilityRole="header" style={styles.heading}>
		{children}
	</Text>
);
