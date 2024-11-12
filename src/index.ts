// src/index.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import axios from "axios";
import session from "express-session";
import dotenv from "dotenv";
dotenv.config({
  path: __dirname + "/.env.local",
});

import { moduleManagerInstance } from "./core/moduleManager";

import { register as register_auth } from "./auth/auth_general";
import { register as register_broadcast } from "./broadcastRoom/room_general";

const app: express.Application = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://main.dbx8lkzfcsuib.amplifyapp.com",
      "https://www.kinopy2kuma.com"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(
  session({
    secret: "mySecret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(express.text());

//print out the endpoint that is being called
app.use((req, res, next) => {
  console.log(`Endpoint being called: ${req.url}`);
  console.log(`Method: ${req.method}`);
  //print out the auth token
  console.log(`Authorization: ${moduleManagerInstance.authManager.getAccessToken()}`);
  next();
});

app.listen(port, () => {
  console.log(`server is listening on ${port}`);
});

register_auth(app, moduleManagerInstance);
register_broadcast(app, moduleManagerInstance);

//print out which endpoint is being called


// Homepage
app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send("Hello World!");
});

// GET
app.get("/get", (req: express.Request, res: express.Response) => {
  res
    .status(200)
    .header("x-get-header", "get-header-value")
    .send("get-response-from-compute");
});

//POST
app.post("/post", (req: express.Request, res: express.Response) => {
  res
    .status(200)
    .header("x-post-header", "post-header-value")
    .send(req.body.toString());
});

//PUT
app.put("/put", (req: express.Request, res: express.Response) => {
  res
    .status(200)
    .header("x-put-header", "put-header-value")
    .send(req.body.toString());
});

//PATCH
app.patch("/patch", (req: express.Request, res: express.Response) => {
  res
    .status(200)
    .header("x-patch-header", "patch-header-value")
    .send(req.body.toString());
});

// Delete
app.delete("/delete", (req: express.Request, res: express.Response) => {
  res.status(200).header("x-delete-header", "delete-header-value").send();
});
