import { FailureScreen } from './FailureScreen';
import { GatheringScreen } from './GatheringScreen';
import { MemoryScreen } from './MemoryScreen';
import { NoMemoriesScreen } from './NoMemoriesScreen';
import { useReminisceFlow } from './useReminisceFlow';
import type { Session } from '../../permanent/auth';
import type { Folder } from '../../permanent/folders';
import type { ReactElement } from 'react';

interface ReminisceFlowProps {
	session: Session;
	memorybox: Folder;
	onSignedOut: () => void;
	onBack: () => void;
}

export const ReminisceFlow = ({
	session,
	memorybox,
	onSignedOut,
	onBack,
}: ReminisceFlowProps): ReactElement => {
	const { state, tryAgain } = useReminisceFlow(session, memorybox, onSignedOut);

	switch (state.step) {
		case 'gathering':
		case 'signed-out':
			return <GatheringScreen />;
		case 'showing':
			return (
				<MemoryScreen
					memory={state.memory}
					onBack={onBack}
					today={state.today}
				/>
			);
		case 'empty':
			return <NoMemoriesScreen onBack={onBack} />;
		case 'failed':
			return (
				<FailureScreen
					detail={state.detail}
					onBack={onBack}
					onTryAgain={tryAgain}
				/>
			);
	}
};
