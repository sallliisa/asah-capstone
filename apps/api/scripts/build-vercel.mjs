import { spawnSync } from 'node:child_process'

function run(args) {
  const result = spawnSync('pnpm', args, { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (process.env.CARTA_MIGRATE_ON_BUILD === 'true') {
  if (process.env.VERCEL_ENV !== 'production') throw new Error('Production migrations require a production deployment.')
  run(['run', 'db:migrate'])
}
run(['run', 'type-check'])
run(['run', 'routes:compile', '.sprindle-vercel/routes.mjs'])
