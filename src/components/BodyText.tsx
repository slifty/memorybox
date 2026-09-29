import { StyleSheet, Text } from 'react-native';
import { theme } from '../theme';
import type { ReactElement, ReactNode } from 'react';

const styles = StyleSheet.create({
	default: {
		color: theme.colors.text,
		fontSize: theme.fontSizes.body,
	},
	muted: {
		color: theme.colors.mutedText,
		fontSize: theme.fontSizes.small,
	},
});

interface BodyTextProps {
	children: ReactNode;
	tone?: keyof typeof styles;
}

export const BodyText = ({
	children,
	tone = 'default',
}: BodyTextProps): ReactElement => <Text style={styles[tone]}>{children}</Text>;
