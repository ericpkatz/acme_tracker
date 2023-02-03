const express = require('express');
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_tracker_db');

app.get('/', async(req, res, next) => {
  try {
    const SQL = `
      SELECT users.id, users.name, things.name as "thingName", things.id as "thingId"
      FROM users LEFT JOIN things
      ON things."userId" = users.id
    `;
    const response = await client.query(SQL);
    const rows = response.rows;
    console.log(rows);
    const data = {};
    rows.forEach( row => {
      if(!data[row.id]){
        data[row.id] = { id: row.id, name: row.name, things: []}
      }
      if(row.thingId){
        data[row.id].things.push({ id: row.thingId, name: row.thingName});
      }
    });
    const users = Object.values(data);

    res.send(`
      <html>
        <head>
          <title>Acme Tracker</title>
        </head>
        <body>
          <h1>Acme Tracker</h1>
          <ul>
            ${
              users.map( user => {
                return `
                  <li>
                    <a href='/users/${user.id}'>${ user.name }</a>
                    <ul>
                      ${
                        user.things.map( thing => {
                          return `
                            <li>${ thing.name }</li>
                          `;
                        }).join('')
                      }
                    </ul>
                  </li>
                `;
              }).join('')
            }
          </ul>
        </body>
      </html>
    `);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/users/:id', async(req, res, next) => {
  try {
    const SQL = `
      SELECT users.id, users.name, things.name as "thingName", description, things.id as "thingId"
      FROM users LEFT JOIN things
      ON things."userId" = users.id
      WHERE users.id = $1
    `;
    const response = await client.query(SQL, [ req.params.id ]);
    const rows = response.rows;
    console.log(rows);
    const data = {};
    rows.forEach( row => {
      if(!data[row.id]){
        data[row.id] = { id: row.id, name: row.name, things: []}
      }
      if(row.thingId){
        data[row.id].things.push({ id: row.thingId, name: row.thingName, description: row.description});
      }
    });
    const users = Object.values(data);
    console.log(users);

    res.send(`
      <html>
        <head>
          <title>Acme Tracker</title>
        </head>
        <body>
          <h1>Acme Tracker</h1>
          <ul>
            ${
              users.map( user => {
                return `
                  <li>
                    <a href='/'>${ user.name }</a>
                    <ul>
                      ${
                        user.things.map( thing => {
                          return `
                            <li>
                              ${ thing.name }
                              <p>
                                ${ thing.description }
                              </p>
                            </li>
                          `;
                        }).join('')
                      }
                    </ul>
                  </li>
                `;
              }).join('')
            }
          </ul>
        </body>
      </html>
    `);
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  res.status(500).send(`
    ${err.message}
    <a href='/'>Try Again</a>
  `);
})

const port = process.env.PORT || 3000;

app.listen(port, async()=> {
  try {
    await client.connect();
    const SQL = `
DROP TABLE IF EXISTS things;
DROP TABLE IF EXISTS users;

CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);
CREATE TABLE things(
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  "userId" INTEGER REFERENCES users(id),
  description TEXT
);
INSERT INTO users(name) VALUES('moe');
INSERT INTO users(name) VALUES('lucy');
INSERT INTO users(name) VALUES('larry');
INSERT INTO things(name, description, "userId") VALUES ('foo', 'FOO', (
  SELECT id
  FROM users
  WHERE name = 'moe'
));
INSERT INTO things(name, description, "userId") VALUES ('bar', 'BAR', (
  SELECT id
  FROM users
  WHERE name = 'moe'
));
INSERT INTO things(name, description, "userId") VALUES ('bazz', 'BAZZ', (
  SELECT id
  FROM users
  WHERE name = 'lucy'
));
    `;
    await client.query(SQL);

    console.log(`listening on port ${port}`);
  }
  catch(ex){
    console.log(ex);
  }
});