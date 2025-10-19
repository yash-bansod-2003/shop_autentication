import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "@/middlewares/authenticate";
import createError from "http-errors";

const authorization = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as AuthenticatedRequest).auth.role;
    if (!roles.includes(role)) {
      return next(
        createError(403, "You are not authorized to access this resource"),
      );
    }
    next();
  };
};

export default authorization;
