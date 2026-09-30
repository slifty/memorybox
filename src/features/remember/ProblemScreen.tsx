import { Linking } from 'react-native';
import { BodyText } from '../../components/BodyText';
import { Heading } from '../../components/Heading';
import { Screen } from '../../components/Screen';
import { TextButton } from '../../components/TextButton';
import type { ReactElement } from 'react';

export type Problem = 'no-photos' | 'denied' | 'failed';

const MESSAGES: Record<Problem, { heading: string; body: string }> = {
	'no-photos': {
		heading: 'No photos yet today',
		body: 'Take a photo, then come back to remember it.',
	},
	denied: {
		heading: 'memorybox cannot see your photos',
		body: 'Allow access to your photos in Settings, then try again.',
	},
	failed: {
		heading: 'Something went wrong',
		body: 'Please try again.',
	},
};

interface ProblemScreenProps {
	problem: Problem;
	detail: string | undefined;
	onBack: () => void;
}

export const ProblemScreen = ({
	problem,
	detail,
	onBack,
}: ProblemScreenProps): ReactElement => (
	<Screen>
		<Heading>{MESSAGES[problem].heading}</Heading>
		<BodyText>{MESSAGES[problem].body}</BodyText>
		{detail !== undefined && (
			<BodyText tone="muted">Details: {detail}</BodyText>
		)}
		{problem === 'denied' && (
			<TextButton
				label="Open Settings"
				onPress={() => {
					void Linking.openSettings();
				}}
			/>
		)}
		<TextButton label="Back" onPress={onBack} />
	</Screen>
);
