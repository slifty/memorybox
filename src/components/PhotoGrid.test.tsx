import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import { PhotoGrid } from './PhotoGrid';

const photos = [
	{ id: 'a', uri: 'file:///a.jpg', accessibilityLabel: 'Morning' },
	{ id: 'b', uri: 'file:///b.jpg', accessibilityLabel: 'Evening' },
];

describe('PhotoGrid', () => {
	it('reports the photo pressed', async () => {
		const onSelect = jest.fn<(id: string) => void>();
		await render(
			<PhotoGrid onSelect={onSelect} photos={photos} selectedId={undefined} />,
		);
		await userEvent.press(screen.getByRole('button', { name: 'Evening' }));

		expect(onSelect).toHaveBeenCalledWith('b');
	});

	it('marks the selected photo', async () => {
		await render(
			<PhotoGrid
				onSelect={jest.fn<(id: string) => void>()}
				photos={photos}
				selectedId="a"
			/>,
		);

		expect(screen.getByRole('button', { name: 'Morning' })).toBeSelected();
		expect(screen.getByRole('button', { name: 'Evening' })).not.toBeSelected();
	});
});
