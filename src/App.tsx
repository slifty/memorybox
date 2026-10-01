import { StatusBar } from 'expo-status-bar';
import { RememberFlow } from './features/remember/RememberFlow';
import { SetUpFlow } from './features/set-up/SetUpFlow';
import { SignInFlow } from './features/sign-in/SignInFlow';
import type { ReactElement } from 'react';

export const App = (): ReactElement => (
	<>
		<SignInFlow
			renderSignedIn={(session, signOut) => (
				<SetUpFlow
					onSignedOut={signOut}
					renderReady={(memorybox) => (
						<RememberFlow
							memorybox={memorybox}
							onSignedOut={signOut}
							session={session}
						/>
					)}
					session={session}
				/>
			)}
		/>
		<StatusBar style="auto" />
	</>
);
