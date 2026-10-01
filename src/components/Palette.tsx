import { createContext, use, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { theme } from '../theme';
import type { ReactElement, ReactNode } from 'react';

export type PaletteName = keyof typeof theme.palettes;

type PaletteRole = keyof (typeof theme.palettes)[PaletteName];

export type PaletteColors = Record<
	PaletteRole,
	Animated.AnimatedInterpolation<string> | string
>;

interface Palette {
	colors: PaletteColors;
	show: (name: PaletteName) => void;
}

export const DEFAULT_PALETTE: PaletteName = 'yellow';

const PALETTE_ORDER: PaletteName[] = ['yellow', 'gray'];

const PaletteContext = createContext<Palette>({
	colors: theme.palettes[DEFAULT_PALETTE],
	show: () => undefined,
});

const blend = (
	progress: Animated.Value,
	role: PaletteRole,
): Animated.AnimatedInterpolation<string> =>
	progress.interpolate({
		inputRange: PALETTE_ORDER.map((_, index) => index),
		outputRange: PALETTE_ORDER.map((name) => theme.palettes[name][role]),
	});

interface PaletteProviderProps {
	children: ReactNode;
}

export const PaletteProvider = ({
	children,
}: PaletteProviderProps): ReactElement => {
	const [progress] = useState(
		() => new Animated.Value(PALETTE_ORDER.indexOf(DEFAULT_PALETTE)),
	);
	const shownRef = useRef<PaletteName>(DEFAULT_PALETTE);
	const palette = useMemo<Palette>(
		() => ({
			colors: {
				background: blend(progress, 'background'),
				text: blend(progress, 'text'),
				mutedText: blend(progress, 'mutedText'),
				accent: blend(progress, 'accent'),
			},
			show: (name): void => {
				if (name === shownRef.current) {
					return;
				}
				shownRef.current = name;
				Animated.timing(progress, {
					toValue: PALETTE_ORDER.indexOf(name),
					duration: theme.durations.paletteChange,
					useNativeDriver: false,
				}).start();
			},
		}),
		[progress],
	);

	return <PaletteContext value={palette}>{children}</PaletteContext>;
};

export const usePalette = (): Palette => use(PaletteContext);
