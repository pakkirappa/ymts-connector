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
import { query } from "express-validator";
import Conversation from "../models/Conversation";

const router = Router();

router.get(
  "/me",
  asyncHandler(async (req: any, res: Response) => {
    // i need whom i chatted with and the last message i sent to them or vice versa
    const { _id } = req.sender as { _id: string };

    const conversations = await Conversation.find(
      {
        participants: {
          $in: [_id],
        },
      },
      { messages: 1, participants: 1, _id: 0 }
    )
      .populate({
        path: "participants",
        select: "name userName",
      })
      .populate({
        path: "messages",
        populate: {
          path: "senderId",
          select: "name userName",
        },
      })
      .lean();

    

    res.json(conversations);
  })
);

export default router;
