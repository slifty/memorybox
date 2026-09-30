import { StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from '../theme';
import type { ReactElement } from 'react';
import type { TextInputProps } from 'react-native';

const styles = StyleSheet.create({
	field: {
		gap: theme.spacing.xs,
	},
	label: {
		color: theme.colors.text,
		fontSize: theme.fontSizes.small,
		fontWeight: theme.fontWeights.bold,
	},
	input: {
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radii.md,
		padding: theme.spacing.md,
		color: theme.colors.text,
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
}: TextFieldProps): ReactElement => (
	<View style={styles.field}>
		<Text style={styles.label}>{label}</Text>
		<TextInput
			{...inputProps}
			accessibilityLabel={label}
			style={[styles.input, error !== undefined && styles.inputInvalid]}
		/>
		{error !== undefined && (
			<Text accessibilityLiveRegion="polite" role="alert" style={styles.error}>
				{error}
			</Text>
		)}
	</View>
);
