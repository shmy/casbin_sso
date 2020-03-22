import {Context} from "koa";
import CasbinUtil from "../util/casbin.util";
import {getConnection} from "typeorm";
import parsePaging from "../util/paging.util";

export const getPermissionsByTokenHandler = async (ctx: Context) => {
  const authSSOUser = ctx.authSSOUser;
  const authSSOAppId = ctx.authSSOAppId;
  const _roles = await getConnection().query("SELECT `v1` FROM `casbin_rule` WHERE `ptype` = ? AND `v0` = ? AND `v2` = ?", ["g", authSSOUser.id, authSSOAppId]);
  const roles = _roles.map((item: any) => item.v1);
  if (roles.length === 0) {
    ctx.success([]);
    return;
  }

  const _permissions = await getConnection().query("SELECT distinct `v2`, `v3` FROM `casbin_rule` WHERE `ptype` = ? AND `v0` IN (?) AND `v1` = ?", ["p", roles, authSSOAppId]);
  const permissions = _permissions.map((item: any) => {
    return {
      object: item.v2,
      action: item.v3,
    };
  });
  ctx.success(permissions);
};

export const getUsersPagingHandler = async (ctx: Context) => {
  const {offset, limit} = parsePaging(ctx);
  const q = ctx.query.q;
  const authSSOAppId = ctx.authSSOAppId;
  const getSqlString = (q: string) => {
    let query = "";
    if (q) {
      query = " AND `people`.`keyword` LIKE ?"
    }
    return "SELECT `people`.* FROM personnel as people LEFT JOIN merge_personnel_application as m ON m.personnel_id = people.id LEFT JOIN application as app ON m.application_id = app.id WHERE app.id = ? " + query + " limit ?, ? ";
  };
  const getSqlCountString = (q: string) => {
    let query = "";
    if (q) {
      query = " AND `people`.`keyword` LIKE ?"
    }
    return "SELECT count(`people`.`id`) as `count` FROM personnel as people LEFT JOIN merge_personnel_application as m ON m.personnel_id = people.id LEFT JOIN application as app ON m.application_id = app.id WHERE app.id = ? " + query;
  };
  const getSqlParams = (q: string) => {
    let params: any[] = [offset, limit];
    if (q) {
      params.unshift(`%${q}%`);
    }
    params.unshift(authSSOAppId);
    return params;
  };
  const result = await getConnection().query(getSqlString(q), getSqlParams(q));
  const count = await getConnection().query(getSqlCountString(q), getSqlParams(q));
  ctx.success({
    result: result.map((user: any) => {
      user.enable = user.enable === 1;
      delete user.token;
      delete user.password;
      delete user.keyword;
      return user;
    }), count: count[0].count
  });
};

export const getUserByTokenHandler = (ctx: Context) => {
  const authSSOUser = ctx.authSSOUser;
  ctx.success(authSSOUser);
};

export const getUsersByIdsHandler = async (ctx: Context) => {
  const _ids = ctx.query.ids;
  let ids = [];
  if (_ids) {
    ids = _ids.split(',');
  }
  const users = await getConnection().query("SELECT * FROM `personnel` WHERE `id` IN (?) order by field(id, ?);", [ids, ids]);
  ctx.success(users.map((user: any) => {
    user.enable = user.enable === 1;
    delete user.token;
    delete user.password;
    delete user.keyword;
    return user;
  }));
};

export const checkActionByToken = async (ctx: Context) => {
  const authSSOUser = ctx.authSSOUser;
  const authSSOAppId = ctx.authSSOAppId;
  const ps = ctx.request.body;
  if (!Array.isArray(ps)) {
    ctx.fail("参数错误");
    return;
  }
  await CasbinUtil.enforcer.loadPolicy();
  // console.log(await CasbinUtil.enforcer.getPolicy())
  // console.log(await CasbinUtil.enforcer.getGroupingPolicy())
  for (const p of ps) {
    const result = await CasbinUtil.enforcer.enforce(authSSOUser.id, authSSOAppId, p[0], p[1]);
    if (!result) {
      ctx.success(false);
      return;
    }
  }
  ctx.success(true);
};
