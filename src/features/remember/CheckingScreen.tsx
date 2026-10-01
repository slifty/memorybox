import { BodyText } from '../../components/BodyText';
import { Screen } from '../../components/Screen';
import type { ReactElement } from 'react';

export const CheckingScreen = (): ReactElement => (
	<Screen>
		<BodyText>Checking for today's memory…</BodyText>
	</Screen>
);
