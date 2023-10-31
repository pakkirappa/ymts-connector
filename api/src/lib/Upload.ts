import multer from "multer";
import { v4 as uuid } from "uuid";
import path from "path";
import { FOLDER_NAMES } from "../constants";
import Config from "../config";

const attachmentsPath = path.join(
  __dirname,
  FOLDER_NAMES.PUBLIC,
  FOLDER_NAMES.ATTACHMENTS
);

const storage = multer.diskStorage({
  destination: attachmentsPath,
  filename: (req, file, cb) => {
    // check file size
    const fileSizeInMb = file.size / (1024 * 1024);
    if (fileSizeInMb > Config.APP.MAX_FILE_SIZE) {
      cb(new Error("File size too large"), "");
      return;
    }
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuid()}${fileExtension}`;
    cb(null, fileName);
  },
});

export const attachments = multer({ storage });
