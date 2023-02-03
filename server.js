const express = require('express');
const app = express();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_tracker_db');

app.get('/', async(req, res, next) => {
  try {
    const SQL = `
      SELECT *
      FROM users;
    `;
    const response = await client.query(SQL);
    const users = response.rows;
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
                  <li>${ user.name }</li>
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

const port = process.env.PORT || 3000;

app.listen(port, async()=> {
  try {
    await client.connect();
    const SQL = `
DROP TABLE IF EXISTS users;
CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);
INSERT INTO users(name) VALUES('moe');
INSERT INTO users(name) VALUES('lucy');
INSERT INTO users(name) VALUES('larry');
    `;
    await client.query(SQL);

    console.log(`listening on port ${port}`);
  }
  catch(ex){
    console.log(ex);
  }
});