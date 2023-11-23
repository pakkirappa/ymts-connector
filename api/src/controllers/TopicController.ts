import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import Topic, { ITopic } from "../models/Topic";
import { BadRequest, NotFound } from "../errors/Errors";
import { created, deleted, updated } from "../lib/Responses";
import { validate } from "../middleware/Validator";
import {
  addRemoveTopicValidator,
  idValidater,
  topicValidator,
} from "../lib/Validations";
import User from "../models/User";
import { param } from "express-validator";

const router = Router();
const RES_NAME = "Topic";

router.post(
  "/:name/add/",
  validate(addRemoveTopicValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params as { name: string };

    const { names } = req.query as { names: string[] };

    const users = await User.find(
      { userName: { $in: names } },
      { _id: 1 }
    ).lean();

    if (!users) {
      throw new BadRequest("Users not found");
    }

    if (users.length === 0) {
      throw new BadRequest("No users provided");
    }

    const topic = await Topic.findOne({ name });

    if (!topic) {
      throw new NotFound(`Topic with name ${name} not found`);
    }

    const userIds = users.map((u) => u._id);

    // add the users from the topic
    topic.users = [...topic.users, ...userIds];

    await topic.save();

    let msg = "";

    for (const user of users) {
      msg += `${user.name} is added to the topic ${topic.name}\n`;
    }

    res.json({ msg });
  })
);

router.delete(
  "/:name/remove/",
  validate(addRemoveTopicValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params as { name: string };

    const { names } = req.body as { names: string[] };

    const users = await User.find(
      { userName: { $in: names } },
      { _id: 1 }
    ).lean();

    if (!users) {
      throw new BadRequest("Users not found");
    }

    if (users.length === 0) {
      throw new BadRequest("No users provided");
    }

    const topic = await Topic.findOne({ name });

    if (!topic) {
      throw new NotFound(`Topic with nane ${name} not found`);
    }

    // remove the users from the topic
    topic.users = topic.users.filter((u) => {
      return !users.some((user) => user._id.toString() === u.toString());
    });

    await topic.save();

    let msg = "";

    for (const user of users) {
      msg += `${user.name} is removed from the topic ${topic.name}\n`;
    }

    res.json({ msg });
  })
);

router.post(
  "/",
  validate(topicValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find(
      { userName: { $in: req.body.users } },
      { _id: 1 }
    );

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
  "/:name/users",
  validate([param("name").notEmpty().withMessage("Name is required")]),
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params as { name: string };
    const topic = await Topic.findOne({ name }, { name: 1, _id: 1, users: 1 });
    if (!topic) {
      throw new NotFound(`Topic with name ${name} not found`);
    }
    const users = await User.find(
      { _id: { $in: topic.users } },
      { name: 1, _id: 1 }
    ).lean();

    res.json(users);
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
  "/:name",
  validate([
    param("name")
      .notEmpty()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be a string"),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;

    const topic = await Topic.findOne({ name });
    if (!topic) {
      throw new NotFound("Topic not found");
    }

    if (topic.messages.length > 0) {
      throw new BadRequest("Cannot delete a topic with messages");
    }
    await topic.deleteOne(); // delete the topic
    res.json({ message: deleted(RES_NAME) });
  })
);

// // delete route with id
// router.delete(
//   "/:id",
//   validate(idValidater),
//   asyncHandler(async (req: Request, res: Response) => {
//     const { id } = req.params;
//     const rowsDeleted = await Topic.deleteOne({ where: { id } });
//     if (rowsDeleted.deletedCount === 0) {
//       throw new NotFound("Topic not found");
//     }
//     res.json({ message: deleted(RES_NAME) });
//   })
// );

export default router;
