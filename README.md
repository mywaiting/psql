# pq

Deno implementation of the Postgresql frontend-backend/client-server protocol

## Example

```
// deno run --allow-net --allow-read --unstable mod.ts

import { 
    Client,
    ObjectCursor
} from 'https://deno.land/x/pq/mod.ts'

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
    const result = await cursor.execute('select id, name from people')
    console.log(result) // [[1, 'john'], [2, 'lucy'], ...]
}

// simple query with paramters, result as object with ObjectCursor
{
    const objectCursor = client.cursor(ObjectCursor)
    const result = await objectCursor.execute('select id, name from people where id < $1', [3, ])
    console.log(result) // [{id: 1, name: 'john'}, {id: 2, name: 'lucy'}]
}

// insert with paramters, return last insert id
{
    const cursor = client.cursor()
    const sql = `insert into people (name, ) values ($1, ) return id`
    const result = await cursor.execute(sql, ['david'])
    console.log(result) // 3
}


await client.close()

```