import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { useSubmit } from '../../components/useSubmit';
import type { ReactElement } from 'react';

interface StartScreenProps {
	onRemember: () => Promise<void>;
}

export const StartScreen = ({ onRemember }: StartScreenProps): ReactElement => {
	const { submit, busy } = useSubmit(onRemember, true);

	return (
		<Screen>
			<Button busy={busy} label="Remember" onPress={submit} />
		</Screen>
	);
};
