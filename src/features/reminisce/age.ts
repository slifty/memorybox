const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const midnightOf = (day: string): number => {
	const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
	return new Date(year, month - 1, date).getTime();
};

export const daysBetween = (earlierDay: string, laterDay: string): number =>
	Math.round((midnightOf(laterDay) - midnightOf(earlierDay)) / ONE_DAY_MS);

export const describeAge = (day: string, today: string): string => {
	const days = daysBetween(day, today);
	return days === 1 ? 'Yesterday' : `${String(days)} days ago`;
};
