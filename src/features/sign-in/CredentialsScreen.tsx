import { useState } from 'react';
import { Button } from '../../components/Button';
import { Heading } from '../../components/Heading';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { useSubmit } from '../../components/useSubmit';
import type { ReactElement } from 'react';

interface CredentialsScreenProps {
	onSubmit: (email: string, password: string) => Promise<void>;
}

export const CredentialsScreen = ({
	onSubmit,
}: CredentialsScreenProps): ReactElement => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const { submit, busy } = useSubmit(
		async () => {
			await onSubmit(email.trim(), password);
		},
		email.trim() !== '' && password !== '',
	);

	return (
		<Screen>
			<Heading>Log in to Permanent</Heading>
			<TextField
				autoCapitalize="none"
				autoComplete="email"
				editable={!busy}
				inputMode="email"
				label="Email"
				onChangeText={setEmail}
				value={email}
			/>
			<TextField
				autoComplete="current-password"
				editable={!busy}
				label="Password"
				onChangeText={setPassword}
				onSubmitEditing={submit}
				secureTextEntry
				value={password}
			/>
			<Button
				busy={busy}
				disabled={email.trim() === '' || password === ''}
				label="Log in"
				onPress={submit}
			/>
		</Screen>
	);
};
