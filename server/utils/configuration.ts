import { env } from 'node:process'

export const serverConfiguration = {
  adminUser: env.ADMIN_USER || 'admin',
  adminPassword: env.ADMIN_PASSWORD || 'password',
  sessionMaxAge: (env.SESSION_MAX_AGE || 86400) as number
}