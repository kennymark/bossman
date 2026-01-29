import { DateTime, Interval } from 'luxon'

type InitialPeriod =
  | 'this week'
  | 'this month'
  | 'next week'
  | 'next month'
  | 'last month'
  | 'this year'

const now = DateTime.local().setLocale('en-GB')
const startOfMonth = now.startOf('month')
const endOfMonth = now.endOf('month')

function formatDate(date: DateTime | string | Date, isLong = false): string {
  const formatIsLong = isLong ? DateTime.DATETIME_MED_WITH_WEEKDAY : DateTime.DATE_MED_WITH_WEEKDAY
  if (typeof date === 'string') return DateTime.fromISO(date).toLocaleString(formatIsLong)
  if (date instanceof Date) return DateTime.fromJSDate(date).toLocaleString(formatIsLong)

  return date.toLocaleString(formatIsLong)
}

export function timeRemaining(start_date: string | Date, end_date: string | Date): string {
  if (!start_date || !end_date) return 'Not set'

  const startDateTime = DateTime.fromJSDate(new Date(start_date)).startOf('day')
  const endDateTime = DateTime.fromJSDate(new Date(end_date)).endOf('day')

  const interval = Interval.fromDateTimes(startDateTime, endDateTime)
  const duration = interval.toDuration(['years', 'months', 'days'])

  return duration.toHuman({ unitDisplay: 'long' })
}

export function timeAgo(date: DateTime | string | Date): string {
  if (typeof date === 'string') return DateTime.fromISO(date).toRelative() ?? ''
  if (date instanceof Date) return DateTime.fromJSDate(date).toRelative() ?? ''
  return date.toRelative() ?? ''
}

export function hasDateExpired(date: DateTime): boolean {
  if (now.toMillis() > date.toMillis()) return true
  return false
}

function getDaysDueText(daysDue: number): string {
  if (daysDue === 0) return 'today'
  if (daysDue === 1) return 'tomorrow'
  if (daysDue === 7) return 'in a week'
  return `in ${daysDue} days`
}

function getInitialDateFromPeriod(initial: InitialPeriod): Interval {
  switch (initial) {
    case 'this week':
      return Interval.fromDateTimes(now.startOf('week'), now.endOf('week'))
    case 'this month':
      return Interval.fromDateTimes(now.startOf('month'), now.endOf('month'))
    case 'next week':
      return Interval.fromDateTimes(
        now.plus({ weeks: 1 }).startOf('week'),
        now.plus({ weeks: 1 }).endOf('week'),
      )
    case 'next month':
      return Interval.fromDateTimes(
        now.plus({ months: 1 }).startOf('month'),
        now.plus({ months: 1 }).endOf('month'),
      )
    case 'last month':
      return Interval.fromDateTimes(
        now.minus({ months: 1 }).startOf('month'),
        now.minus({ months: 1 }).endOf('month'),
      )
    case 'this year':
      return Interval.fromDateTimes(now.startOf('year'), now.endOf('year'))
    default:
      throw new Error('Invalid initial period provided')
  }
}

const DateService = {
  timeRemaining,
  now,
  hasDateExpired,
  getDaysDueText,
  startOfMonth,
  endOfMonth,
  getInitialDateFromPeriod,
  formatDate,
  timeAgo,
}

export default DateService
