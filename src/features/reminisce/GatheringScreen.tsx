import { BodyText } from '../../components/BodyText';
import { Screen } from '../../components/Screen';
import type { ReactElement } from 'react';

export const GatheringScreen = (): ReactElement => (
	<Screen palette="gray">
		<BodyText>Gathering your memories…</BodyText>
	</Screen>
);
