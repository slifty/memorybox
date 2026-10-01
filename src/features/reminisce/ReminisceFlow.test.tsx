import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import {
	render,
	screen,
	userEvent,
	waitFor,
} from '@testing-library/react-native';
import { dayOf } from '../../permanent/memories';
import {
	MEMORYBOX,
	fakePermanent,
	fakePermanentFetch,
	resetFakePermanent,
	thumbnailUrlOf,
} from '../../permanent/testing';
import { ReminisceFlow } from './ReminisceFlow';

const session = {
	token: 'auth-token',
	account: { email: 'ada@example.com', name: 'Ada' },
};

const daysAgo = (days: number): string => {
	const time = new Date();
	time.setDate(time.getDate() - days);
	return dayOf(time.getTime());
};

beforeEach(() => {
	resetFakePermanent();
	jest.spyOn(globalThis, 'fetch').mockImplementation(fakePermanentFetch);
});

afterEach(() => {
	jest.restoreAllMocks();
});

const renderFlow = async (
	callbacks: { onBack?: () => void; onSignedOut?: () => void } = {},
): Promise<void> => {
	await render(
		<ReminisceFlow
			memorybox={MEMORYBOX}
			onBack={callbacks.onBack ?? jest.fn<() => void>()}
			onSignedOut={callbacks.onSignedOut ?? jest.fn<() => void>()}
			session={session}
		/>,
	);
};

describe('ReminisceFlow', () => {
	it('shows one memory, chosen at random', async () => {
		fakePermanent.memories = [
			`${daysAgo(0)}.jpg`,
			`${daysAgo(3)}.heic`,
			`${daysAgo(1)}.jpg`,
		];
		jest.spyOn(Math, 'random').mockReturnValue(0.5);
		await renderFlow();

		expect(await screen.findByText('Yesterday')).toBeOnTheScreen();
		expect(screen.getAllByLabelText(/^Memory from /v)).toHaveLength(1);
		expect(screen.getByLabelText(/^Memory from /v)).toHaveProp('source', {
			uri: thumbnailUrlOf(`${daysAgo(1)}.jpg`),
		});
	});

	it('says when today is the only memory', async () => {
		fakePermanent.memories = [`${daysAgo(0)}.jpg`];
		await renderFlow();

		expect(
			await screen.findByText('There are no earlier memories yet.'),
		).toBeOnTheScreen();
	});

	it('goes back', async () => {
		fakePermanent.memories = [`${daysAgo(0)}.jpg`];
		const onBack = jest.fn<() => void>();
		await renderFlow({ onBack });
		await userEvent.press(await screen.findByRole('button', { name: 'Back' }));

		expect(onBack).toHaveBeenCalledTimes(1);
	});

	it('explains memories it could not gather, and tries again', async () => {
		fakePermanent.memories = [`${daysAgo(2)}.jpg`];
		fakePermanent.failingPath = `/folders/${MEMORYBOX.folderId}/`;
		await renderFlow();
		expect(await screen.findByText('Details: HTTP 500')).toBeOnTheScreen();

		fakePermanent.failingPath = undefined;
		await userEvent.press(screen.getByRole('button', { name: 'Try again' }));

		expect(await screen.findByText('2 days ago')).toBeOnTheScreen();
	});

	it('signs out when the session has expired', async () => {
		fakePermanent.tokenExpired = true;
		const onSignedOut = jest.fn<() => void>();
		await renderFlow({ onSignedOut });

		await waitFor(() => {
			expect(onSignedOut).toHaveBeenCalledTimes(1);
		});
	});
});
