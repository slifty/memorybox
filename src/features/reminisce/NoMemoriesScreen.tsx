import { BodyText } from '../../components/BodyText';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import type { ReactElement } from 'react';

interface NoMemoriesScreenProps {
	onBack: () => void;
}

export const NoMemoriesScreen = ({
	onBack,
}: NoMemoriesScreenProps): ReactElement => (
	<Screen palette="gray">
		<BodyText>There are no earlier memories yet.</BodyText>
		<Button label="Back" onPress={onBack} />
	</Screen>
);
