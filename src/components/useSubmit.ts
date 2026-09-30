import { useRef, useState } from 'react';

interface Submission {
	submit: () => void;
	busy: boolean;
}

// Runs a form's action from its button and from the keyboard's Return key
// alike, so both honor the same rules: nothing runs while `canSubmit` is
// false, and a second submit is ignored until the first finishes.
//
// `action` is expected to report failure through state rather than by
// rejecting. A rejection is a bug, and is left to surface as one.
export const useSubmit = (
	action: () => Promise<void>,
	canSubmit: boolean,
): Submission => {
	// A ref rather than state, because two presses can land before a re-render.
	const runningRef = useRef(false);
	const [busy, setBusy] = useState(false);

	const run = async (): Promise<void> => {
		runningRef.current = true;
		setBusy(true);
		try {
			await action();
		} finally {
			runningRef.current = false;
			setBusy(false);
		}
	};

	const submit = (): void => {
		if (canSubmit && !runningRef.current) {
			void run();
		}
	};

	return { submit, busy };
};
