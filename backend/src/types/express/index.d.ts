import 'express';
import { IUser } from '../../models/User';
import * as stream from 'stream';

// تعريف واجهة Multer
declare namespace Express {
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
      stream: stream.Readable;
    }
  }
}

declare module 'express' {
  interface Request {
    user?: IUser;
    file?: Express.Multer.File;
    files?: {
      [fieldname: string]: Express.Multer.File[]
    } | Express.Multer.File[];
  }
} 