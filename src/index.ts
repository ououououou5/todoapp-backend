import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { createAccountRouter } from "./routes/account";
import { createTodosRouter } from "./routes/todos";
import { connectToMongo } from "./db/connect";
import { setServers } from "node:dns/promises";

dotenv.config();
setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

app.use(
  cors({
    origin: "https://todo-frontend-orpin-nine.vercel.app",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    //allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const AUTH_COOKIE_NAME = "auth_todo_cookie";

const JWT_SECRET: string | undefined = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET");
}
const JWT_ISSUER = "todo-api";
const JWT_AUDIENCE = "todo-web";
const JWT_EXPIRES_IN = "15m";

function signAuthJwt(payload: { email: string; accountId: string }) {
  return jwt.sign(
    { sub: String(payload.accountId), email: payload.email },
    JWT_SECRET as string,
    {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

function verifyAuthJwt(token: string) {
  return jwt.verify(token, JWT_SECRET as string, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }) as { sub: string; email: string; exp: number };
}

app.get("/", (req, res) => {
  res.send("Todo API running.2");
});

async function main() {
  await connectToMongo();

  
  app.use(
    "/account",
    createAccountRouter({
      AUTH_COOKIE_NAME,
      setAuthCookieName: AUTH_COOKIE_NAME,
      signAuthJwt,
      verifyAuthJwt
    })
  );

  app.use(
    "/todos",
    createTodosRouter({
      AUTH_COOKIE_NAME,
      verifyAuthJwt,
    })
  );
  

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});















// server.js
// server.js (or src/index.ts)


//import "dotenv/config";
//How to change to make the project run ES modules / TS import style not commonjs ?
/*
require("dotenv").config();
import express from "express";
import mongoose from "mongoose";
import { setServers } from "node:dns/promises";

setServers(["1.1.1.1", "8.8.8.8"]);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const app = express();
  app.get("/", (req, res) => res.send("ok"));

  app.listen(3000, () => console.log("Listening on 3000"));
}

main().catch(console.error);

*/