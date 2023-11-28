import { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "../middleware/AsyncHandler";
import User, { IUser } from "../models/User";
import { BadRequest, NotFound } from "../errors/Errors";
import Config from "../config";
import { created, deleted, updated } from "../lib/Responses";
import { validate } from "../middleware/Validator";
import { idValidater, loginValidator, userValidator } from "../lib/Validations";

const router = Router();
const RES_NAME = "User";

const userProjection = {
  name: 1,
  userName: 1,
  email: 1,
};

router.post(
  "/",
  validate(userValidator),
  asyncHandler(async (req: Request, res: Response) => {
    req.body.password = await bcrypt.hash(
      req.body.password,
      Config.AUTH.SALT_ROUNDS
    );

    const user = await User.findOne({
      $or: [{ email: req.body.email }, { userName: req.body.userName }],
    });

    if (user) {
      throw new BadRequest(`User already exists`);
    }

    await User.create({
      ...req.body,
    });
    res.json({ msg: created(RES_NAME) });
  })
);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find({}, userProjection);
    res.json(users);
  })
);

router.get(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await User.findById(id, { password: 0 });
    if (!user) {
      throw new NotFound(`User with id ${id} not found`);
    }
    res.json(user);
  })
);

router.put(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, Config.AUTH.SALT_ROUNDS);
    const rowsUpdated = await User.updateOne(
      { name, email, password: hashedPassword },
      { where: { id } }
    );
    if (rowsUpdated.modifiedCount === 0) {
      throw new NotFound(`User with id ${id} not found`);
    }
    res.json({ message: updated(RES_NAME) });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const rowsDeleted = await User.deleteOne({ where: { id } });
    if (rowsDeleted.deletedCount === 0) {
      throw new NotFound("User not found");
    }
    res.json({ message: deleted(RES_NAME) });
  })
);

router.post(
  "/login",
  validate(loginValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { userName, password } = req.body;
    // find one user with the email or username
    const user = await User.findOne({
      $or: [{ email: userName }, { userName }],
    });
    if (!user) {
      throw new BadRequest("User with email or username not found");
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new BadRequest("Invalid password");
    }
    const token = user.generateToken(); // generate the token using the user model method

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      })
      .json({ message: "Login successful" });
  })
);

router.post(
  "/:id/reset-password",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(id);

    if (!user) {
      throw new NotFound("User not found");
    }

    const isSamePassword = await bcrypt.compare(oldPassword, user.password);

    if (!isSamePassword) {
      throw new BadRequest("Invalid password");
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      Config.AUTH.SALT_ROUNDS
    );
    await User.updateOne({ password: hashedPassword }, { where: { id } });
    // todo : send the mail to user that the password is resetted
    res.json({ message: "Password resetted successfully" });
  })
);

export default router;
