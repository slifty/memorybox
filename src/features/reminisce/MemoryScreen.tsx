import { Button } from '../../components/Button';
import { CaptionedPhoto } from '../../components/CaptionedPhoto';
import { Screen } from '../../components/Screen';
import { describeAge } from './age';
import type { SavedMemory } from '../../permanent/memories';
import type { ReactElement } from 'react';

const describeDay = (day: string): string => {
	const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
	return new Date(year, month - 1, date).toLocaleDateString([], {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};

interface MemoryScreenProps {
	memory: SavedMemory;
	today: string;
	onBack: () => void;
}

export const MemoryScreen = ({
	memory,
	today,
	onBack,
}: MemoryScreenProps): ReactElement => (
	<Screen palette="gray">
		<CaptionedPhoto
			accessibilityLabel={`Memory from ${describeDay(memory.day)}`}
			caption={describeAge(memory.day, today)}
			missingPhotoText="This photo is still being prepared."
			uri={memory.imageUrl}
		/>
		<Button label="Back" onPress={onBack} />
	</Screen>
);
