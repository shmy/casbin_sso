// @ts-ignore
import multer from '@koa/multer';
// @ts-ignore
import mkdirp from 'mkdirp';
import nanoid from 'nanoid';
import Path from 'path';
import dayjs from 'dayjs';
import {Context} from "koa";

// 这里的相对路径就是根目录
const SAVE_PATH_PREFIX = Path.join('./public/');
const SAVE_PATH_PREFIX_REGEXP = new RegExp(`^${SAVE_PATH_PREFIX}`);
const UPLOAD_DIRNAME = 'uploads';
const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    const path = Path.join(SAVE_PATH_PREFIX, UPLOAD_DIRNAME, dayjs().format("YYYY/MM/d"));
    mkdirp.sync(path);
    cb(null, path);
  },
  filename(ctx: Context, file: any, cb: any) {
    const { ext } = Path.parse(file.originalname);
    cb(null, nanoid() + ext);
  }
});
const upload = multer({storage});
const multerMiddleware = upload.single('file');
const uploadHandler = async (ctx: Context) => {
  const {path} = ctx.file;
  ctx.success(path.replace(SAVE_PATH_PREFIX_REGEXP, ''));
};
export default [multerMiddleware, uploadHandler];
