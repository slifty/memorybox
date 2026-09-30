import { CodeScreen } from './CodeScreen';
import { CredentialsScreen } from './CredentialsScreen';
import { FailureScreen } from './FailureScreen';
import { useSignInFlow } from './useSignInFlow';
import type { Session } from '../../permanent/auth';
import type { ReactElement } from 'react';

interface SignInFlowProps {
	renderSignedIn: (session: Session) => ReactElement;
}

export const SignInFlow = ({
	renderSignedIn,
}: SignInFlowProps): ReactElement => {
	const { state, submitCredentials, submitCode, startOver } = useSignInFlow();

	switch (state.step) {
		case 'credentials':
			return <CredentialsScreen onSubmit={submitCredentials} />;
		case 'code':
			return (
				<CodeScreen
					email={state.email}
					error={state.error}
					onStartOver={startOver}
					onSubmit={submitCode}
				/>
			);
		case 'signed-in':
			return renderSignedIn(state.session);
		case 'failed':
			return (
				<FailureScreen
					detail={state.detail}
					onTryAgain={startOver}
					reason={state.reason}
				/>
			);
	}
};
