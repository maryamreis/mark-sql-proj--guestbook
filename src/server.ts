import express from "express";
import cors from "cors";
import { Client } from "pg";

//As your database is on your local machine, with default port,
//and default username and password,
//we only need to specify the (non-default) database name.

const client = new Client({ database: 'guestbook' });

//TODO: this request for a connection will not necessarily complete before the first HTTP request is made!
client.connect();


const app = express();

/**
 * Simplest way to connect a front-end. Unimportant detail right now, although you can read more: https://flaviocopes.com/express-cors/
 */
app.use(cors());

/**
 * Middleware to parse a JSON body in requests
 */
app.use(express.json());

//When this route is called, return the most recent 100 signatures in the db
//FIXME-TASK: get signatures from db!
app.get("/signatures", async (req, res) => {
  try {
    const response = await client.query("SELECT signature, id, message, time FROM signatures ORDER BY id desc LIMIT 100 "); 
    res.status(200).json({
    status: "success",
    data: {
      response: response.rows
    },
  });
  } catch (error) {
    console.error(error.message)
    res.status(400).json({
      status: "bad request",
      data: {
        response: error.message
      },
    })
  }
});


// Does it need to display an error message if there is no id that matches it?

app.get("/signatures/:id", async (req, res) => {
  // :id indicates a "route parameter", available as req.params.id
  //  see documentation: https://expressjs.com/en/guide/routing.html
  const id = parseInt(req.params.id); // params are always string type
  
  try {
    //FIXME-TASK get the signature row from the db (match on id)
    const signature = await client.query('SELECT signature FROM signatures WHERE id = $1', [id]);  
    res.status(200).json({
      status: "success",
      data: {
        signature: signature.rows,
      },
    });

  } catch (error) {
    console.error(error.message)
    res.status(404).json({
      status: "fail",
      data: {
        id: "Could not find a signature with that id identifier",
        error: error.message
      },
    });
  }
  
});

app.post("/signatures", async (req, res) => {
  const { name, message } = req.body;
  try {
    if (typeof name === "string") {
      //FIXME-TASK: insert the supplied signature object into the DB
      await client.query('INSERT INTO signatures (signature) VALUES ($1)', [name])
      // INSERT INTO signatures (signature) VALUES ('Indiana Jones')
      //const createdSignature = await client.query(`SELECT signature FROM signatures WHERE signature = '${name}'`); 
  
      res.status(201).json({
        status: "success",
        // data: {
        //   signature: createdSignature, //return the relevant data (including its db-generated id)
        // },
      });
  } 
} catch (error) {
  console.log(error.message)
    res.status(400).json({
      status: "fail",
      data: {
        error: error.message,
      },
    });
  } 
});

//update a signature.
app.put("/signatures/:id", async (req, res) => {
  //  :id refers to a route parameter, which will be made available in req.params.id
  const { name, message } = req.body;
  const id = parseInt(req.params.id);
  if (typeof name === "string") {

    //FIXME-TASK: update the signature with given id in the DB.
    const result = await client.query('UPDATE signatures SET signature = $1 WHERE id = $2', [name, id]); 

    if (result.rowCount === 1) {
      const updatedSignature = result.rows[0];
      res.status(200).json({
        status: "success",
        data: {
          signature: updatedSignature,
        },
      });
    } else {
      res.status(404).json({
        status: "fail",
        data: {
          id: "Could not find a signature with that id identifier",
        },
      });

    }
  } else {
    res.status(400).json({
      status: "fail",
      data: {
        name: "A string value for name is required in your JSON body",
      },
    });
  }
});

app.delete("/signatures/:id", async (req, res) => {
  const id = parseInt(req.params.id); // params are string type

  ////FIXME-TASK: delete the row with given id from the db 
  const queryResult: any = await client.query('DELETE FROM signatures WHERE id = $1', [id]);  
  const didRemove = queryResult.rowCount === 1;

  if (didRemove) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE#responses
    // we've gone for '200 response with JSON body' to respond to a DELETE
    //  but 204 with no response body is another alternative:
    //  res.status(204).send() to send with status 204 and no JSON body
    res.status(200).json({
      status: "success",
    });
  } else {
    res.status(404).json({
      status: "fail",
      data: {
        error: ("Could not find a signature with that id identifier"),
      },
    });
  }
});

export default app;
