import { BodyText } from '../../components/BodyText';
import { Button } from '../../components/Button';
import { Heading } from '../../components/Heading';
import { Screen } from '../../components/Screen';
import type { ReactElement } from 'react';

interface FailureScreenProps {
	detail: string;
	onTryAgain: () => void;
	onBack: () => void;
}

export const FailureScreen = ({
	detail,
	onTryAgain,
	onBack,
}: FailureScreenProps): ReactElement => (
	<Screen palette="gray">
		<Heading>Your memories could not be gathered</Heading>
		<BodyText tone="muted">Details: {detail}</BodyText>
		<Button label="Try again" onPress={onTryAgain} />
		<Button label="Back" onPress={onBack} />
	</Screen>
);
