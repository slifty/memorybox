import { FadeSequence } from '../../components/FadeSequence';
import { Heading } from '../../components/Heading';
import { Screen } from '../../components/Screen';
import type { ReactElement } from 'react';

export const RememberedScreen = (): ReactElement => (
	<Screen palette="gray">
		<FadeSequence
			steps={[
				<Heading key="done">Done.</Heading>,
				<Heading key="tomorrow">Remember more tomorrow.</Heading>,
			]}
		/>
	</Screen>
);
