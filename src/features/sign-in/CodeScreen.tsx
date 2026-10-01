import { useState } from 'react';
import { BodyText } from '../../components/BodyText';
import { Button } from '../../components/Button';
import { Heading } from '../../components/Heading';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useSubmit } from '../../components/useSubmit';
import type { CodeError } from './useSignInFlow';
import type { ReactElement } from 'react';

const ERRORS: Record<CodeError, string> = {
	'invalid-code': 'That code was not correct. Check it and try again.',
	'expired-code': 'That code has expired. Start over to get a new one.',
};

interface CodeScreenProps {
	email: string;
	error: CodeError | undefined;
	onSubmit: (code: string) => Promise<void>;
	onStartOver: () => void;
}

export const CodeScreen = ({
	email,
	error,
	onSubmit,
	onStartOver,
}: CodeScreenProps): ReactElement => {
	const [code, setCode] = useState('');
	const { submit, busy } = useSubmit(async () => {
		await onSubmit(code.trim());
	}, code.trim() !== '');

	return (
		<Screen>
			<Heading>Enter your verification code</Heading>
			<BodyText>
				Permanent sent a code to the email address or phone number set up for{' '}
				{email}.
			</BodyText>
			<TextField
				autoComplete="one-time-code"
				editable={!busy}
				error={error === undefined ? undefined : ERRORS[error]}
				inputMode="numeric"
				label="Verification code"
				onChangeText={setCode}
				onSubmitEditing={submit}
				value={code}
			/>
			<Button
				busy={busy}
				disabled={code.trim() === ''}
				label="Verify"
				onPress={submit}
			/>
			<Button label="Start over" onPress={onStartOver} />
		</Screen>
	);
};
