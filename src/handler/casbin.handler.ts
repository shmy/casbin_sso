import {Context} from "koa";
import CasbinUtil from "../util/casbin.util";
import groupBy from "lodash.groupby";
import uniq from "lodash.uniq";

const mapPolicy = (items: any, field: string) => {
  const ret: any = [];
  const layer = groupBy(items, field);
  Object.keys(layer).forEach(key => {
    ret.push({
      id: Math.random().toString(36).substr(2),
      [field]: key,
      children: layer[key].map(item => {
        item.id = Math.random().toString(36).substr(2);
        return item;
      }),
    });
  });
  return ret;
};

export const getAllPolicyFromDomain = async (ctx: Context) => {
  const appId = ctx.params.id;
  const result = await CasbinUtil.enforcer.getFilteredPolicy(1, appId);
  const arrayify = result.map((item, index) => {
    return {
      id: Math.random().toString(36).substr(2),
      subject: item[0],
      domain: item[1],
      object: item[2],
      action: item[3],
    };
  });
  // const layer = mapPolicy(arrayify, 'subject').map((item: any) => {
  //   item.children = mapPolicy(item.children, 'object');
  //   return item;
  // });
  ctx.success(arrayify);
};

export const addPolicyToDomain = async (ctx: Context) => {
  const appId = ctx.params.id;
  const data = ctx.request.body;
  const result = await CasbinUtil.enforcer.addPolicy(data.subject, appId, data.object, data.action);
  ctx.success(result);
};
export const removePolicyFromDomain = async (ctx: Context) => {
  const appId = ctx.params.id;
  const data = ctx.request.body;
  const result = await CasbinUtil.enforcer.removePolicy(data.subject, appId, data.object, data.action);
  ctx.success(result);
};
export const updatePolicyFromDomain = async (ctx: Context) => {
  const appId = ctx.params.id;
  const {before, after} = ctx.request.body;
  // 两者相同 直接返回
  if (before.subject === after.subject && before.object === after.object && before.action === after.action) {
    ctx.success(true);
    return;
  }
  let result = await CasbinUtil.enforcer.addPolicy(after.subject, appId, after.object, after.action);
  // 如果添加失败 直接返回
  if (result === false) {
    ctx.success(false);
    return;
  }
  result = await CasbinUtil.enforcer.removePolicy(before.subject, appId, before.object, before.action);
  // 如果删除失败
  if (result === false) {
    // 删除之前添加的
    await CasbinUtil.enforcer.removePolicy(after.subject, appId, after.object, after.action);
  }
  ctx.success(result);
};

// 获取某个App下的所有角色
// export const getAllRoleFromDomain = async (ctx: Context) => {
//   const appId = ctx.params.id;
//   const result = await CasbinUtil.enforcer.getFilteredPolicy(1, appId);
//   const roles = result.map(item => item[0]);
//   ctx.success(uniq(roles));
// };

// 获取获取某个App下某个用户的拥有角色
export const getAllRoleByPersonnelFromDomain = async (ctx: Context) => {
  const appId = ctx.params.id;
  const personnelId = ctx.params.pid;
  const has = await CasbinUtil.enforcer.getRolesForUser(personnelId, appId);
  const _all = await CasbinUtil.enforcer.getFilteredPolicy(1, appId);
  const all = uniq(_all.map(item => item[0]));
  const result = all.map(item => {
    return {
      label: item,
      value: has.indexOf(item) !== -1
    };
  });
  ctx.success(result);
};
export const addRoleToPersonnelFromDomain = async (ctx: Context) => {
  const appId = ctx.params.id;
  const personnelId = ctx.params.pid;
  const name = ctx.request.body.name;
  const result = await CasbinUtil.enforcer.addRoleForUser(personnelId, name, appId);
  // await CasbinUtil.enforcer.savePolicy();
  ctx.success(result);
};
export const removeRoleToPersonnelFromDomain = async (ctx: Context) => {
  const appId = ctx.params.id;
  const personnelId = ctx.params.pid;
  const name = ctx.query.name;
  const result = await CasbinUtil.enforcer.deleteRoleForUser(personnelId, name, appId);
  // await CasbinUtil.enforcer.savePolicy();
  ctx.success(result);
};
