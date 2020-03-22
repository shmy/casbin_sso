import {Context, Next} from "koa";
import {verifySSOToken} from "../util/token.util";
import {getPersonnelModelRepository} from "../model/personnel.model";
import {getMergePersonnelApplicationModelRepository} from "../model/merge_personnel_application.model";

const rpcSSOMiddleware = async (ctx: Context, next: Next) => {
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
  const [decoded, err] = await verifySSOToken(token);
  if (err) {
    ctx.fail("登录已过期", 401);
    return;
  }
  // 查询此人的token是否正确
  const repo = getMergePersonnelApplicationModelRepository();
  const record = await repo.findOne({where: {application_id: decoded.appId, personnel_id: decoded.personnelId}});
  if (!record) {
    ctx.fail("你的账户已在别处登录，请重新登录", 401);
    return;
  }
  const repo1 = getPersonnelModelRepository();
  const record1 = await repo1.findOne({where: {id: decoded.personnelId}});
  if (!record1) {
    ctx.fail("账户不存在", 401);
    return;
  }
  if (!record1.enable) {
    ctx.fail("账户已被锁定", 401);
    return;
  }
  // 此时token是SSO第三方应用的
  record1.token = token;
  ctx.authSSOUser = record1;
  ctx.authSSOAppId = record.application_id;
  await next();
};

export default rpcSSOMiddleware;
