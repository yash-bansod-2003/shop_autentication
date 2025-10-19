import { z } from "zod";
import { NextFunction, Request, Response } from "express";

export const userValidationSchema = z
  .object({
    firstname: z.string(),
    lastname: z.string(),
    email: z.string(),
    password: z.string(),
    restaurantId: z.number().optional(),
  })
  .strict();

export const userQueryValidationSchema = z
  .object({
    restaurantId: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    firstname: z.string(),
    lastname: z.string(),
    email: z.string(),
  })
  .strict();

export const userCreateValidator = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body);
    userValidationSchema.parse(req.body);
    next();
    return;
  } catch (error) {
    next(error);
    return;
  }
};
