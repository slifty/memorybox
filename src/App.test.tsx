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
import { App } from './App';
import { failure, loginSuccess, verifySuccess } from './permanent/testing';
import { fakeLibrary, photoTakenAt, resetFakeLibrary } from './photos/testing';

// End-to-end paths through the app. The pieces have their own tests: the API
// client in permanent/, the flow's rules in features/sign-in/, and the
// components in components/.

const fetchMock = jest.fn<typeof fetch>();

beforeEach(() => {
	resetFakeLibrary();
	fetchMock.mockReset();
	fetchMock.mockRejectedValue(new Error('Unstubbed request'));
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

const findRemember = async (): Promise<unknown> =>
	await screen.findByRole('button', { name: 'Remember' });

const remember = async (): Promise<ReturnType<typeof userEvent.setup>> => {
	fetchMock.mockResolvedValueOnce(loginSuccess());
	const user = await logIn();
	await user.press(await screen.findByRole('button', { name: 'Remember' }));
	return user;
};

describe('App', () => {
	it('logs in', async () => {
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
		expect(fetchMock).toHaveBeenCalledTimes(1);
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
