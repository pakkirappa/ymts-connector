import { body, param, query } from "express-validator";
import User from "../models/User";

export const categoryValidator = [
  body("name").notEmpty().trim().withMessage("Name is required"),
];

export const meetingValidator = [
  body("agenda")
    .notEmpty()
    .trim()
    .withMessage("Agenda is required")
    .isLength({ min: 10 })
    .withMessage("Agenda should be at least 10 characters"),
  body("users")
    .notEmpty()
    .withMessage("Users are required")
    .isArray({ min: 2 })
    .withMessage("At least 2 users are required")
    .custom((users: string[]) => {
      return users.length === new Set(users).size;
    })
    .withMessage("Users must be unique")

    .custom((users: string[]) => {
      return users.every((user) => {
        // check if the user is a valid mongo id
        return user.match(/^[0-9a-fA-F]{24}$/);
      });
    })
    .withMessage("Users must be valid mongo ids")
    .custom((users: string[]) => {
      const isValid = users.every((user) => {
        return User.findById(user);
      });
      return isValid;
    })
    .withMessage("Users must be valid mongo ids"),
  body("scheduledAt")
    .notEmpty()
    .withMessage("Scheduled At is required")
    .isDate()
    .withMessage("Scheduled At must be a valid date"),
];

export const loginValidator = [
  body("userName").notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const messageValidator = [
  body("text").notEmpty().trim().withMessage("Text is required"),
];

export const topicValidator = [
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("description").notEmpty().trim().withMessage("Description is required"),
  body("users")
    .notEmpty()
    .withMessage("Users are required")
    .isArray({ min: 2 })
    .withMessage("At least 2 users are required")
    .custom((users: string[]) => {
      return users.length === new Set(users).size;
    })
    .withMessage("Users must be unique"),
  // .custom((users: string[]) => {
  //   // the users are the usernames
  //   const getUsers = async () => {
  //     const gotUsers = await User.find({ userName: { $in: users } });
  //     return gotUsers;
  //   };
  //   // check if the users are registered or not
  //   getUsers()
  //     .then((gotUsers) => {
  //       if (gotUsers.length !== users.length) {
  //         return false;
  //       } else {
  //         return true;
  //       }
  //     })
  //     .catch((err) => {
  //       return false;
  //     });
  // })
  // .withMessage(
  //   "Some Users must be registered. If you are trying to add a new user, please ask them to register first"
  // ),
];

export const idValidater = [
  param("id").isMongoId().withMessage("Id must be a valid mongo id"),
];

export const roleValidator = [
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("description").notEmpty().trim().withMessage("Description is required"),
  body("permissions")
    .notEmpty()
    .withMessage("Permisssions are required")
    .isArray({ min: 1, max: 33 })
    .withMessage("At least 1 permission is required"),
];

export const userValidator = [
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("userName").notEmpty().withMessage("Username is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 7, max: 12 })
    .withMessage("Password Should Be At Least 7 Charecters"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Email must be valid"),
];

export const expenseTypeValidator = [
  body("name").notEmpty().trim().withMessage("Name is required"),
];

export const getMessageValidator = [
  param("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  query("count")
    .optional()
    .isInt()
    .withMessage("Count must be a number")
    .toInt(),
];

export const getTopicValidator = [
  param("name")
    .notEmpty()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  query("count")
    .optional()
    .isInt()
    .withMessage("Count must be a number")
    .toInt(),
];
