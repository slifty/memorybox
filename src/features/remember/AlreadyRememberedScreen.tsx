import { BodyText } from '../../components/BodyText';
import { Heading } from '../../components/Heading';
import { Screen } from '../../components/Screen';
import type { ReactElement } from 'react';

export const AlreadyRememberedScreen = (): ReactElement => (
	<Screen>
		<Heading>Today is remembered.</Heading>
		<BodyText>Remember more tomorrow.</BodyText>
	</Screen>
);
