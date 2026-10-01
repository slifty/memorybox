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
	onSignedOut: () => void;
	renderReminisce: (onBack: () => void) => ReactElement;
}

export const RememberFlow = ({
	session,
	memorybox,
	onSignedOut,
	renderReminisce,
}: RememberFlowProps): ReactElement => {
	const {
		state,
		findPhotos,
		capture,
		startOver,
		checkAgain,
		reminisce,
		stopReminiscing,
	} = useRememberFlow(session, memorybox, onSignedOut);

	switch (state.step) {
		case 'checking':
		case 'signed-out':
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
			return <AlreadyRememberedScreen onReminisce={reminisce} />;
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
			return <RememberedScreen onReminisce={reminisce} />;
		case 'reminiscing':
			return renderReminisce(stopReminiscing);
	}
};
