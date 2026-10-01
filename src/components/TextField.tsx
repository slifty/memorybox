import { Animated, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';
import { usePalette } from './Palette';
import type { ReactElement } from 'react';
import type { TextInputProps } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const styles = StyleSheet.create({
	field: {
		gap: theme.spacing.xs,
	},
	label: {
		fontSize: theme.fontSizes.small,
		fontWeight: theme.fontWeights.bold,
	},
	input: {
		borderWidth: 1,
		borderRadius: theme.radii.md,
		padding: theme.spacing.md,
		fontSize: theme.fontSizes.body,
	},
	inputInvalid: {
		borderColor: theme.colors.error,
	},
	error: {
		color: theme.colors.error,
		fontSize: theme.fontSizes.small,
	},
});

type TextFieldProps = Pick<
	TextInputProps,
	| 'autoCapitalize'
	| 'autoComplete'
	| 'editable'
	| 'inputMode'
	| 'onChangeText'
	| 'onSubmitEditing'
	| 'secureTextEntry'
	| 'value'
> & {
	label: string;
	// Shown under the input, and announced to screen readers when it appears.
	error?: string;
};

export const TextField = ({
	label,
	error,
	...inputProps
}: TextFieldProps): ReactElement => {
	const { colors } = usePalette();

	return (
		<View style={styles.field}>
			<Animated.Text style={[styles.label, { color: colors.text }]}>
				{label}
			</Animated.Text>
			<AnimatedTextInput
				{...inputProps}
				accessibilityLabel={label}
				style={[
					styles.input,
					{ borderColor: colors.accent, color: colors.text },
					error !== undefined && styles.inputInvalid,
				]}
			/>
			{error !== undefined && (
				<Text
					accessibilityLiveRegion="polite"
					role="alert"
					style={styles.error}
				>
					{error}
				</Text>
			)}
		</View>
	);
};
