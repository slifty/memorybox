import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';
import type { ReactElement } from 'react';

const styles = StyleSheet.create({
	label: {
		color: theme.colors.primary,
		fontSize: theme.fontSizes.body,
		textDecorationLine: 'underline',
	},
	inactive: {
		opacity: 0.5,
	},
});

interface TextButtonProps {
	label: string;
	onPress: () => void;
	disabled?: boolean;
}

// A secondary action. It looks like a link but acts in place, so screen
// readers announce it as a button.
export const TextButton = ({
	label,
	onPress,
	disabled = false,
}: TextButtonProps): ReactElement => (
	<Pressable
		accessibilityRole="button"
		accessibilityState={{ disabled }}
		disabled={disabled}
		onPress={onPress}
	>
		<Text style={[styles.label, disabled && styles.inactive]}>{label}</Text>
	</Pressable>
);
