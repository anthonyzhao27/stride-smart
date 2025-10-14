export function getWeekStartDate(startDate: Date, week: number): Date {
    const start = new Date(startDate);
    const dayOfWeek = start.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Move to the *first* Monday on or after the startDate
    const daysToNextMonday = (8 - dayOfWeek) % 7 || 7;
    const firstMonday = new Date(start);
    firstMonday.setDate(start.getDate() + daysToNextMonday);

    // If week is 1, return the original startDate's Monday if it's already Monday
    if (week === 1) {
        return dayOfWeek === 1 ? start : firstMonday;
    }

    // Add (week - 1) * 7 days to the first Monday
    const targetMonday = new Date(firstMonday);
    targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);
    return targetMonday;
}

export function getDayToDate(startDate: Date, week: number): Map<string, Date> {
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const mondayDate = getWeekStartDate(startDate, week);

    const map = new Map<string, Date>();

    weekdays.forEach((weekday, index) => {
        const date = new Date(mondayDate);
        date.setDate(mondayDate.getDate() + index);
        map.set(weekday, date);
    });

    return map;
}