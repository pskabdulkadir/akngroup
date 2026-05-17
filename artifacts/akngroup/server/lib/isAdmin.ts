import { Request, Response, NextFunction } from 'express';

// Express'in Request tipini genişleterek `user` objesini tanımlıyoruz.
// Bu, JWT doğrulama middleware'i tarafından eklenir.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  // req.user objesi ve rolü kontrol edilir. 'admin' ve 'ADMIN' her ikisi de kabul edilir.
  if (!req.user || (req.user.role.toLowerCase() !== 'admin')) {
    return res.status(403).json({
      message: 'Bu işlem için admin yetkisi gereklidir.'
    });
  }
  next();
}