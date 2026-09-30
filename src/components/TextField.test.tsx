import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { TextField } from './TextField';

describe('TextField', () => {
	it('labels its input', async () => {
		await render(<TextField label="Email" value="" />);

		expect(screen.getByLabelText('Email')).toBeOnTheScreen();
	});

	it('announces an error', async () => {
		await render(<TextField error="Required" label="Email" value="" />);

		expect(screen.getByRole('alert')).toHaveTextContent('Required');
	});

	it('shows no error by default', async () => {
		await render(<TextField label="Email" value="" />);

		expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
	});
});
