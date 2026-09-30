import { PhotosScreen } from './PhotosScreen';
import { ProblemScreen } from './ProblemScreen';
import { RememberedScreen } from './RememberedScreen';
import { StartScreen } from './StartScreen';
import { useRememberFlow } from './useRememberFlow';
import type { Session } from '../../permanent/auth';
import type { ReactElement } from 'react';

interface RememberFlowProps {
	session: Session;
}

export const RememberFlow = ({ session }: RememberFlowProps): ReactElement => {
	const { state, findPhotos, capture, startOver } = useRememberFlow(session);

	switch (state.step) {
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
		case 'remembered':
			return <RememberedScreen />;
	}
};
