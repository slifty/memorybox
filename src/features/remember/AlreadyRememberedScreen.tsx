import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import type { ReactElement } from 'react';

interface AlreadyRememberedScreenProps {
	onReminisce: () => void;
}

export const AlreadyRememberedScreen = ({
	onReminisce,
}: AlreadyRememberedScreenProps): ReactElement => (
	<Screen palette="gray">
		<Button label="Reminisce" onPress={onReminisce} />
	</Screen>
);
