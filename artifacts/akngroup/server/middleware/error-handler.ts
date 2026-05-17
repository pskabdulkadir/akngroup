import type { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err?.status || err?.statusCode || 500;
  const message = err?.message || "Sunucu hatası";

  // Avoid leaking stack in production
  const isProd = process.env.NODE_ENV === "production";
  const payload: any = {
    success: false,
    message,
  };
  if (!isProd && err?.stack) {
    payload.stack = err.stack;
  }

  try {
    res.status(status).json(payload);
  } catch {
    res.status(500).json({ success: false, message: "Beklenmeyen hata" });
  }
}

export default errorHandler;
