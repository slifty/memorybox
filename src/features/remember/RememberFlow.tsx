import { AlreadyRememberedScreen } from './AlreadyRememberedScreen';
import { CheckingScreen } from './CheckingScreen';
import { PhotosScreen } from './PhotosScreen';
import { ProblemScreen } from './ProblemScreen';
import { RememberedScreen } from './RememberedScreen';
import { StartScreen } from './StartScreen';
import { useRememberFlow } from './useRememberFlow';
import type { Session } from '../../permanent/auth';
import type { Folder } from '../../permanent/folders';
import type { ReactElement } from 'react';

interface RememberFlowProps {
	session: Session;
	memorybox: Folder;
}

export const RememberFlow = ({
	session,
	memorybox,
}: RememberFlowProps): ReactElement => {
	const { state, findPhotos, capture, startOver, checkAgain } = useRememberFlow(
		session,
		memorybox,
	);

	switch (state.step) {
		case 'checking':
			return <CheckingScreen />;
		case 'check-failed':
			return (
				<ProblemScreen
					detail={state.detail}
					onBack={checkAgain}
					problem="failed"
				/>
			);
		case 'already-remembered':
			return <AlreadyRememberedScreen />;
		case 'start':
			return <StartScreen onRemember={findPhotos} />;
		case 'choosing':
			return (
				<PhotosScreen
					onBack={startOver}
					onCapture={capture}
					photos={state.photos}
				/>
			);
		case 'no-photos':
		case 'denied':
			return (
				<ProblemScreen
					detail={undefined}
					onBack={startOver}
					problem={state.step}
				/>
			);
		case 'failed':
			return (
				<ProblemScreen
					detail={state.detail}
					onBack={startOver}
					problem="failed"
				/>
			);
		case 'save-failed':
			return (
				<ProblemScreen
					detail={state.detail}
					onBack={checkAgain}
					problem="failed"
				/>
			);
		case 'remembered':
			return <RememberedScreen />;
	}
};
