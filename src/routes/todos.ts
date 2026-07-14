import { Router, NextFunction, Request, Response } from "express";
import { Todo } from "../db/models/Todo";
import { loadTodo, parseTodoId, requireAuthCallback, toDTO } from "./utils/todoUtils";

export function createTodosRouter(params: {
  AUTH_COOKIE_NAME: string;
  verifyAuthJwt: (token: string) => { sub: string; email: string; exp: number };
}) {
  const { AUTH_COOKIE_NAME, verifyAuthJwt } = params;
  const router = Router();

  router.get("/", requireAuthCallback(AUTH_COOKIE_NAME, verifyAuthJwt), async (req, res) => {
    const email = res.locals.email as string;
    const todos = await Todo.find({ userEmail: email }).lean();
    res.json(todos.map(toDTO));
  });

  router.post("/", requireAuthCallback(AUTH_COOKIE_NAME, verifyAuthJwt), async (req, res) => {
    const email = res.locals.email as string;
    const { text } = req.body as { text?: string };

    if (!text || typeof text !== "string") return res.status(400).json({ error: "text is required" });

    const created = await Todo.create({
      userEmail: email,
      id: Date.now(),
      text,
      completed: false,
    });

    res.status(201).json(toDTO(created.toObject()));
  });

  router.post("/:_toggle", (req, res) => res.status(404).end());

  router.post("/:id/toggle", requireAuthCallback(AUTH_COOKIE_NAME, verifyAuthJwt), parseTodoId, loadTodo, async (req, res) => {
    const todo = res.locals.todo as any;
    const updated = await Todo.findOneAndUpdate(
      { userEmail: todo.userEmail, id: todo.id },
      { $set: { completed: !todo.completed } },
      { new: true }
    );

    res.json(toDTO(updated!.toObject()));
  });

  router.patch("/:id", requireAuthCallback(AUTH_COOKIE_NAME, verifyAuthJwt), parseTodoId, loadTodo, async (req, res) => {
    const { text } = req.body as { text?: string };
    if (text === undefined || typeof text !== "string") return res.status(400).json({ error: "text is required" });

    const todo = res.locals.todo as any;

    const updated = await Todo.findOneAndUpdate(
      { userEmail: todo.userEmail, id: todo.id },
      { $set: { text } },
      { new: true }
    );

    res.json(toDTO(updated!.toObject()));
  });

  router.delete("/:id", requireAuthCallback(AUTH_COOKIE_NAME, verifyAuthJwt), parseTodoId, async (req, res) => {
    const email = res.locals.email as string;
    const id = res.locals.todoId as number;

    const removed = await Todo.findOneAndDelete({ userEmail: email, id }).lean();
    if (!removed) return res.status(404).json({ error: "Todo not found" });

    res.json(toDTO(removed));
  });

  return router;
}

