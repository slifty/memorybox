import {
	ActivityIndicator,
	Animated,
	Pressable,
	StyleSheet,
} from 'react-native';
import { theme } from '../theme';
import { usePalette } from './Palette';
import type { ReactElement } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedActivityIndicator =
	Animated.createAnimatedComponent(ActivityIndicator);

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		padding: theme.spacing.md,
		borderRadius: theme.radii.md,
		borderWidth: 2,
	},
	inactive: {
		opacity: 0.5,
	},
	label: {
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

export const Button = ({
	label,
	onPress,
	disabled = false,
	busy = false,
}: ButtonProps): ReactElement => {
	const { colors } = usePalette();

	return (
		<AnimatedPressable
			accessibilityLabel={label}
			accessibilityRole="button"
			accessibilityState={{ disabled: disabled || busy, busy }}
			disabled={disabled || busy}
			onPress={onPress}
			style={[
				styles.button,
				{ borderColor: colors.accent },
				(disabled || busy) && styles.inactive,
			]}
		>
			{busy ? (
				<AnimatedActivityIndicator color={colors.accent} />
			) : (
				<Animated.Text style={[styles.label, { color: colors.accent }]}>
					{label}
				</Animated.Text>
			)}
		</AnimatedPressable>
	);
};
