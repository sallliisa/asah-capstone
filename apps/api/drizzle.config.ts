import { defineConfig } from 'drizzle-kit'

const connectionString = process.env.CARTA_DATABASE_PURPOSE === 'test'
  ? process.env.DATABASE_URL
  : process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required for Drizzle commands.')
}

export default defineConfig({
  schema: ['./src/routes/**/*.entity.ts', './src/routes/**/*.table.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
})
