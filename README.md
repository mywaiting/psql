# psql

Deno implementation of the Postgresql frontend-backend/client-server protocol

## Getting started

```typescript
// deno run --allow-net --allow-read --unstable mod.ts

import { 
    Client,
    ObjectCursor
} from 'https://deno.land/x/psql/mod.ts'

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres'
})
await client.connect()

// simple query, result as array with default cursor
{
    const cursor = client.cursor()
    const result = await cursor.query('select id, name from people')
    console.log(result) // [[1, 'john'], [2, 'lucy'], ...]
}

// simple query with paramters, result as object with ObjectCursor
// You play `psql` with with `es6 tagged template string`, which looks like magic.
{
    const objectCursor = client.cursor(ObjectCursor)
    // const result = await objectCursor.query('select id, name from people where id < $1', [3, ])
    const result = await objectCursor.query`select id, name from people where id < ${3}`
    console.log(result) // [{id: 1, name: 'john'}, {id: 2, name: 'lucy'}]
}

// insert with paramters, return last insert id
{
    const cursor = client.cursor()
    const sql = `insert into people (name, ) values ($1, ) returning id`
    const result = await cursor.query(sql, ['david'])
    console.log(result) // 3
}

await client.close()
```
