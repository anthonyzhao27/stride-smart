export function getStartofCalendarMonth(date: Date): Date {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const day = first.getDay();
    const diff = (day + 6) % 7;
    first.setDate(first.getDate() - diff);
    return first;
}

export function getDaysForCalendar(start: Date): Date[] {
    return Array.from({ length: 42 }, (_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        return date;
    });
}