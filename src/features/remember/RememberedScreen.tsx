import { Button } from '../../components/Button';
import { FadeSequence } from '../../components/FadeSequence';
import { Heading } from '../../components/Heading';
import { Screen } from '../../components/Screen';
import type { ReactElement } from 'react';

interface RememberedScreenProps {
	onReminisce: () => void;
}

export const RememberedScreen = ({
	onReminisce,
}: RememberedScreenProps): ReactElement => (
	<Screen palette="gray">
		<FadeSequence
			steps={[
				<Heading key="done">Done.</Heading>,
				<Heading key="tomorrow">Remember more tomorrow.</Heading>,
			]}
		/>
		<Button label="Reminisce" onPress={onReminisce} />
	</Screen>
);
