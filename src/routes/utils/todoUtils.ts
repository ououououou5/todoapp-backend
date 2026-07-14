import { Router, NextFunction, Request, Response } from "express";
import { Todo } from "../../db/models/Todo";

type TodoDTO = {
  id: number;
  text: string;
  completed: boolean;
};

  export function requireAuthCallback(
    AUTH_COOKIE_NAME: string,
    verifyAuthJwt: (token: string) => { sub: string; email: string; exp: number }
    ) {
    return function requireAuth(req: Request, res: Response, next: NextFunction) {
        const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        try {
          const decoded = verifyAuthJwt(token);
          const email = decoded.email;
          const sub = decoded.sub;
          if (!email || !sub) return res.status(401).json({ error: "Unauthorized" });

          res.locals.email = email;
          next();
        } catch {
          return res.status(401).json({ error: "Unauthorized" });
        }
    }
  }

  export function parseTodoId(req: Request, res: Response, next: NextFunction) {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    res.locals.todoId = id;
    next();
  }

  export async function loadTodo(req: Request, res: Response, next: NextFunction) {
    const email = res.locals.email as string;
    const id = res.locals.todoId as number;

    const todoDoc = await Todo.findOne({ userEmail: email, id }).lean();
    if (!todoDoc) return res.status(404).json({ error: "Todo not found" });

    res.locals.todo = todoDoc;
    next();
  }

  export function toDTO(doc: any): TodoDTO {
    return { id: doc.id, text: doc.text, completed: doc.completed };
  }