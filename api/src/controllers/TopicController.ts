import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Topic, { ITopic } from "../models/Topic";
import { BadRequest, NotFound } from "../errors/Errors";
import Config from "../config";
import { created, deleted, updated } from "../lib/Responses";
import { validate } from "../middleware/Validator";
import {
  idValidater,
  loginValidator,
  topicValidator,
} from "../lib/Validations";
import User from "../models/User";
import Message from "../models/Message";

const router = Router();
const RES_NAME = "Topic";

router.post(
  "/",
  validate(topicValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find({ _id: { $in: req.body.users } }, { _id: 1 });

    if (!users) {
      throw new BadRequest("Users not found");
    }

    const topic = await Topic.findOne({ name: req.body.name });

    if (topic) {
      throw new BadRequest(`Topic with name ${req.body.name} already exists`);
    }

    await Topic.create({
      name: req.body.name,
      description: req.body.description,
      users,
    });

    // todo : send a notification to all the users that a new topic is created and update the ui accordingly

    res.json({ msg: created(RES_NAME) });
  })
);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const topics = await Topic.find({}, { name: 1, _id: 1 });
    res.json(topics);
  })
);

router.get(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const topic = await Topic.findById(id, { name: 1, _id: 1 });

    if (!topic) {
      throw new NotFound(`Topic with id ${id} not found`);
    }

    res.json(topic);
  })
);

router.put(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const update = await Topic.updateOne({
      ...req.body,
      $where: { id },
    });

    if (update.upsertedCount === 0) {
      throw new NotFound("Topic not found");
    }
    res.json({ message: updated(RES_NAME) });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const rowsDeleted = await Topic.deleteOne({ where: { id } });
    if (rowsDeleted.deletedCount === 0) {
      throw new NotFound("Topic not found");
    }
    res.json({ message: deleted(RES_NAME) });
  })
);

export default router;
