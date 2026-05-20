/**
 * Resets the test DB and applies Drizzle migrations via psql inside the Docker container.
 *
 * Why psql instead of `drizzle-kit migrate`:
 *   drizzle-kit migrate hangs when spawned as a child process on Windows.
 *
 * Why skip 0001_handle_new_user.sql:
 *   That migration creates a trigger on auth.users (Supabase Auth table). A plain
 *   Postgres container has no auth schema — the trigger is only meaningful against
 *   a real Supabase instance and is not exercised by integration tests.
 *
 * Why drop/create the DB before migrating:
 *   The container persists between runs (docker compose up -d is a no-op if already
 *   running). Dropping and recreating gives a guaranteed clean schema every time.
 */

import { execSync } from 'child_process'
import { readFileSync, readdirSync } from 'fs'
import { join, resolve } from 'path'

const CONTAINER = 'nif3-db-test-1'
const DB = 'nif3_test'
const USER = 'postgres'
const MIGRATIONS_DIR = resolve('lib/db/migrations')

function psql(sql) {
  execSync(`docker exec -i ${CONTAINER} psql -U ${USER} -d postgres -c "${sql}"`, {
    stdio: 'inherit',
  })
}

function psqlFile(filePath) {
  const sql = readFileSync(filePath)
  execSync(`docker exec -i ${CONTAINER} psql -U ${USER} -d ${DB}`, {
    input: sql,
    stdio: ['pipe', 'inherit', 'inherit'],
  })
}

// Drop and recreate the test DB for a guaranteed clean schema on every run
console.log('Resetting test database…')
psql(`DROP DATABASE IF EXISTS ${DB}`)
psql(`CREATE DATABASE ${DB}`)

// Apply migrations in order, skipping the Supabase Auth trigger (requires auth schema)
const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql') && !f.includes('0001_handle_new_user'))
  .sort()

for (const file of files) {
  console.log(`Applying ${file}…`)
  psqlFile(join(MIGRATIONS_DIR, file))
}

console.log('Done.')
