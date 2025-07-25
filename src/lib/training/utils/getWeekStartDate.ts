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