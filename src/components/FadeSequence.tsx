import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import type { ReactElement } from 'react';

const FADE_MS = 600;

interface FadeSequenceProps {
	steps: ReactElement[];
	holdMs?: number;
}

export const FadeSequence = ({
	steps,
	holdMs = 2000,
}: FadeSequenceProps): ReactElement => {
	const [index, setIndex] = useState(0);
	const [opacity] = useState(() => new Animated.Value(1));
	const isLast = index >= steps.length - 1;

	useEffect(() => {
		const fadeTo = (toValue: number): Animated.CompositeAnimation =>
			Animated.timing(opacity, {
				toValue,
				duration: FADE_MS,
				useNativeDriver: true,
			});
		const isFirst = index === 0;
		const appear = isFirst ? [] : [fadeTo(1)];
		const disappear = isLast ? [] : [Animated.delay(holdMs), fadeTo(0)];
		const animation = Animated.sequence([...appear, ...disappear]);
		animation.start(({ finished }): void => {
			if (finished && !isLast) {
				setIndex(index + 1);
			}
		});
		return (): void => {
			animation.stop();
		};
	}, [holdMs, index, isLast, opacity]);

	return (
		<Animated.View
			accessibilityLiveRegion="polite"
			style={{ opacity }}
			testID="fade-sequence"
		>
			{steps[index]}
		</Animated.View>
	);
};
