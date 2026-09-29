import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
	it('calls onPress', async () => {
		const onPress = jest.fn<() => void>();
		await render(<Button label="Save" onPress={onPress} />);
		await userEvent.press(screen.getByRole('button', { name: 'Save' }));

		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it.each([
		['disabled', { disabled: true }],
		['busy', { busy: true }],
	])('ignores presses while %s', async (_, props) => {
		const onPress = jest.fn<() => void>();
		await render(<Button label="Save" onPress={onPress} {...props} />);
		await userEvent.press(screen.getByRole('button', { name: 'Save' }));

		expect(onPress).not.toHaveBeenCalled();
		expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
	});
});
