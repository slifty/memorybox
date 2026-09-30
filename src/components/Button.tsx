import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';
import type { ReactElement } from 'react';

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		padding: theme.spacing.md,
		borderRadius: theme.radii.md,
		backgroundColor: theme.colors.primary,
	},
	inactive: {
		opacity: 0.5,
	},
	label: {
		color: theme.colors.onPrimary,
		fontSize: theme.fontSizes.body,
		fontWeight: theme.fontWeights.bold,
	},
});

interface ButtonProps {
	label: string;
	onPress: () => void;
	disabled?: boolean;
	// Shows progress in place of the label and blocks presses.
	busy?: boolean;
}

// The primary action on a screen.
export const Button = ({
	label,
	onPress,
	disabled = false,
	busy = false,
}: ButtonProps): ReactElement => (
	<Pressable
		accessibilityLabel={label}
		accessibilityRole="button"
		accessibilityState={{ disabled: disabled || busy, busy }}
		disabled={disabled || busy}
		onPress={onPress}
		style={[styles.button, (disabled || busy) && styles.inactive]}
	>
		{busy ? (
			<ActivityIndicator color={theme.colors.onPrimary} />
		) : (
			<Text style={styles.label}>{label}</Text>
		)}
	</Pressable>
);
