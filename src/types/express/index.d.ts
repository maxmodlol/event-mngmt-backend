// src/types/express/index.d.ts
import { IUser } from "../../models/User";
import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    user: IUser;
  }
}
declare global {
  namespace Express {
    interface Request {
      user: IUser;
    }
  }
}
declare module "express" {
  interface Request {
    user: IUser;
  }
}
