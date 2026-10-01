import { Screen } from '../../components/Screen';
import { CodeScreen } from './CodeScreen';
import { CredentialsScreen } from './CredentialsScreen';
import { FailureScreen } from './FailureScreen';
import { useSignInFlow } from './useSignInFlow';
import type { Session } from '../../permanent/auth';
import type { ReactElement } from 'react';

interface SignInFlowProps {
	renderSignedIn: (session: Session, signOut: () => void) => ReactElement;
}

export const SignInFlow = ({
	renderSignedIn,
}: SignInFlowProps): ReactElement => {
	const { state, submitCredentials, submitCode, startOver, signOut } =
		useSignInFlow();

	switch (state.step) {
		case 'restoring':
			return <Screen />;
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
			return renderSignedIn(state.session, signOut);
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
