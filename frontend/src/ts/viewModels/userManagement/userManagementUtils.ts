export function getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ')
        .map(w => w[0]?.toUpperCase())
        .join('')
        .substring(0, 2);
}

export function getRelativeTime(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const intervals: { [key: string]: number } = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1
    };
    for (const [unit, val] of Object.entries(intervals)) {
        const count = Math.floor(seconds / val);
        if (count > 0) return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
    }
    return 'just now';
} 