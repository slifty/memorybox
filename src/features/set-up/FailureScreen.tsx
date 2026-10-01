import { BodyText } from '../../components/BodyText';
import { Heading } from '../../components/Heading';
import { Screen } from '../../components/Screen';
import { TextButton } from '../../components/TextButton';
import type { PrepareFailureReason } from '../../permanent/memorybox';
import type { ReactElement } from 'react';

const MESSAGES: Record<PrepareFailureReason, string> = {
	'unclaimed-folder':
		'My Files already has a folder named Memorybox that memorybox did not create. Rename or move that folder, then try again.',
	unexpected: 'Something went wrong while getting your Memorybox folder ready.',
};

interface FailureScreenProps {
	reason: PrepareFailureReason;
	detail: string | undefined;
	onTryAgain: () => void;
}

export const FailureScreen = ({
	reason,
	detail,
	onTryAgain,
}: FailureScreenProps): ReactElement => (
	<Screen>
		<Heading>Setup failed</Heading>
		<BodyText>{MESSAGES[reason]}</BodyText>
		{detail !== undefined && (
			<BodyText tone="muted">Details: {detail}</BodyText>
		)}
		<TextButton label="Try again" onPress={onTryAgain} />
	</Screen>
);
