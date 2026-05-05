import {
  differenceInCalendarDays,
  format,
  isSameDay,
  isSameMonth,
  isSameYear,
  isValid,
  parseISO,
} from 'date-fns';

type DateInput = Date | string | null | undefined;

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : parseISO(input);
  return isValid(d) ? d : null;
}

export function daysUntil(date: DateInput): number | null {
  const d = toDate(date);
  if (!d) return null;
  return differenceInCalendarDays(d, new Date());
}

export type DeadlineSeverity = 'danger' | 'warning' | 'info' | 'neutral';

export type DeadlineBadge = {
  text: string;
  severity: DeadlineSeverity;
};

export function getDeadlineBadge(deadline: DateInput): DeadlineBadge | null {
  const days = daysUntil(deadline);
  if (days === null || days < 0) return null;

  let text: string;
  if (days === 0) text = 'Closes today';
  else if (days === 1) text = '1 day left';
  else text = `${days} days left`;

  let severity: DeadlineSeverity;
  if (days < 3) severity = 'danger';
  else if (days < 7) severity = 'warning';
  else severity = 'info';

  return { text, severity };
}

export function formatEventDate(start: DateInput, end?: DateInput): string {
  const startDate = toDate(start);
  if (!startDate) return '';
  const endDate = toDate(end);

  const days = differenceInCalendarDays(startDate, new Date());

  if (!endDate || isSameDay(startDate, endDate)) {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return format(startDate, 'MMM d');
  }

  if (isSameMonth(startDate, endDate)) {
    return `${format(startDate, 'MMM d')}-${format(endDate, 'd')}`;
  }

  if (isSameYear(startDate, endDate)) {
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
  }

  return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
}
