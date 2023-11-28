import { Request, Response, Router } from "express";
import asyncHandler from "../middleware/AsyncHandler";
import { BadRequest, NotFound } from "../errors/Errors";
import Config from "../config";
import { created, deleted, updated } from "../lib/Responses";
import { validate } from "../middleware/Validator";
import { idValidater, meetingValidator } from "../lib/Validations";
import User from "../models/User";
import Meeting from "../models/Meeting";
import { v4 as uuid } from "uuid";
import scheduler from "node-schedule";
import { link } from "fs";

const router = Router();
const RES_NAME = "Meeting";

router.post(
  "/",
  validate(meetingValidator),
  asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find({ _id: { $in: req.body.users } }, { _id: 1 });

    // genrate a meeting link using uuid
    const meetingLink = `${Config.APP.HOST}/meeting/${uuid()}`;

    await Meeting.create({
      ...req.body,
      link: meetingLink,
      participants: users,
    });

    scheduler.scheduleJob(meetingLink, "", () => {
      // todo : send a notification to all the users that a new meeting is scheduled to mail
    });

    // todo : send a notification to all the users that a new meeting is scheduled to mail
    res.json({ msg: created(RES_NAME) });
  })
);

router.get(
  "/me",
  asyncHandler(async (req: any, res: Response) => {
    const { fromDate, toDate } = req.query as {
      fromDate: string;
      toDate: string;
    };

    // get all the meetings of the user
    const meetings = await Meeting.find({
      participants: {
        $elemMatch: {
          $eq: req.sender._id,
        },
      },
      scheduledAt: {
        $gte: new Date(fromDate || "2023-11-01"),
        $lte: new Date(toDate || "2023-12-01"),
      },
      completed: false,
    });

    res.json(meetings);
  })
);

router.get(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const meeting = await Meeting.findById(id, { agenda: 1, _id: 1 });

    if (!meeting) {
      throw new NotFound(`Meeting with id ${id} not found`);
    }

    res.json(meeting);
  })
);

router.put(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const update = await Meeting.updateOne({
      ...req.body,
      $where: { id },
    });

    if (update.upsertedCount === 0) {
      throw new NotFound("Meeting not found");
    }
    res.json({ message: updated(RES_NAME) });
  })
);

router.delete(
  "/:id",
  validate(idValidater),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const rowsDeleted = await Meeting.deleteOne({ where: { id } });
    if (rowsDeleted.deletedCount === 0) {
      throw new NotFound("Meeting not found");
    }
    res.json({ message: deleted(RES_NAME) });
  })
);

export default router;
