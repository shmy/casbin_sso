import {Context} from "koa";
import {getConnection} from "typeorm";
import CasbinUtil from "../util/casbin.util";
import groupBy from "lodash.groupby";
import uniq from "lodash.uniq";

const mapPolicy = (items: any, field: string, parent = '') => {
  const ret: any = [];
  const layer = groupBy(items, field);
  Object.keys(layer).forEach(key => {
    let children = layer[key].map(item => {
      item[`$$${field}`] = item[field];
      delete item[field];
      return item;
    });
    const layer2 = groupBy(children, 'action');
    children = Object.keys(layer2).map(key => {
      const first = layer2[key][0];
      return {
        [`$$${field}`]: first[`$$${field}`],
        action: key,
      };
    });
    ret.push({
      id: key,
      [field]: key,
      parent,
      children,
    });
  });
  return ret;
};

export const getAllPolicyFromDomain = async (ctx: Context) => {
  const appId = ctx.params.id;
  const roles = await getConnection().query("SELECT DISTINCT `v0` as `subject` FROM `casbin_rule` WHERE `ptype` = ? AND `v1` = ?", ["p", appId]);
  // const layer = mapPolicy(roles, 'subject').map((item: any) => {
  //   item.children = mapPolicy(item.children, 'object', item.subject);
  //   return item;
  // });
  ctx.success(roles);
};

// 获取某个App下的所有的权限
export const getAllObjectWithAction = async (ctx: Context) => {
  const appId = ctx.params.id;
  const roles = await getConnection().query("SELECT `id`, `v2` as `object`, `v3` as `action` FROM `casbin_rule` WHERE `ptype` = ? AND `v1` = ?", ["p", appId]);
  const layer = mapPolicy(roles, 'object');
  ctx.success(layer);
};

// 获取某个App下某个角色的所有的权限
export const getAllObjectWithActionByRole = async (ctx: Context) => {
  const appId = ctx.params.id;
  const role = ctx.query.role;
  const result = await getConnection().query("SELECT `id`, `v2` as `object`, `v3` as `action` FROM `casbin_rule` WHERE `ptype` = ? AND `v0` = ? AND `v1` = ?", ["p", role, appId]);
  ctx.success(result.map((item: any) => {
    return `${item.object} ${item.action}`;
  }));
};
// 更新某个App下某个角色的权限
export const updateObjectWithActionByRole = async (ctx: Context) => {
  const appId = ctx.params.id;
  const {subject, deleted, created} = ctx.request.body;
  if (Array.isArray(deleted)) {
    for (const item of deleted) {
      await CasbinUtil.enforcer.removePolicy(subject, appId, item.object, item.action);
    }
  }
  if (Array.isArray(created)) {
    for (const item of created) {
      await CasbinUtil.enforcer.addPolicy(subject, appId, item.object, item.action);
    }
  }
  ctx.success(null);
};
export const removeRoleFromDomain = async (ctx: Context) => {
  const role = ctx.query.role;
  const appId = ctx.params.id;
  await CasbinUtil.enforcer.removeFilteredGroupingPolicy(1, role, appId);
  await CasbinUtil.enforcer.removeFilteredPolicy(0, role, appId);
  ctx.success(null);
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

export const exportPolicyFromDomain = async (ctx: Context) => {
  const appId = ctx.params.id;
  const roles = await getConnection().query("SELECT `v0` as `subject`, `v2` as `object`, `v3` as `action` FROM `casbin_rule` WHERE `ptype` = ? AND `v1` = ?", ["p", appId]);
  ctx.success(roles);
};
export const importPolicyToDomain = async (ctx: Context) => {
  const appId = ctx.params.id;
  const body = ctx.request.body;
  if (!Array.isArray(body)) {
    ctx.fail('导入数据格式不正确');
    return;
  }
  const total = body.length;
  let successfulCount = 0;
  for (const data of body) {
    const result = await CasbinUtil.enforcer.addPolicy(data.subject, appId, data.object, data.action);
    if (result) {
      successfulCount ++;
    }
  }
  ctx.success({
    total,
    successfulCount
  });
};
