import { endOfDay, formatDuration, intervalToDuration, startOfDay } from 'date-fns'

export default class LeaseUtils {
  public static makeLeaseName(tenant: string, address: string) {
    return `Agreement for ${tenant} at ${address}`
  }

  public static getTenantNameFromLeaseName(leaseName: string) {
    const regex = /Agreement for (.*) at/
    const match = leaseName.match(regex)
    return match ? match[1] : ''
  }

  public static getAddressFromLeaseName(leaseName: string) {
    const regex = /at (.*)/
    const match = leaseName.match(regex)
    return match ? match[1] : ''
  }

  public static getTenantOrAddressFromLeaseName(leaseName: string) {
    const tenantMatch = leaseName?.match(/Agreement for (.+?) at/)
    const propertyMatch = leaseName?.match(/at (.+)$/)

    const tenantName = tenantMatch ? tenantMatch[1] : null
    const propertyAddress = propertyMatch ? propertyMatch[1] : null

    return {
      tenantName,
      propertyAddress,
    }
  }

  public static timeRemaining(start_date: string | Date, end_date: string | Date): string {
    if (!end_date) return 'Permanently Rolling'
    if (!start_date || !end_date) return 'Not set'

    const interval = intervalToDuration({
      start: startOfDay(new Date(start_date)),
      end: endOfDay(new Date(end_date)),
    })
    return formatDuration(interval, { format: ['years', 'months', 'days'] })
  }
}
