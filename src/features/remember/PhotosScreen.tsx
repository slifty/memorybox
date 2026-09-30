import { useState } from 'react';
import { Button } from '../../components/Button';
import { Heading } from '../../components/Heading';
import { PhotoGrid } from '../../components/PhotoGrid';
import { Screen } from '../../components/Screen';
import { TextButton } from '../../components/TextButton';
import { useSubmit } from '../../components/useSubmit';
import type { Photo } from '../../photos/library';
import type { ReactElement } from 'react';

const describe = ({ takenAtMs }: Photo): string =>
	`Photo taken at ${new Date(takenAtMs).toLocaleTimeString([], {
		hour: 'numeric',
		minute: '2-digit',
	})}`;

interface PhotosScreenProps {
	photos: Photo[];
	onCapture: (photo: Photo) => Promise<void>;
	onBack: () => void;
}

export const PhotosScreen = ({
	photos,
	onCapture,
	onBack,
}: PhotosScreenProps): ReactElement => {
	const [selectedId, setSelectedId] = useState<string>();
	const selected = photos.find(({ id }) => id === selectedId);
	const { submit, busy } = useSubmit(async () => {
		if (selected !== undefined) {
			await onCapture(selected);
		}
	}, selected !== undefined);

	return (
		<Screen>
			<Heading>Today's photos</Heading>
			<PhotoGrid
				onSelect={setSelectedId}
				photos={photos.map((photo) => ({
					...photo,
					accessibilityLabel: describe(photo),
				}))}
				selectedId={selectedId}
			/>
			<Button
				busy={busy}
				disabled={selected === undefined}
				label="Capture Memory"
				onPress={submit}
			/>
			<TextButton label="Back" onPress={onBack} />
		</Screen>
	);
};
