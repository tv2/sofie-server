import { parseArgs } from 'node:util'
import { readdir } from 'fs/promises'
import { docker } from './docker'

const MONGODB_PORT: string = process.env.npm_package_confg_database_port || '3001'
const MONGODB_DATABASE_NAME: string = process.env.npm_package_confg_database_name || 'meteor'
const VERSON = process.env.VERSION || 'v0.0.0'

console.log(`migrating to version ${VERSON}...`)
