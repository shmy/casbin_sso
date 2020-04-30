import {Context} from "koa";
import {getPersonnelModelRepository} from "../model/personnel.model";
import {generateToken, verifyToken} from "../util/token.util";
import Bcrypt from "bcrypt";
import {getMergePersonnelApplicationModelRepository} from "../model/merge_personnel_application.model";
import {getApplicationModelRepository} from "../model/application.model";
import {pushLoginLog} from "../util/log.util";
import AES from 'crypto-js/aes';
import CasbinUtil from "../util/casbin.util";
import R from "ramda";
import {siteStaticBaseUrl} from "../env";

const btoa = (text: string) => {
  return Buffer.from(text).toString('base64')
};
const atob = (base64: string) => {
  return Buffer.from(base64, 'base64').toString('ascii');
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

export const logoutHandler = async (ctx: Context) => {
  const authUser = ctx.authUser;
  const reps = getPersonnelModelRepository();
  await reps.update({id: authUser.id}, {token: ''});
  ctx.success(null);
};

const springboardTemplate = (url: string, profile: string) => `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><title>登录中...</title><style>html,body{height:100%;width:100%;margin:0;padding:0;font-family:"Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif}#app{height:200px;width:200px;position:absolute;top:50%;left:50%;text-align:center;-webkit-transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);transform:translate(-50%,-50%);display:none}#form{display:none}#loading{height:60px;width:60px;-webkit-animation:rotate 3s linear infinite;animation:rotate 3s linear infinite}@-webkit-keyframes rotate{from{-webkit-transform:rotate(0deg);transform:rotate(0deg)}to{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes rotate{from{-webkit-transform:rotate(0deg);transform:rotate(0deg)}to{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}</style></head><body><div id="app"> <svg id="loading" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"> <path style="fill:#303C42;" d="M256,0C114.844,0,0,114.844,0,256s114.844,256,256,256s256-114.844,256-256S397.156,0,256,0z"/> <path style="fill:#E53935;" d="M488.331,224.708c-13.906,22.245-31.16,38.313-58.904,54.333 c-51.931,29.984-119.801,22.059-153.536-14.546C335.392,252.591,384,189.021,384,117.333c0-24.835-3.132-44.77-9.522-63.553 C435.297,89.555,478.552,151.824,488.331,224.708z"/> <path style="fill:#FF8F00;" d="M344.986,38.971c12.378,23.234,17.681,46.24,17.681,78.362c0,60.03-40.854,115.113-89.507,125.94 c8.337-24.855,7.716-53.863-2.441-82.409c-12.573-35.333-38.385-66.333-70.813-85.052c-21.539-12.438-40.389-19.697-59.889-23.548 C174.271,32.686,213.801,21.333,256,21.333C287.497,21.333,317.518,27.667,344.986,38.971z"/> <path style="fill:#FFCA28;" d="M112.882,70.449c26.154,0.944,48.665,7.852,76.358,23.842c28.104,16.229,50.479,43.094,61.385,73.729 c8.288,23.294,9.022,46.622,2.839,66.566C213.41,188.96,133.99,178.624,71.906,214.479c-21.634,12.488-37.397,25.236-50.51,40.279 C21.79,179.77,57.63,113.165,112.882,70.449z"/> <path style="fill:#7CB342;" d="M23.669,287.292c13.906-22.245,31.16-38.313,58.904-54.333 c51.94-29.993,119.805-22.057,153.538,14.546C176.609,259.408,128,322.979,128,394.667c0,24.835,3.132,44.77,9.522,63.553 C76.703,422.445,33.448,360.176,23.669,287.292z"/> <path style="fill:#1E88E5;" d="M167.014,473.029c-12.378-23.234-17.681-46.24-17.681-78.362c0-60.03,40.854-115.113,89.507-125.94 c-8.337,24.855-7.716,53.863,2.441,82.409c12.573,35.333,38.385,66.333,70.813,85.052c21.539,12.438,40.389,19.697,59.889,23.548 c-34.254,19.578-73.784,30.931-115.983,30.931C224.503,490.667,194.482,484.333,167.014,473.029z"/> <path style="fill:#AB47BC;" d="M399.118,441.551c-26.154-0.944-48.665-7.852-76.358-23.842 c-28.104-16.229-50.479-43.094-61.385-73.729c-8.293-23.31-9.021-46.652-2.823-66.604c23.689,26.995,61.036,41.75,100.583,41.75 c27.313,0,55.594-6.958,80.958-21.604c21.634-12.488,37.396-25.236,50.51-40.277C490.21,332.232,454.37,398.835,399.118,441.551z"/> <path style="opacity:0.1;" d="M256,21.333C126.396,21.333,21.333,126.397,21.333,256 S126.396,490.667,256,490.667c129.603,0,234.667-105.063,234.667-234.667S385.603,21.333,256,21.333z M234.667,426.667 c-106.04,0-192-85.963-192-192c0-106.039,85.96-192,192-192c106.039,0,192,85.961,192,192 C426.667,340.704,340.706,426.667,234.667,426.667z"/> <circle style="opacity:0.1;fill:#FFFFFF;" cx="224" cy="213.333" r="138.667"/> <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="-45.5784" y1="639.555" x2="-23.8278" y2="629.4138" gradientTransform="matrix(21.3333 0 0 -21.3333 996.3334 13791.667)"> <stop offset="0" style="stop-color:#FFFFFF;stop-opacity:0.2"/> <stop offset="1" style="stop-color:#FFFFFF;stop-opacity:0"/> </linearGradient> <path style="fill:url(#SVGID_1_);" d="M256,0C114.844,0,0,114.844,0,256s114.844,256,256,256s256-114.844,256-256S397.156,0,256,0z" /> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg><h3>正在登录中...</h3></div><form id="form" method="post" action="${url}"> <input name="profile" type="hidden" value="${profile}"></form> <script>document.getElementById('form').submit();setTimeout(()=>{document.getElementById('app').style.display='block';},500);</script> </body></html>`;
const loginFailedTemplate = (message: string) => `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><title>登录失败</title><style>html,body{height:100%;width:100%;margin:0;padding:0;font-family:"Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif}#app{height:200px;width:200px;position:absolute;top:50%;left:50%;text-align:center;-webkit-transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);transform:translate(-50%,-50%)}#icon{height:60px;width:60px}</style></head><body><div id="app"><h3>登录失败</h3> <svg id="icon" height="512" viewBox="0 0 256 256" width="512" xmlns="http://www.w3.org/2000/svg"><rect fill="#cecece" height="191.333" rx="15.327" width="223.345" x="16.327" y="12.544"/><path d="m26.327 188.55v-160.679a15.327 15.327 0 0 1 15.328-15.327h-10a15.327 15.327 0 0 0 -15.328 15.327v160.679a15.327 15.327 0 0 0 15.327 15.327h10a15.327 15.327 0 0 1 -15.327-15.327z" fill="#afafaf"/><path d="m229.673 188.55v-160.679a15.327 15.327 0 0 0 -15.327-15.327h10a15.327 15.327 0 0 1 15.327 15.327v160.679a15.327 15.327 0 0 1 -15.327 15.327h-10a15.327 15.327 0 0 0 15.327-15.327z" fill="#e2e2e2"/><path d="m239.673 27.871a15.327 15.327 0 0 0 -15.327-15.327h-192.691a15.327 15.327 0 0 0 -15.328 15.327v26.673h223.346z" fill="#f8af23"/><path d="m41.655 12.544h-10a15.327 15.327 0 0 0 -15.328 15.327v26.673h10v-26.673a15.327 15.327 0 0 1 15.328-15.327z" fill="#f87023"/><path d="m214.345 12.544h10a15.327 15.327 0 0 1 15.327 15.327v26.673h-10v-26.673a15.327 15.327 0 0 0 -15.327-15.327z" fill="#f8d323"/><circle cx="43.688" cy="33.544" fill="#f46275" r="7"/><circle cx="70.65" cy="33.544" fill="#f46275" r="7"/><circle cx="97.612" cy="33.544" fill="#f46275" r="7"/><rect fill="#f46275" height="10.667" rx="5.333" width="99.24" x="120.073" y="28.669"/><circle cx="128" cy="152.357" fill="#f46275" r="80.126"/><path d="m57.874 152.357a80.118 80.118 0 0 1 75.126-79.957c-1.655-.1-3.319-.171-5-.171a80.126 80.126 0 1 0 0 160.251c1.681 0 3.345-.069 5-.171a80.118 80.118 0 0 1 -75.126-79.952z" fill="#f43075"/><path d="m198.126 152.357a80.118 80.118 0 0 0 -75.126-79.957c1.655-.1 3.319-.171 5-.171a80.126 80.126 0 1 1 0 160.251c-1.681 0-3.345-.069-5-.171a80.118 80.118 0 0 0 75.126-79.952z" fill="#f48875"/><g fill="#3f3679"><path d="m27.323 241.956h-18a1.5 1.5 0 1 0 0 3h18a1.5 1.5 0 1 0 0-3z"/><path d="m246.68 241.956h-18a1.5 1.5 0 0 0 0 3h18a1.5 1.5 0 0 0 0-3z"/><path d="m218.479 241.956h-180.958a1.5 1.5 0 0 0 0 3h180.958a1.5 1.5 0 0 0 0-3z"/><path d="m9.32 233.983h237.36a1.5 1.5 0 0 0 0-3h-96.809a81.77 81.77 0 0 0 40.114-25.605h34.36a16.846 16.846 0 0 0 16.827-16.827v-160.68a16.846 16.846 0 0 0 -16.827-16.827h-192.69a16.846 16.846 0 0 0 -16.827 16.827v160.68a16.846 16.846 0 0 0 16.827 16.827h34.36a81.77 81.77 0 0 0 40.114 25.605h-96.809a1.5 1.5 0 1 0 0 3zm8.508-206.112a13.843 13.843 0 0 1 13.827-13.827h192.691a13.843 13.843 0 0 1 13.827 13.827v25.173h-220.345zm13.827 174.507a13.843 13.843 0 0 1 -13.827-13.827v-132.507h220.345v132.507a13.843 13.843 0 0 1 -13.827 13.827h-31.911a81.626 81.626 0 1 0 -128.869 0zm17.719-50.021a78.626 78.626 0 1 1 78.626 78.626 78.715 78.715 0 0 1 -78.626-78.626z"/><path d="m43.687 25.044a8.5 8.5 0 1 0 8.5 8.5 8.51 8.51 0 0 0 -8.5-8.5zm0 14a5.5 5.5 0 1 1 5.5-5.5 5.507 5.507 0 0 1 -5.5 5.5z"/><path d="m70.65 25.044a8.5 8.5 0 1 0 8.5 8.5 8.51 8.51 0 0 0 -8.5-8.5zm0 14a5.5 5.5 0 1 1 5.5-5.5 5.507 5.507 0 0 1 -5.5 5.5z"/><path d="m97.612 25.044a8.5 8.5 0 1 0 8.5 8.5 8.51 8.51 0 0 0 -8.5-8.5zm0 14a5.5 5.5 0 1 1 5.5-5.5 5.507 5.507 0 0 1 -5.5 5.5z"/><path d="m213.979 27.169h-88.573a6.833 6.833 0 1 0 0 13.667h88.573a6.833 6.833 0 0 0 0-13.667zm0 10.667h-88.573a3.833 3.833 0 1 1 0-7.667h88.573a3.833 3.833 0 0 1 0 7.667z"/><path d="m101.319 152.016a5.5 5.5 0 0 0 7.778-7.777l-8.449-8.449 8.449-8.449a5.5 5.5 0 0 0 -7.778-7.777l-8.448 8.448-8.448-8.448a5.5 5.5 0 0 0 -7.778 7.777l8.449 8.449-8.449 8.449a5.5 5.5 0 1 0 7.778 7.777l8.448-8.448z"/><path d="m170.907 135.79 8.449-8.449a5.5 5.5 0 1 0 -7.777-7.777l-8.449 8.449-8.449-8.449a5.5 5.5 0 1 0 -7.777 7.777l8.449 8.449-8.449 8.449a5.5 5.5 0 1 0 7.777 7.777l8.449-8.449 8.449 8.449a5.5 5.5 0 0 0 7.777-7.777z"/><path d="m128 173.439a30.65 30.65 0 0 0 -27.038 16.184 5.5 5.5 0 1 0 9.691 5.2 19.679 19.679 0 0 1 34.693 0 5.5 5.5 0 0 0 9.691-5.2 30.65 30.65 0 0 0 -27.037-16.184z"/></g></svg><p>${message}</p></div></body></html>`;

export const ssoLoginHandler = async (ctx: Context) => {
  let {id, token} = ctx.params;
  token = atob(token);
  const [decoded, err] = await verifyToken(token);
  if (err) {
    ctx.body = loginFailedTemplate("请重新登录");
    return;
  }
  // 查询此人的token是否正确
  const repo = getPersonnelModelRepository();
  const record = await repo.findOne({where: {token, id: decoded.id}});
  if (!record) {
    pushLoginLog(ctx, record.id, id, false);
    ctx.body = loginFailedTemplate("你的账户已在别处登录，请重新登录");
    return;
  }
  const mReps = getMergePersonnelApplicationModelRepository();
  const record1 = await mReps.findOne({where: {application_id: id, personnel_id: record.id}});
  if (!record1) {
    pushLoginLog(ctx, record.id, id, false);
    ctx.body = loginFailedTemplate("你没有此系统的权限");
    return;
  }
  const record2 = await getApplicationModelRepository().findOne({where: {id}});
  if (!record2) {
    pushLoginLog(ctx, record.id, id, false);
    ctx.body = loginFailedTemplate("此应用不存在");
    return;
  }
  if (!record2.enable) {
    pushLoginLog(ctx, record.id, id, false);
    ctx.body = loginFailedTemplate("此应用已关闭");
    return;
  }
  const roles = await CasbinUtil.enforcer.getRolesForUser(record.id.toString(), id);
  let permissions: any = [];
  if (roles.length > 0) {
    permissions = await getApplicationModelRepository().query("SELECT `v2` as `object`, `v3` as `action` FROM `casbin_rule` WHERE `ptype` = ? AND `v0` IN (?) AND `v1` = ?", ["p", roles, id]);
    permissions = R.uniqBy(R.props(['object', 'action']), permissions);
  }
  let profileStr = JSON.stringify(Object.assign({}, record, {permissions, roles, avatar_url: siteStaticBaseUrl + '/' + record.avatar_url}));
  console.log('---JSON.stringify---:', profileStr);
  profileStr = AES.encrypt(profileStr, 'test1').toString();
  console.log('---AES.encrypt---:', profileStr);
  profileStr = btoa(profileStr);
  console.log('---Base64---:', profileStr);
  pushLoginLog(ctx, record.id, id);
  ctx.body = springboardTemplate(record2.url, profileStr);
};
