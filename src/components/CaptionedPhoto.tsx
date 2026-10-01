import { Animated, Image, StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { BodyText } from './BodyText';
import { usePalette } from './Palette';
import type { ReactElement } from 'react';

const styles = StyleSheet.create({
	captioned: {
		alignItems: 'center',
		gap: theme.spacing.sm,
	},
	photo: {
		width: '100%',
		aspectRatio: 3 / 4,
		borderRadius: theme.radii.md,
	},
	missingPhoto: {
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
	},
});

interface CaptionedPhotoProps {
	uri: string | undefined;
	caption: string;
	accessibilityLabel: string;
	missingPhotoText: string;
}

export const CaptionedPhoto = ({
	uri,
	caption,
	accessibilityLabel,
	missingPhotoText,
}: CaptionedPhotoProps): ReactElement => {
	const { colors } = usePalette();

	return (
		<View style={styles.captioned}>
			{uri === undefined ? (
				<Animated.View
					accessibilityLabel={`${accessibilityLabel}. ${missingPhotoText}`}
					accessible
					style={[
						styles.photo,
						styles.missingPhoto,
						{ borderColor: colors.accent },
					]}
				>
					<BodyText tone="muted">{missingPhotoText}</BodyText>
				</Animated.View>
			) : (
				<Image
					accessibilityLabel={accessibilityLabel}
					resizeMode="contain"
					source={{ uri }}
					style={styles.photo}
				/>
			)}
			<BodyText>{caption}</BodyText>
		</View>
	);
};
