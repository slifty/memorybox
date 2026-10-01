import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { CaptionedPhoto } from './CaptionedPhoto';

describe('CaptionedPhoto', () => {
	it('shows the photo above its caption', async () => {
		await render(
			<CaptionedPhoto
				accessibilityLabel="Beach"
				caption="Long ago"
				missingPhotoText="Not ready"
				uri="https://cdn.example.com/a"
			/>,
		);

		expect(screen.getByLabelText('Beach')).toHaveProp('source', {
			uri: 'https://cdn.example.com/a',
		});
		expect(screen.getByText('Long ago')).toBeOnTheScreen();
	});

	it('stands in for a photo it does not have', async () => {
		await render(
			<CaptionedPhoto
				accessibilityLabel="Beach"
				caption="Long ago"
				missingPhotoText="Not ready"
				uri={undefined}
			/>,
		);

		expect(screen.getByLabelText('Beach. Not ready')).toHaveTextContent(
			'Not ready',
		);
	});
});
