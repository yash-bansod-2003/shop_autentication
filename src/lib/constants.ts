export const enum ROLES {
  ADMIN = "admin",
  MAINTAINER = "maintainer",
  USER = "user",
}

export const enum TOKEN_OPTIONS {
  ACCESS_TOKEN_EXPIRATION_DURATION = "1h",
  REFRESH_TOKEN_EXPIRATION_DURATION = "1w",
  FORGOT_PASSWORD_TOKEN_EXPIRATION_DURATION = "10m",
  ISSUER = "shop_authentication_service",
}
