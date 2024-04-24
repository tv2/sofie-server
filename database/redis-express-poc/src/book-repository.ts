import 'dotenv/config'
import {Repository, Schema, RedisConnection} from 'redis-om'


function setup(redis: RedisConnection): Repository {
  return new Repository(
    new Schema(
      'book',
      {
        title: {type: 'string'},
        author: {type: 'string'},
        pages: {type: 'number'},
      },
      {
        dataStructure: 'JSON'
      },
    ),
    redis
  )
}

export default setup
