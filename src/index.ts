// src/index.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import axios from "axios";
import session from 'express-session';
import dotenv from 'dotenv';
dotenv.config();

import {moduleManagerInstance} from "./core/moduleManager";

import { register as register_auth } from './auth/auth_general';
import { register as register_broadcast } from './broadcastRoom/room_general';

const app: express.Application = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(helmet());
app.use(cors({
  origin: process.env.ORIGIN,
  credentials: true
}));

app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  }));

app.use(express.text());

app.listen(port, () => {
  console.log(`server is listening on ${port}`);
});

register_auth(app, moduleManagerInstance);
register_broadcast(app, moduleManagerInstance);

// Homepage
app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).send("Hello World!");
});

// GET
app.get('/get', (req: express.Request, res: express.Response) => {
  res.status(200).header("x-get-header", "get-header-value").send("get-response-from-compute");
});

//POST
app.post('/post', (req: express.Request, res: express.Response) => {
  res.status(200).header("x-post-header", "post-header-value").send(req.body.toString());
});

//PUT
app.put('/put', (req: express.Request, res: express.Response) => {
  res.status(200).header("x-put-header", "put-header-value").send(req.body.toString());
});

//PATCH
app.patch('/patch', (req: express.Request, res: express.Response) => {
  res.status(200).header("x-patch-header", "patch-header-value").send(req.body.toString());
});

// Delete
app.delete('/delete', (req: express.Request, res: express.Response) => {
  res.status(200).header("x-delete-header", "delete-header-value").send();
});
