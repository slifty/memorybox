import { BodyText } from '../../components/BodyText';
import { Screen } from '../../components/Screen';
import type { ReactElement } from 'react';

export const PreparingScreen = (): ReactElement => (
	<Screen>
		<BodyText>Setting up your Memorybox…</BodyText>
	</Screen>
);
