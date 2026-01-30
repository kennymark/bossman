import Org from '#models/org'

export const countryCurrencies = {
  'United Kingdom': 'GBP',
  'United States': 'USD',
  Ghana: 'GHS',
  Nigeria: 'NGN',
  Sweden: 'SEK',
  Denmark: 'DKK',
  Norway: 'NOK',
  Poland: 'PLN',
  'South Africa': 'ZAR',
  Zambia: 'ZMW',
  Tanzania: 'TZS',
  Kenya: 'KES',
} as const

class OrgService {
  public async updateOrgs() {}

  public async getOrg({ email, id, env }: { email: string; id?: string; env: string }) {
    const org = await Org.query({ connection: env })
      .where('creator_email', email)
      .preload('owner', (q) =>
        q.select([
          'id',
          'name',
          'email',
          'contactNumber',
          'addressLineOne',
          'addressLineTwo',
          'city',
          'postCode',
          'country',
          'sortCode',
          'accountNumber',
        ]),
      )
      .first()

    return org
  }

  static getDefaultSettings(country: string) {
    return {
      preferredCurrency: countryCurrencies[country as keyof typeof countryCurrencies] || 'EUR',
      preferredTimezone: 'Europe/London',
      preferredDateFormat: 'dd/MM/yyyy',
      canRecievePayments: true,
      weeklyDigest: true,
      monthlyDigest: true,
      notifications: {
        leaseRenewal: true,
        leaseExpiry: true,
        rentPaymentReminder: true,
        complianceDocs: true,
      },
    }
  }
}

export default OrgService
