import { readdir } from 'fs/promises'
import * as fs from 'fs'

// const MONGODB_PORT: string = process.env.npm_package_confg_database_port || '3001'
// const MONGODB_DATABASE_NAME: string = process.env.npm_package_confg_database_name || 'meteor'
const VERSION: string = process.env.VERSION || 'v0.0.0'

console.log(`Runner: migrating to version ${VERSION}`)
async function getCollections(): Promise<void> {
  (await readdir(
    `/schema/${VERSION}`,
    {withFileTypes: true, recursive: false},
  ))
    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))
    .forEach(
      collectionFile => {
        console.log(` - collection ${collectionFile}...`)
        fs.readFile(`${collectionFile.path}/${collectionFile.name}`, {encoding: 'utf-8'}, (err, data) => {
          if (err) {
            console.error(err)
            return
          }
          const dataArray = JSON.parse(data)
          console.dir(dataArray)
        })
      },
    )
}

void getCollections().then(
  () => console.log('done!'),
).catch(e => console.error(e))
