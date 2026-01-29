type Options = {
  locale?: string
  includeTime?: boolean
  today?: Date
  separator?: string
}

function formatDateRange(
  from: Date | string | number,
  to: Date | string | number,
  options: Options = {},
): string {
  const { locale = 'en-US', includeTime = true, today = new Date(), separator = ' - ' } = options

  const fromDate = new Date(from)
  const toDate = new Date(to)

  const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })

  const shortFormatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  })

  const yearFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric' })
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long' })
  function formatTime(date: Date): string {
    return formatter
      .formatToParts(date)
      .filter((part) => ['hour', 'minute', 'dayPeriod'].includes(part.type))
      .map((part) => part.value)
      .join('')
  }

  function isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  }

  function isSameMonth(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
  }

  function isSameYear(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear()
  }

  // Special cases
  if (
    isSameYear(fromDate, toDate) &&
    fromDate.getMonth() === 0 &&
    fromDate.getDate() === 1 &&
    toDate.getMonth() === 11 &&
    toDate.getDate() === 31
  ) {
    return yearFormatter.format(fromDate)
  }

  if (
    isSameYear(fromDate, toDate) &&
    fromDate.getDate() === 1 &&
    toDate.getDate() === new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0).getDate()
  ) {
    if (isSameMonth(fromDate, toDate)) {
      return `${monthFormatter.format(fromDate)} ${yearFormatter.format(fromDate)}`
    } else {
      return `${shortFormatter.format(fromDate)}${separator}${shortFormatter.format(toDate)}`
    }
  }

  let fromStr = formatter.format(fromDate)
  let toStr = formatter.format(toDate)

  // Remove year if same as today's year
  if (fromDate.getFullYear() === today.getFullYear()) {
    fromStr = fromStr.replace(/, \d{4}/, '')
    toStr = toStr.replace(/, \d{4}/, '')
  }

  // Handle same day
  if (isSameDay(fromDate, toDate)) {
    if (includeTime) {
      return `${fromStr.split(',')[0]}, ${formatTime(fromDate)}${separator}${formatTime(toDate)}`
    } else {
      return fromStr.split(',')[0]
    }
  }

  // Handle same month
  if (isSameMonth(fromDate, toDate)) {
    const fromDay = fromDate.getDate()
    const toDay = toDate.getDate()
    return `${shortFormatter.format(fromDate).split(' ')[0]} ${fromDay}${separator}${toDay}`
  }

  // Handle different months or years
  if (!isSameYear(fromDate, toDate)) {
    return `${fromStr}${separator}${toStr}`
  } else {
    return `${shortFormatter.format(fromDate)}${separator}${shortFormatter.format(toDate)}`
  }
}

export default formatDateRange
