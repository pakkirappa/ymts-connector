import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import CONFIG from "../config";
import User, { IUser } from "../models/User";

/**
 * @description This middleware is used to authenticate the member
 * @overview - this will check for bearer token in the authorization header
 * and will check if the token is valid or not and will add the member details
 * to the request object if the token is valid and will pass the request to the next middleware
 */
// export const memberAuthHandler = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   const authorization = req.headers.authorization || req.headers.Authorization;

//   if (!authorization) {
//     return res.status(401).json({ msg: `Authorization header is required` });
//   }

//   const token = authorization.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({ msg: `Token is required` });
//   }

//   const decodedUser = jwt.verify(token, CONFIG.JWT_SECRET) as {
//     id: number;
//     type: string;
//   };

//   if (!decodedUser) {
//     return res.status(401).json({ msg: `Invalid token` });
//   }

//   let user = {} as Seller | Employee;
//   if (decodedUser.type === "EMPLOYEE") {
//     user = await Employee.findOneOrFail({
//       where: { id: decodedUser.id },
//     });
//   } else if (decodedUser.type === "SELLER") {
//     user = await Seller.findOneOrFail({
//       where: { id: decodedUser.id },
//     });
//   }

//   if (!user) {
//     return res
//       .status(401)
//       .json({
//         msg: `No ${decodedUser.type} found with this token , please check`,
//       });
//   }

//   req.user = user;

//   next();
// };

/**
 * @description This middleware is used to authenticate the member
 * @overview - this will check for bearer token in the authorization header
 * and will check if the token is valid or not and will add the member details
 * to the request object if the token is valid and will pass the request to the next middleware
 */
export const memberAuthHandler = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  // if path contains login or register then skip auth
  if (req.path.includes("login") || req.path.includes("register")) {
    return next();
  }

  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ msg: `Token is required` });
  }

  const decodedUser = jwt.verify(token, CONFIG.AUTH.JWT_SECRET) as {
    _id: number;
  };

  if (!decodedUser) {
    return res.status(401).json({ msg: `Invalid token` });
  }

  const user = await User.findById(decodedUser._id);

  if (!user) {
    return res.status(401).json({
      msg: `No user found with this token , please check`,
    });
  }

  req.sender = user;
  req.user = user;

  next();
};
