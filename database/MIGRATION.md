
# Migration

note: The term is restricted to just a few operations (which makes the word 'modification' fit better here).

Since Mongo is Document database it uses flexible schema model which means there is no strict definition of what can be stored in collection. This makes it easy to evolve the application over time, adding or modifying existing documents. Once the application matures and the data model stabilizes, it is a good idea to define a schema for the collections to enforce data integrity and consistency.

We can achieve this by simply picking one of many and popular ORMs (Object-Relational Mapping) libraries like Mongoose or Prisma. These libraries provide a way to define a schema for the collections and enforce it when inserting or updating documents. 

However, this is just application side validation, and it is still possible to insert or update documents that do not conform to the schema. With this in mind further talks on the libraries are not essential.

Mongo provides a way to enforce schema validation at the database level using JSON Schema. JSON Schema is a standard for defining the structure of JSON documents. We can define a schema for a collection using JSON Schema and enforce it when inserting or updating documents. This ensures that only documents that conform to the schema are inserted or updated in the collection and rest are rejected. As side effect this theoretically should prevent bugs in code that are caused by unexpectedly presented or missing data.

On the other sde - bringing in another library in the stack is actually not desired here, since we have all needed for solving the job - native MongoDB Node.js driver and a set of cleverly crafted schema files.

## Tooling

For the purpose of the project a migration tool has emerged that solves few data manipulation tasks. The tool is written in TypeScript and uses the MongoDB Node.js driver to connect to the database and perform the operations.

The tool is designed to be run as a Docker job from the command line and honors a set of environment variables that determine the outcome (also makes it pipeline friendly).

### Env vars
```bash
MONGODB_PORT - port that MongoDB is listening at. Default is '3001'
MONGODB_HOST - host that MongoDB is bound to listen. Default is 'gateway.docker.internal'
MONGODB_REPLICA - the name of the replica set. Default is 'rs0'
MONGODB_DATABASE_NAME - application bound database. Default is 'meteor'
VERSION - schema revision version. Default is 'v0.0.0'
```

### Invocation
```bash
yarn migrate-database
```
as result will locate all available schema definitions, determine latest (semantically the highest version) and trigger: 
```bash
docker run --rm --name runner
    -v './database/schema:/schema'
    -e VERSION='v0.1.0'
    -e MONGODB_HOST='gateway.docker.internal'
    -e MONGODB_PORT='3001'
    -e MONGODB_REPLICA='rs0'
    -e MONGODB_DATABASE_NAME='meteor'
    runner:v1
```

### Schema definitions

In `database/schema` directory there are a set of JSON files that define the schema for the collections. Each file is named after the collection it defines and contains the JSON schema for the collection. The schema files are named using the following convention: `collectionName.json`.

The schema files are versioned using semantic versioning. The version of the schema is defined by the folder name where json files are stored.

The schema files are versioned using semantic versioning. The version of the schema is defined by the folder name where json files are stored.

```bash
database/schema                 # root directory
├── v0.0.1                      # schema version
│   ├── collection1.json        # schema for collection1
│   ├── collection2.json        # schema for collection2
...
├── v0.1.0                      # schema version
│   ├── collection1.json        # schema for collection1
│   ├── collection2.json        # schema for collection2
...
├── v9999.9999.9999             # schema version
│   ├── collection1.json        # schema for collection1
│   ├── collection2.json        # schema for collection2
```

#### JSON structure
Self-descriptive JSON schema property example:
```json
{
  "define": {
    "details": "for document validation used upon collection creation, check bellow for details-json"
  },

  "extend": {
    "details": "when extending the validator with additional rules or fields, check bellow for details-json"
  },

  "copy": {
    "field": "document property name to copy",
    "to": "destination collection name",
    "matcher": {
      "source": "current collection document filter",
      "destination": "destination collection document filter"
    }
  },

  "remove": {
    "details": "when shrinking the validator by dropping rules or fields, check bellow for details-json"
  },

  "drop": {
    "name": "this collection name as confirmation trigger to drop",
    "options": {
      "details": "additional DB options for drop operation"
    }
  },

  "insert": [
    {
      "noId": "document1",
      "to": "insert in collection..."
    },
    {
      "noId": "document2",
      "to": "insert in collection..."
    }
  ]
}
```

details-json excerpt:
```json
{
    "bsonType": "object",
    "required": [
      "phone",
      "name"
    ],
    "properties": {
      "name": {
        "bsonType": "string",
        "description": "must be a string and is required to be between three and a hundred characters with single space",
        "minLength": 3,
        "maxLength": 100,
        "pattern": "^[a-zA-Z]+ [a-zA-Z]+$"
      },
      "phone": {
        "bsonType": "string",
        "pattern": "^[0-9]+$",
        "minLength": 10,
        "description": "must be a string that starts with +<country_code><area_code><number> and minimum 9 numbers are required"
      },
      "email": {
        "bsonType": "string",
        "pattern": "@mongodb\\.com$",
        "description": "must be a string and end with '@mongodb.com' when provided"
      }
    }
  }
```

## Modification steps

The above json examples can contain all or just a subset of the properties. The tool will read the schema files and apply the changes to the database in the following order:
- create a new collection if it does not exist (constructive change - add collection to database)
- extend the schema of an existing collection (constructive change - add field to document)
- copy data from one collection to another (constructive change - copy field from one collection to another using 1:1 document matcher)
- remove fields from the schema of an existing collection (destructive change - remove field from document)
- drop a collection (destructive change - remove collection from database)
- insert documents into a collection (constructive change - add documents to collection)

## Migration waves
This sequence will be performed for each collection json in the version folder one after another till all collections are processed, then advancement to next step will occur - hence the waves association, thus json processing order is irrelevant.

## Workload scenarios
*note*: The examples bellow are unintentionally more-suitable for relational databases, but they are used to illustrate the point of the tooling.

- create collection 'books' in v0.0.1 with fields 'title' and 'isbn', insert one document `schema/v0.0.1/books.json`
```json

{
  "define": {
    "bsonType": "object",
    "required": [
      "title"
    ],
    "properties": {
      "title": {
        "bsonType": "string",
        "description": "must be a string and is required",
        "minLength": 3
      }
    }
  },
  "insert": [
    {
      "title": "The Catcher in the Rye"
    }
  ]
}
```
- create collection 'isbn' in v0.0.1 - with field 'agency', insert one document `schema/v0.0.1/isbn.json`
```json
{
  "define": {
    "bsonType": "object",
    "required": [
      "agency"
    ],
    "properties": {
      "agency": {
        "bsonType": "string",
        "description": "must be a string and is required"
      }
    }
  },
  "insert": [
    {
      "agency": "ISBN"
    }
  ]
}
```
- extend collection 'books' in v0.0.2 - add field 'author' to books `schema/v0.0.2/books.json`
```json
{
  "extend": {
    "bsonType": "object",
    "required": [
      "agency",
      "author"
    ],
    "properties": {
      "agency": {
        "bsonType": "string",
        "description": "must be a string and is required"
      },
      "author": {
        "bsonType": "string",
        "description": "must be a string and is required"
      }
    }
  }
}
```
- create collection 'authors' in v0.0.3 with fields 'name' and 'email' `schema/v0.0.3/authors.json`
```json
{
  "define": {
    "bsonType": "object",
    "required": [
      "name",
      "email"
    ],
    "properties": {
      "name": {
        "bsonType": "string",
        "description": "must be a string and is required",
        "minLength": 3
      },
      "email": {
        "bsonType": "string",
        "pattern": "@mongodb\\.com$",
        "description": "must be a string and end with '@mongodb.com'"
      }
    }
  }
}
```
- copy 'email' field from 'authors' to 'books' in v0.0.4 `schema/v0.0.4/authors.json`
```json
{
  "copy": {
    "field": "email",
    "to": "books",
    "matcher": {
      "source": {"name": "Joe Bloggs"},
      "destination": {"author": "Joe Bloggs"}
    }
  }
}
```
- remove 'author' field from 'books' in v0.0.5, insert one document into 'books' collection `schema/v0.0.5/books.json`
```json
{
  "remove": {
    "extend": {
      "bsonType": "object",
      "required": [
        "agency"
      ],
      "properties": {
        "agency": {
          "bsonType": "string",
          "description": "must be a string and is required"
        }
      }
    }
  },
  "insert": [
    {
      "name": "The Catcher in the Rye - J.D. Salinger"
    }
  ]
}
```
- drop 'isbn' collection in v0.0.6 with no additional options provided `schema/v0.0.6/isbn.json`
```json
{
  "drop": {
    "name": "isbn"
  }
}
```

## End notes
Proposed workflow is a simple and effective way to manage schema changes in MongoDB. Applying the latest migration is automated for ease of developers.

## Enhancements
Tool script can be further enhanced to achieve migration idempotency and resilience.

## In addition

- Each schema version can live in separate database (named after the schema version t represents after the same version migration was run)
- After each migratiion (resulting a fresh database) a snapshot can be taken and used as a point of next migration start
- Schema migrations can be tricky to implement, so latest schema version available might not necessarily be ready for use by the application. Decupling the schema version from the application version wll give development and operatinal freedom. Using `config` object in `package.json` can be used to note which database to be used by the application.


### External resources:
- https://www.mongodb.com/docs/manual/data-modeling/#std-label-manual-data-modeling-intro
- https://mongodb.github.io/node-mongodb-native/
- https://www.mongodb.com/docs/drivers/node/current/
- https://www.mongodb.com/docs/drivers/node/current/fundamentals/typescript/
- https://www.mongodb.com/docs/manual/core/schema-validation/#std-label-schema-validation-overview
- https://www.mongodb.com/docs/compass/current/query/filter/?utm_source=compass&utm_medium=product
 

MEAN.js stack (MongoDB, Express, Angular, Node.js) https://github.com/meanjs/mean

PRISMA.IO - a new type of ORM https://www.prisma.io/mongodb https://www.prisma.io/docs/orm/overview/prisma-in-your-stack/is-prisma-an-orm
