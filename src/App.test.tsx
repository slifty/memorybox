import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { App } from './App';

describe('App', () => {
	it('renders a greeting', async () => {
		await render(<App />);
		expect(screen.getByText('Hello, world')).toBeOnTheScreen();
	});
});
