import 'dotenv/config'
import express from 'express'
import {createClient} from 'redis'
import setup from './book-repository'
import {Entity, Repository} from 'redis-om'


const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
})

app.listen(PORT, () => {

  redis
    .connect()
    .then(async redisClient => {
      console.log('connected to redis')
      const br: Repository = setup(redisClient)

      await br.save('first-book', {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        pages: 218
      })

      await br.save('second-book', {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        pages: 234
      })

      console.dir(await br.fetch('second-book'))
      console.dir(await br.fetch('first-book'))

      const books = await br.search()
        .where('title').contain('The ')
        .and('pages').is.greaterThan(200)
        .return.all()
      console.dir(books)

    })
    .catch(e => {
      console.error(e)
    })

  console.log(`app is running on port ${PORT}`)
})
