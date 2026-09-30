import { StatusBar } from 'expo-status-bar';
import { RememberFlow } from './features/remember/RememberFlow';
import { SignInFlow } from './features/sign-in/SignInFlow';
import type { ReactElement } from 'react';

export const App = (): ReactElement => (
	<>
		<SignInFlow
			renderSignedIn={(session) => <RememberFlow session={session} />}
		/>
		<StatusBar style="auto" />
	</>
);
