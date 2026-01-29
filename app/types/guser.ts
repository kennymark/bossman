export interface GoogleUser {
  id: string
  nickName: string
  name: string
  email: string
  avatarUrl: string
  emailVerificationState: string
  original: Original
  token: Token
}

export interface Original {
  sub: string
  name: string
  given_name: string
  family_name: string
  picture: string
  email: string
  email_verified: boolean
}

export interface Token {
  token: string
  type: string
  expiresIn: number
  expiresAt: Date
  scope: string
  id_token: string
  idToken: string
}
