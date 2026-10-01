import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import {
	act,
	fireEvent,
	render,
	screen,
	userEvent,
} from '@testing-library/react-native';
import { AppState } from 'react-native';
import { App } from './App';
import { permanentApiUrl } from './config';
import { dayOf } from './permanent/memories';
import { saveSession } from './permanent/session';
import {
	failure,
	fakeFiles,
	fakePermanent,
	fakePermanentFetch,
	fakeSecureStore,
	loginSuccess,
	resetFakePermanent,
	verifySuccess,
} from './permanent/testing';
import { fakeLibrary, photoTakenAt, resetFakeLibrary } from './photos/testing';
import { theme } from './theme';
import type { PaletteName } from './components/Palette';
import type { AppStateStatus } from 'react-native';

// End-to-end paths through the app. The pieces have their own tests: the API
// client in permanent/, the flow's rules in features/sign-in/, and the
// components in components/.

const fetchMock = jest.fn<typeof fetch>();

beforeEach(() => {
	resetFakeLibrary();
	resetFakePermanent();
	fetchMock.mockReset();
	fetchMock.mockImplementation(fakePermanentFetch);
	jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
});

afterEach(() => {
	jest.restoreAllMocks();
});

const enterCredentials = async (): Promise<
	ReturnType<typeof userEvent.setup>
> => {
	const user = userEvent.setup();
	await render(<App />);
	await user.type(screen.getByLabelText('Email'), 'ada@example.com');
	await user.type(screen.getByLabelText('Password'), 'correct horse');
	return user;
};

const logIn = async (): Promise<ReturnType<typeof userEvent.setup>> => {
	const user = await enterCredentials();
	await user.press(screen.getByRole('button', { name: 'Log in' }));
	return user;
};

const enterCode = async (
	user: ReturnType<typeof userEvent.setup>,
	code: string,
): Promise<void> => {
	const field = await screen.findByLabelText('Verification code');
	await user.clear(field);
	await user.type(field, code);
	await user.press(screen.getByRole('button', { name: 'Verify' }));
};

const today = (hours: number, minutes: number): Date => {
	const time = new Date();
	time.setHours(hours, minutes, 0, 0);
	return time;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const rememberTodayAndTomorrow = (): void => {
	const now = Date.now();
	fakePermanent.memories = [
		`${dayOf(now)}.jpg`,
		`${dayOf(now + ONE_DAY_MS)}.jpg`,
	];
};

const findRemember = async (): Promise<unknown> =>
	await screen.findByRole('button', { name: 'Remember' });

const findReminisce = async (): Promise<unknown> =>
	await screen.findByRole('button', { name: 'Reminisce' });

const remember = async (): Promise<ReturnType<typeof userEvent.setup>> => {
	fetchMock.mockResolvedValueOnce(loginSuccess());
	const user = await logIn();
	await user.press(await screen.findByRole('button', { name: 'Remember' }));
	return user;
};

const expectPaletteAfterFade = async (name: PaletteName): Promise<void> => {
	await act(async () => {
		await new Promise((resolve) => {
			setTimeout(resolve, theme.durations.paletteChange);
		});
	});
	const [red, green, blue] = [1, 3, 5].map((start) =>
		Number.parseInt(
			theme.palettes[name].background.slice(start, start + 2),
			16,
		),
	);
	expect(screen.getByTestId('screen')).toHaveStyle({
		backgroundColor: `rgba(${red}, ${green}, ${blue}, 1)`,
	});
};

describe('App', () => {
	it('logs in', async () => {
		fetchMock.mockResolvedValueOnce(loginSuccess());
		await logIn();

		expect(await findRemember()).toBeOnTheScreen();
	});

	it('remembers the login between launches', async () => {
		fetchMock.mockResolvedValueOnce(loginSuccess());
		await logIn();
		expect(await findRemember()).toBeOnTheScreen();

		await screen.unmount();
		fetchMock.mockClear();
		await render(<App />);

		expect(await findRemember()).toBeOnTheScreen();
		expect(
			fetchMock.mock.calls.filter(
				([url]) => url === `${permanentApiUrl}/auth/login`,
			),
		).toHaveLength(0);
	});

	it('asks to log in again when the remembered login has expired', async () => {
		await saveSession({
			token: 'expired-token',
			account: { email: 'ada@example.com', name: 'Ada' },
		});
		fakePermanent.tokenExpired = true;
		await render(<App />);

		expect(await screen.findByText('Log in to Permanent')).toBeOnTheScreen();
		expect(fakeSecureStore.items.size).toBe(0);
	});

	it('asks to log in again when the login expires mid-memory', async () => {
		fakeLibrary.photos = [photoTakenAt(today(9, 15))];
		const user = await remember();
		await user.press(
			await screen.findByRole('button', { name: /Photo taken at 9:15/v }),
		);

		fakePermanent.tokenExpired = true;
		await user.press(screen.getByRole('button', { name: 'Capture Memory' }));

		expect(await screen.findByText('Log in to Permanent')).toBeOnTheScreen();
		expect(fakeSecureStore.items.size).toBe(0);
		expect(fakeFiles.uploads).toHaveLength(0);
	});

	it('creates the Memorybox folder on first use', async () => {
		fakePermanent.memorybox = 'missing';
		fetchMock.mockResolvedValueOnce(loginSuccess());
		await logIn();

		expect(await findRemember()).toBeOnTheScreen();
		expect(fakePermanent.memorybox).toBe('claimed');
	});

	it('will not use a Memorybox folder it did not create', async () => {
		fakePermanent.memorybox = 'unclaimed';
		fetchMock.mockResolvedValueOnce(loginSuccess());
		const user = await logIn();

		expect(await screen.findByText('Setup failed')).toBeOnTheScreen();

		fakePermanent.memorybox = 'claimed';
		await user.press(screen.getByRole('button', { name: 'Try again' }));
		expect(await findRemember()).toBeOnTheScreen();
	});

	it('finishes an interrupted setup when tried again', async () => {
		fakePermanent.memorybox = 'missing';
		fakePermanent.failingPath = '/record/registerRecord';
		fetchMock.mockResolvedValueOnce(loginSuccess());
		const user = await logIn();

		expect(await screen.findByText('Setup failed')).toBeOnTheScreen();

		fakePermanent.failingPath = undefined;
		await user.press(screen.getByRole('button', { name: 'Try again' }));
		expect(await findRemember()).toBeOnTheScreen();
	});

	it('shows what went wrong when setup fails', async () => {
		fakePermanent.failingPath = '/accounts/me';
		fetchMock.mockResolvedValueOnce(loginSuccess());
		await logIn();

		expect(await screen.findByText('Details: HTTP 500')).toBeOnTheScreen();
	});

	it('goes back without checking again when photos cannot be found', async () => {
		fakeLibrary.failure = new Error('Library unavailable');
		const user = await remember();
		expect(
			await screen.findByText('Details: Library unavailable'),
		).toBeOnTheScreen();

		fakePermanent.memoryboxListingsBeforeFailure = 0;
		await user.press(screen.getByRole('button', { name: 'Back' }));

		expect(await findRemember()).toBeOnTheScreen();
	});

	it('checks again after a failed save, in case it reached Permanent', async () => {
		fakeLibrary.photos = [photoTakenAt(today(9, 15))];
		fakeFiles.uploadStatus = 500;
		const user = await remember();
		await user.press(
			await screen.findByRole('button', { name: /Photo taken at 9:15/v }),
		);
		await user.press(screen.getByRole('button', { name: 'Capture Memory' }));
		expect(await screen.findByText('Details: HTTP 500')).toBeOnTheScreen();

		rememberTodayAndTomorrow();
		await user.press(screen.getByRole('button', { name: 'Back' }));

		expect(await findReminisce()).toBeOnTheScreen();
		await expectPaletteAfterFade('gray');
	});

	it('only offers to reminisce when today is already remembered', async () => {
		rememberTodayAndTomorrow();
		fetchMock.mockResolvedValueOnce(loginSuccess());
		await logIn();

		expect(await findReminisce()).toBeOnTheScreen();
		expect(
			screen.queryByRole('button', { name: 'Remember' }),
		).not.toBeOnTheScreen();
		await expectPaletteAfterFade('gray');
	});

	it('reminisces, and comes back to the remembered day', async () => {
		rememberTodayAndTomorrow();
		fakePermanent.memories.push(`${dayOf(Date.now() - ONE_DAY_MS)}.jpg`);
		fetchMock.mockResolvedValueOnce(loginSuccess());
		const user = await logIn();
		expect(await findReminisce()).toBeOnTheScreen();
		await expectPaletteAfterFade('gray');

		await user.press(screen.getByRole('button', { name: 'Reminisce' }));
		expect(await screen.findByLabelText(/^Memory from /v)).toBeOnTheScreen();

		await user.press(screen.getByRole('button', { name: 'Back' }));
		expect(await findReminisce()).toBeOnTheScreen();
	});

	it('reminisces right after remembering', async () => {
		fakeLibrary.photos = [photoTakenAt(today(9, 15))];
		const user = await remember();
		await user.press(
			await screen.findByRole('button', { name: /Photo taken at 9:15/v }),
		);
		await user.press(screen.getByRole('button', { name: 'Capture Memory' }));
		expect(await screen.findByText('Done.')).toBeOnTheScreen();
		await expectPaletteAfterFade('gray');

		await user.press(screen.getByRole('button', { name: 'Reminisce' }));

		expect(
			await screen.findByText('There are no earlier memories yet.'),
		).toBeOnTheScreen();
	});

	it('checks again when it comes back to the foreground', async () => {
		const listeners: Array<(state: AppStateStatus) => void> = [];
		jest
			.spyOn(AppState, 'addEventListener')
			.mockImplementation((_, listener) => {
				listeners.push(listener);
				return { remove: (): void => undefined };
			});
		rememberTodayAndTomorrow();
		fetchMock.mockResolvedValueOnce(loginSuccess());
		await logIn();
		expect(await findReminisce()).toBeOnTheScreen();
		await expectPaletteAfterFade('gray');

		fakePermanent.memories = [];
		await act(async () => {
			for (const listener of listeners) {
				listener('active');
			}
			await Promise.resolve();
		});

		expect(await findRemember()).toBeOnTheScreen();
		await expectPaletteAfterFade('yellow');
	});

	it('explains a failed check and checks again on Back', async () => {
		fakePermanent.memoryboxListingsBeforeFailure = 1;
		fetchMock.mockResolvedValueOnce(loginSuccess());
		const user = await logIn();

		expect(await screen.findByText('Details: HTTP 500')).toBeOnTheScreen();

		fakePermanent.memoryboxListingsBeforeFailure = Infinity;
		await user.press(screen.getByRole('button', { name: 'Back' }));

		expect(await findRemember()).toBeOnTheScreen();
	});

	it('offers to remember today when only earlier days are', async () => {
		fakePermanent.memories = ['2020-01-01.jpg'];
		fetchMock.mockResolvedValueOnce(loginSuccess());
		await logIn();

		expect(await findRemember()).toBeOnTheScreen();
	});

	it('explains rejected credentials and offers another try', async () => {
		fetchMock.mockResolvedValueOnce(failure('warning.signin.unknown'));
		const user = await logIn();

		expect(
			await screen.findByText(
				'That email and password did not match an account.',
			),
		).toBeOnTheScreen();

		await user.press(screen.getByRole('button', { name: 'Try again' }));
		expect(screen.getByText('Log in to Permanent')).toBeOnTheScreen();
	});

	it('shows what went wrong when the failure is unexpected', async () => {
		fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
		await logIn();

		expect(
			await screen.findByText('Something went wrong while logging in.'),
		).toBeOnTheScreen();
		expect(
			screen.getByText('Details: Network request failed'),
		).toBeOnTheScreen();
	});

	it('logs in once however often Return is pressed', async () => {
		let answer = (_: Response): void => undefined;
		fetchMock.mockReturnValueOnce(
			new Promise((settle) => {
				answer = settle;
			}),
		);
		await enterCredentials();
		const password = screen.getByLabelText('Password');
		await fireEvent(password, 'submitEditing');
		await fireEvent(password, 'submitEditing');
		answer(loginSuccess());

		expect(await findRemember()).toBeOnTheScreen();
		expect(
			fetchMock.mock.calls.filter(
				([url]) => url === `${permanentApiUrl}/auth/login`,
			),
		).toHaveLength(1);
	});

	it('does not submit empty credentials from the keyboard', async () => {
		const user = userEvent.setup();
		await render(<App />);
		await user.type(screen.getByLabelText('Password'), 'x', {
			submitEditing: true,
		});

		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('lets a wrong code be corrected in place', async () => {
		fetchMock
			.mockResolvedValueOnce(failure('warning.auth.mfaToken'))
			.mockResolvedValueOnce(failure('warning.auth.token_does_not_match'))
			.mockResolvedValueOnce(verifySuccess());
		const user = await logIn();

		await enterCode(user, '0000');
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'That code was not correct. Check it and try again.',
		);

		await enterCode(user, '1234');
		expect(await findRemember()).toBeOnTheScreen();
	});

	it('ignores a verification that finishes after starting over', async () => {
		let answer = (_: Response): void => undefined;
		fetchMock
			.mockResolvedValueOnce(failure('warning.auth.mfaToken'))
			.mockReturnValueOnce(
				new Promise((settle) => {
					answer = settle;
				}),
			);
		const user = await logIn();

		await enterCode(user, '1234');
		await user.press(screen.getByRole('button', { name: 'Start over' }));
		// Deliver the late answer, and let the app finish handling it.
		await act(async () => {
			answer(verifySuccess());
			await new Promise((settle) => {
				setTimeout(settle, 0);
			});
		});

		expect(screen.getByText('Log in to Permanent')).toBeOnTheScreen();
		expect(
			screen.queryByRole('button', { name: 'Remember' }),
		).not.toBeOnTheScreen();
	});

	it('ignores a verification that finishes saving after starting over', async () => {
		let finishWrites = (): void => undefined;
		fakeSecureStore.writesFinish = new Promise((settle) => {
			finishWrites = settle;
		});
		fetchMock
			.mockResolvedValueOnce(failure('warning.auth.mfaToken'))
			.mockResolvedValueOnce(verifySuccess());
		const user = await logIn();

		await enterCode(user, '1234');
		await user.press(screen.getByRole('button', { name: 'Start over' }));
		await act(async () => {
			finishWrites();
			await new Promise((settle) => {
				setTimeout(settle, 0);
			});
		});

		expect(screen.getByText('Log in to Permanent')).toBeOnTheScreen();
		expect(
			screen.queryByRole('button', { name: 'Remember' }),
		).not.toBeOnTheScreen();
		expect(fakeSecureStore.items.size).toBe(0);
	});

	it('remembers a photo taken today', async () => {
		fakeLibrary.photos = [
			photoTakenAt(today(9, 15)),
			photoTakenAt(today(8, 5)),
		];
		const user = await remember();

		await user.press(
			await screen.findByRole('button', { name: /Photo taken at 9:15/v }),
		);
		await user.press(screen.getByRole('button', { name: 'Capture Memory' }));

		expect(await screen.findByText('Done.')).toBeOnTheScreen();
		expect(fakeFiles.uploads).toMatchObject([
			{ uri: `file:///${photoTakenAt(today(9, 15)).id}.jpg` },
		]);
		await expectPaletteAfterFade('gray');
	});

	it('explains a memory that could not be saved', async () => {
		fakeLibrary.photos = [photoTakenAt(today(9, 15))];
		fakeFiles.uploadStatus = 500;
		const user = await remember();

		await user.press(
			await screen.findByRole('button', { name: /Photo taken at 9:15/v }),
		);
		await user.press(screen.getByRole('button', { name: 'Capture Memory' }));

		expect(await screen.findByText('Details: HTTP 500')).toBeOnTheScreen();
	});

	it('captures nothing until a photo is chosen', async () => {
		fakeLibrary.photos = [photoTakenAt(today(9, 15))];
		await remember();

		expect(
			await screen.findByRole('button', { name: 'Capture Memory' }),
		).toBeDisabled();
	});

	it('says when no photos were taken today', async () => {
		await remember();

		expect(await screen.findByText('No photos yet today')).toBeOnTheScreen();
	});

	it('explains when it may not see the photos', async () => {
		fakeLibrary.accessGranted = false;
		const user = await remember();

		expect(
			await screen.findByText('memorybox cannot see your photos'),
		).toBeOnTheScreen();
		await user.press(screen.getByRole('button', { name: 'Back' }));
		expect(await findRemember()).toBeOnTheScreen();
	});
});
