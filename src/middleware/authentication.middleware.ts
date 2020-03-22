import {Context, Next} from "koa";
import {verifyToken} from "../util/token.util";
import {getPersonnelModelRepository} from "../model/personnel.model";

const authenticationMiddleware = async (ctx: Context, next: Next) => {
  const authorization = ctx.headers.authorization;
  if (!authorization) {
    ctx.fail("请携带Token", 401);
    return;
  }
  if (!/^Bearer /.test(authorization)) {
    ctx.fail("authorization 格式错误", 401);
    return;
  }
  const token = authorization.split(" ")[1];
  const [decoded, err] = await verifyToken(token);
  if (err) {
    ctx.fail("登录已过期", 401);
    return;
  }
  // 查询此人的token是否正确
  const repo = getPersonnelModelRepository();
  const record = await repo.findOne({where: {token, id: decoded.id}});
  if (!record) {
    ctx.fail("你的账户已在别处登录，请重新登录", 401);
    return;
  }
  if (!record.enable) {
    ctx.fail("你的账户已被锁定", 401);
    return;
  }
  ctx.authUser = record;
  await next();
};

export default authenticationMiddleware;
