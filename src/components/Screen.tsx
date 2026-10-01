import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import type { ReactElement, ReactNode } from 'react';

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		justifyContent: 'center',
		gap: theme.spacing.md,
		padding: theme.spacing.lg,
		backgroundColor: theme.colors.background,
	},
});

interface ScreenProps {
	children?: ReactNode;
}

// The outermost container of every screen.
export const Screen = ({ children }: ScreenProps): ReactElement => (
	<View style={styles.screen}>{children}</View>
);
