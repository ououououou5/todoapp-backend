import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { Account } from "../db/models/Account";
import { loginLimiter, signupLimiter } from "./utils/rateLimiter";

export function createAccountRouter(params: {
  setAuthCookieName: string;
  AUTH_COOKIE_NAME: string;
  signAuthJwt: (payload: { email: string; accountId: string }) => string;
  verifyAuthJwt: (token: string) => { sub: string; email: string; exp: number };
}) {
  const { AUTH_COOKIE_NAME, setAuthCookieName, signAuthJwt, verifyAuthJwt } = params;
  const router = Router();

  router.post("/login", loginLimiter, async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return res.status(400).json({ error: "email and password are required" });
    }

    const account = await Account.findOne({ email }).lean();
    if (!account) return res.status(401).json({ error: "Invalid credentials" });

    const passwordHash = account.password;

    const ok = await bcrypt.compare(password, passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const tokenValue = signAuthJwt({
      email: account.email,
      accountId: String(account._id),
    });

    res.cookie(setAuthCookieName ?? AUTH_COOKIE_NAME, tokenValue, {
      httpOnly: true,
      sameSite: "none",
      secure: true
    });

    res.json({ ok: true });
  });

  router.get("/checkLoggedIn", async (req: Request, res: Response) => {
    const token = req.cookies?.[AUTH_COOKIE_NAME] as string | undefined;
    if (!token) return res.json({ loggedIn: false });

    try {
      const decoded = verifyAuthJwt(token);
      const exists = await Account.exists({ email: decoded.email });
      return res.json({ loggedIn: !!exists });
    } catch {
      return res.json({ loggedIn: false });
    }
  });

  router.post("/signup", signupLimiter, async (req: Request, res: Response) => {
    //signut currently disabled
    return res.status(400).json({ error: "Signup currently disabled." });
    /*
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return res.status(400).json({ error: "email and password are required" });
    }

    const existing = await Account.exists({ email });
    if (existing) return res.status(409).json({ error: "Account already exists" });

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS as string, 10));
    const created = await Account.create({ email, password: hashedPassword });

    const tokenValue = signAuthJwt({
      email: created.email,
      accountId: String(created._id),
    });

    res.cookie(setAuthCookieName ?? AUTH_COOKIE_NAME, tokenValue, {
      httpOnly: true,
      sameSite: "strict",
      secure: true
    });

    res.status(201).json({ ok: true });
    */
  });

  router.post("/logout", (req: Request, res: Response) => {
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: "strict",
      secure: true
    });
    res.json({ ok: true });
  });

  return router;
}
