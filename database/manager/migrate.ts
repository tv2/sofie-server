import { parseArgs } from 'node:util'

const {
  positionals,
  values
} = parseArgs({
  options: {
    help: {
      type: 'boolean',
      short: 'h',
      default: false,
    },
    latest: {
      type: 'boolean',
      default: false,
    }
  },
  strict: false,
  allowPositionals: false,
})

if (values.help) {
  console.log('Usage: npx ts-node ./db/manager/migrate.ts [option]')
  console.log('Options (use one of):')
  console.log('  -h, --help    Display this help message')
  console.log('  --latest      Migrate the database to the semantically latest schema version available in ../schema folder')

  process.exit(0)
}

function migrateLatest(): void {
  console.log('Migrating to the latest schema version...')
  // to be implemented
}

function action(values: { [longOption: string]: string | boolean | undefined } & {
  help: string | boolean | undefined
  latest: string | boolean | undefined
}): void {
  const options: string[] = Object.entries(values)
    .filter(([, isSet]) => isSet)
    .map(([argument]) => argument)

  switch (options[0]) {
    case 'start':
      console.log('starting mongo...')
      migrateLatest()
      break


    default:
      console.log('Please provide a valid option. Try --help for more information.')
      positionals.length > 0 && console.log('Unsupported: ', positionals)
      break
  }
}

action(values)
