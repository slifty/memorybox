import { BodyText } from '../../components/BodyText';
import { Button } from '../../components/Button';
import { Heading } from '../../components/Heading';
import { Screen } from '../../components/Screen';
import type { FailureReason } from '../../permanent/auth';
import type { ReactElement } from 'react';

const MESSAGES: Record<FailureReason, string> = {
	'invalid-credentials': 'That email and password did not match an account.',
	'invalid-code': 'That verification code was not correct.',
	'expired-code': 'That verification code has expired.',
	unexpected: 'Something went wrong while logging in.',
};

interface FailureScreenProps {
	reason: FailureReason;
	// What went wrong, when the reason is `unexpected`. Shown so that a problem
	// can be reported and diagnosed.
	detail: string | undefined;
	onTryAgain: () => void;
}

export const FailureScreen = ({
	reason,
	detail,
	onTryAgain,
}: FailureScreenProps): ReactElement => (
	<Screen>
		<Heading>Login failed</Heading>
		<BodyText>{MESSAGES[reason]}</BodyText>
		{detail !== undefined && (
			<BodyText tone="muted">Details: {detail}</BodyText>
		)}
		<Button label="Try again" onPress={onTryAgain} />
	</Screen>
);
