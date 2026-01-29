declare module 'speakeasy' {
  export interface GenerateSecretOptions {
    name: string
    issuer: string
    length?: number
  }

  export interface GenerateSecretResult {
    base32: string
    otpauth_url: string | null
    secret: string
  }

  export interface VerifyOptions {
    secret: string
    encoding: 'base32' | 'ascii' | 'hex' | 'base64'
    token: string
    window?: number
  }

  export function generateSecret(options: GenerateSecretOptions): GenerateSecretResult
  export namespace totp {
    function verify(options: VerifyOptions): boolean
  }
}
