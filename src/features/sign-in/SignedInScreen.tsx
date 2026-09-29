import { BodyText } from '../../components/BodyText';
import { Heading } from '../../components/Heading';
import { Screen } from '../../components/Screen';
import type { Account } from '../../permanent/auth';
import type { ReactElement } from 'react';

interface SignedInScreenProps {
	account: Account;
}

export const SignedInScreen = ({
	account,
}: SignedInScreenProps): ReactElement => (
	<Screen>
		<Heading>You're logged in</Heading>
		<BodyText>
			Signed in to Permanent as {account.name ?? account.email}.
		</BodyText>
	</Screen>
);
