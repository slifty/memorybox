import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FadeSequence } from './FadeSequence';

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

describe('FadeSequence', () => {
	it('shows the first step at once, without fading it in', async () => {
		await render(
			<FadeSequence
				steps={[<Text key="first">First</Text>, <Text key="last">Last</Text>]}
			/>,
		);

		expect(screen.getByTestId('fade-sequence')).toHaveStyle({ opacity: 1 });
	});

	it('shows each step in turn and stays on the last', async () => {
		await render(
			<FadeSequence
				holdMs={1000}
				steps={[<Text key="first">First</Text>, <Text key="last">Last</Text>]}
			/>,
		);
		expect(screen.getByText('First')).toBeOnTheScreen();

		await act(async () => {
			await jest.advanceTimersByTimeAsync(10_000);
		});
		expect(screen.queryByText('First')).not.toBeOnTheScreen();
		expect(screen.getByText('Last')).toBeOnTheScreen();
	});
});
