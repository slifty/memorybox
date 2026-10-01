import { FailureScreen } from './FailureScreen';
import { PreparingScreen } from './PreparingScreen';
import { useSetUpFlow } from './useSetUpFlow';
import type { Session } from '../../permanent/auth';
import type { Folder } from '../../permanent/folders';
import type { ReactElement } from 'react';

interface SetUpFlowProps {
	session: Session;
	onSignedOut: () => void;
	renderReady: (memorybox: Folder) => ReactElement;
}

export const SetUpFlow = ({
	session,
	onSignedOut,
	renderReady,
}: SetUpFlowProps): ReactElement => {
	const { state, tryAgain } = useSetUpFlow(session, onSignedOut);

	switch (state.step) {
		case 'preparing':
		case 'signed-out':
			return <PreparingScreen />;
		case 'ready':
			return renderReady(state.memorybox);
		case 'failed':
			return (
				<FailureScreen
					detail={state.detail}
					onTryAgain={tryAgain}
					reason={state.reason}
				/>
			);
	}
};
