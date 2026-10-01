import { Animated, FlatList, Pressable, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { usePalette } from './Palette';
import type { ReactElement } from 'react';
import type { ImageStyle } from 'react-native';

const COLUMNS = 3;

const percent = (value: number): `${number}%` => `${value}%`;

const styles = StyleSheet.create({
	grid: {
		flexGrow: 0,
		flexShrink: 1,
	},
	cell: {
		width: percent(100 / COLUMNS),
		aspectRatio: 1,
		padding: theme.spacing.xs / 2,
	},
});

const photoStyles = StyleSheet.create<Record<'photo' | 'selected', ImageStyle>>(
	{
		photo: {
			flex: 1,
			borderRadius: theme.radii.md,
		},
		selected: {
			borderWidth: theme.spacing.xs,
		},
	},
);

export interface GridPhoto {
	id: string;
	uri: string;
	accessibilityLabel: string;
}

interface PhotoGridProps {
	photos: GridPhoto[];
	selectedId: string | undefined;
	onSelect: (id: string) => void;
}

export const PhotoGrid = ({
	photos,
	selectedId,
	onSelect,
}: PhotoGridProps): ReactElement => {
	const { colors } = usePalette();

	return (
		<FlatList
			data={photos}
			keyExtractor={({ id }) => id}
			numColumns={COLUMNS}
			renderItem={({ item }) => (
				<Pressable
					accessibilityLabel={item.accessibilityLabel}
					accessibilityRole="button"
					accessibilityState={{ selected: item.id === selectedId }}
					onPress={() => {
						onSelect(item.id);
					}}
					style={styles.cell}
				>
					<Animated.Image
						source={{ uri: item.uri }}
						style={[
							photoStyles.photo,
							item.id === selectedId && [
								photoStyles.selected,
								{ borderColor: colors.accent },
							],
						]}
					/>
				</Pressable>
			)}
			style={styles.grid}
		/>
	);
};
