import { StatusBar } from 'expo-status-bar';
import { PaletteProvider } from './components/Palette';
import { RememberFlow } from './features/remember/RememberFlow';
import { ReminisceFlow } from './features/reminisce/ReminisceFlow';
import { SetUpFlow } from './features/set-up/SetUpFlow';
import { SignInFlow } from './features/sign-in/SignInFlow';
import type { ReactElement } from 'react';

export const App = (): ReactElement => (
	<PaletteProvider>
		<SignInFlow
			renderSignedIn={(session, signOut) => (
				<SetUpFlow
					onSignedOut={signOut}
					renderReady={(memorybox) => (
						<RememberFlow
							memorybox={memorybox}
							onSignedOut={signOut}
							renderReminisce={(onBack) => (
								<ReminisceFlow
									memorybox={memorybox}
									onBack={onBack}
									onSignedOut={signOut}
									session={session}
								/>
							)}
							session={session}
						/>
					)}
					session={session}
				/>
			)}
		/>
		<StatusBar style="auto" />
	</PaletteProvider>
);
