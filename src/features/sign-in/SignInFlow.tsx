import { CodeScreen } from './CodeScreen';
import { CredentialsScreen } from './CredentialsScreen';
import { FailureScreen } from './FailureScreen';
import { SignedInScreen } from './SignedInScreen';
import { useSignInFlow } from './useSignInFlow';
import type { ReactElement } from 'react';

export const SignInFlow = (): ReactElement => {
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
			return <SignedInScreen account={state.session.account} />;
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
