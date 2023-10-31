import { Schema, model, Model } from "mongoose";
import { IUser } from "./User";

const MODEL_NAME = "meetings";

// Message Schema
export interface IMeeting {
  _id: Schema.Types.ObjectId;
  participants: IUser["_id"][];
  link: string;
  scheduledAt: Date;
  completed: boolean;
  agenda: string;
  createdAt: Date;
  updatedAt: Date;
}

// message schema methods
interface IMeetingMethods {
  toJson: () => IMeeting;
}

// message model
type IMeetingModel = Model<IMeeting, {}, IMeetingMethods>;

const meetingSchema = new Schema<IMeeting, IMeetingModel, IMeetingMethods>(
  {
    link: {
      type: String,
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    agenda: {
      type: String,
      required: true,
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "users",
      default: [],
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default model<IMeeting, IMeetingModel>(MODEL_NAME, meetingSchema);
