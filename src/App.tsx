import { StatusBar } from 'expo-status-bar';
import { SignInFlow } from './features/sign-in/SignInFlow';
import type { ReactElement } from 'react';

export const App = (): ReactElement => (
	<>
		<SignInFlow />
		<StatusBar style="auto" />
	</>
);
