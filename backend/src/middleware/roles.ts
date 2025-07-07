import { Request, Response, NextFunction } from 'express';

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireStaff = requireRole(['staff']);
export const requireCommissioner = requireRole(['commissioner']);
export const requireAdminOrCommissioner = requireRole(['admin', 'commissioner']); 