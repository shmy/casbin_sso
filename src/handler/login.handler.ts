import {Context} from "koa";
import {getPersonnelModelRepository} from "../model/personnel.model";
import {generateSSOToken, generateToken, verifyToken} from "../util/token.util";
import Bcrypt from "bcrypt";
import {getMergePersonnelApplicationModelRepository} from "../model/merge_personnel_application.model";
import {getApplicationModelRepository} from "../model/application.model";
import {pushLoginLog} from "../util/log.util";

const btoa = (text: string) => {
  return Buffer.from(text).toString('base64')
};
const atob = (base64: string) => {
  return Buffer.from(base64, 'base64').toString('ascii');
};
const buildErrorHtml = (message: string) => {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>登录失败</title>
</head>
<body>
  <div style="text-align: center">
    <h3>${message}</h3>
    <button onclick="window.close()">关闭窗口</button>
  </div>
</body>
</html>`;
};
export const loginHandler = async (ctx: Context) => {
  const {username, password} = ctx.request.body;
  const reps = getPersonnelModelRepository();
  const record = await reps.findOne({select: ['id', 'password', 'enable'], where: {username}});
  if (!record) {
    ctx.fail("用户不存在");
    return;
  }
  if (!record.enable) {
    ctx.fail("用户已锁定，无法登录");
    return;
  }
  const same = Bcrypt.compareSync(password, record.password);
  if (!same) {
    ctx.fail("密码错误");
    return;
  }
  const [token, err] = await generateToken(record.id);
  if (err) {
    ctx.fail("登录失败");
    return;
  }
  delete record.password;
  record.token = token;
  await reps.save(record);
  ctx.success({token});
};
export const ssoLoginHandler = async (ctx: Context) => {
  let {id, token} = ctx.params;
  token = atob(token);
  const [decoded, err] = await verifyToken(token);
  if (err) {
    ctx.fail(err.message, 401);
    return;
  }
  // 查询此人的token是否正确
  const repo = getPersonnelModelRepository();
  const record = await repo.findOne({where: {token, id: decoded.id}});
  if (!record) {
    pushLoginLog(ctx, record.id, id, false);
    ctx.body = buildErrorHtml("你的账户已在别处登录，请重新登录");
    return;
  }
  const mReps = getMergePersonnelApplicationModelRepository();
  const record1 = await mReps.findOne({where: {application_id: id, personnel_id: record.id}});
  if (!record1) {
    pushLoginLog(ctx, record.id, id, false);
    ctx.body = buildErrorHtml("你没有此系统的权限");
    return;
  }
  const record2 = await getApplicationModelRepository().findOne({where: {id}});
  if (!record2) {
    pushLoginLog(ctx, record.id, id, false);
    ctx.body = buildErrorHtml("此应用不存在");
    return;
  }
  if (!record2.enable) {
    pushLoginLog(ctx, record.id, id, false);
    ctx.body = buildErrorHtml("此应用已关闭");
    return;
  }
  const [_token, _err] = await generateSSOToken(record2.id, record.id);
  if (_err) {
    pushLoginLog(ctx, record.id, id, false);
    ctx.body = buildErrorHtml("登录失败");
    return;
  }
  record1.token = _token;
  await mReps.save(record1);
  pushLoginLog(ctx, record.id, id);
  ctx.status = 301;
  ctx.redirect(`${record2.url}?at=${btoa(_token)}`);
};
export const logoutHandler = async (ctx: Context) => {
  const authUser = ctx.authUser;
  const reps = getMergePersonnelApplicationModelRepository();
  await reps.update( {personnel_id: authUser.id}, {token: ''});
  ctx.success(null);
};
