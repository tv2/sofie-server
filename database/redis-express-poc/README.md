Few thoughts on Redis and its potential use in Sofie:

- Redis can be clustered for redundancy and high availability.
- Redis can persist data to disk using several strategies.
- libs to choose among `ioredis` v.s `redis`, `redis-om` - will determine the way you interact with Redis and how things will evolve in the future.
- Redis can be used as Mongo replacement.
- Redis can atleast be used as a cache on top of Mongo, but data volume is low enough to completely skip Mongo at all.
- Redis can do streams and can be used as a message broker. With the ability of defining custom server side functions perhaps Sofie backend can be drastically reduced in complexity if not entirelyexternalized to Redis, so that browsers talk to Redis directly.
- While the open-source Redis software is free to use, Redis Enterprise comes with a cost because of its added functionality and support.


External resources:
- https://redis.io/legal/licenses/
- https://github.com/redis/ioredis
- https://github.com/redis/node-redis
- https://github.com/redis/redis-om-node
- https://redis.io/topics/streams-intro

In addition a great replacement candidaet for Express is Resify which is a Node.js web service framework optimized for building semantically correct RESTful web services ready for production use at scale http://restify.com/
