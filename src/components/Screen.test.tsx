import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Screen } from './Screen';

describe('Screen', () => {
	it('keeps its content inside the safe area', async () => {
		await render(
			<SafeAreaProvider
				initialMetrics={{
					frame: { x: 0, y: 0, width: 390, height: 844 },
					insets: { top: 47, right: 0, bottom: 34, left: 0 },
				}}
			>
				<Screen />
			</SafeAreaProvider>,
		);

		expect(screen.getByTestId('screen')).toHaveStyle({
			paddingTop: theme.spacing.lg + 47,
			paddingRight: theme.spacing.lg,
			paddingBottom: theme.spacing.lg + 34,
			paddingLeft: theme.spacing.lg,
		});
	});
});
