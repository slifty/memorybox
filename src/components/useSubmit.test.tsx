import { describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useSubmit } from './useSubmit';

const deferred = (): { promise: Promise<void>; resolve: () => void } => {
	let resolve = (): void => undefined;
	const promise = new Promise<void>((settle) => {
		resolve = settle;
	});
	return { promise, resolve };
};

describe('useSubmit', () => {
	it('does nothing while it cannot submit', async () => {
		const action = jest.fn<() => Promise<void>>();
		const { result } = await renderHook(() => useSubmit(action, false));
		await act(() => {
			result.current.submit();
		});

		expect(action).not.toHaveBeenCalled();
	});

	it('ignores a second submit until the first finishes', async () => {
		const pending = deferred();
		const action = jest.fn(async () => {
			await pending.promise;
		});
		const { result } = await renderHook(() => useSubmit(action, true));

		await act(() => {
			result.current.submit();
			result.current.submit();
		});
		expect(action).toHaveBeenCalledTimes(1);
		expect(result.current.busy).toBe(true);

		await act(async () => {
			pending.resolve();
			await pending.promise;
		});
		expect(result.current.busy).toBe(false);

		await act(() => {
			result.current.submit();
		});
		expect(action).toHaveBeenCalledTimes(2);
	});
});
