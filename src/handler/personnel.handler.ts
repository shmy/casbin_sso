import {mapList, mapRemove} from "./basic.handler";
import {getConnection} from "typeorm";
import PersonnelModel, {
  getPersonnelModelDescriptor,
  getPersonnelModelInstance,
  getPersonnelModelRepository, getPersonnelModelUpdateDescriptor
} from "../model/personnel.model";
import {Context} from "koa";
import {getApplicationModelRepository} from "../model/application.model";
import validate from "../util/validator.util";

export const allOptionPersonnelHandler = async (ctx: Context) => {
  const repo = getPersonnelModelRepository();
  const query = repo.createQueryBuilder("p").select(['p.id', 'p.username', 'p.real_name'], ).orderBy("`created_at`", "DESC");
  const result = await query.getMany();
  ctx.success(result.map(item => {
    let label = item.username;
    if (item.real_name) {
      label = `${item.real_name} (${item.username})`;
    }
    return {
      label,
      value: item.id,
    };
  }));
};
export const listPersonnelHandler = mapList<PersonnelModel>(getPersonnelModelRepository, 'keyword');
export const createPersonnelHandler = async (ctx: Context) => {
  const params = ctx.request.body;
  const [values, msg] = await validate(getPersonnelModelDescriptor(), params);
  if (msg) {
    ctx.fail(msg);
    return;
  }
  const repo = getPersonnelModelRepository();
  let record = await repo.findOne({where: {username: values.username}});
  if (record) {
    ctx.fail('用户名已存在');
    return;
  }
  const entity = Object.assign(getPersonnelModelInstance(), values);
  record = await repo.save(entity);
  ctx.success(await repo.findOne(record.id));
};
export const updatePersonnelHandler = async (ctx: Context) => {
  const {id} = ctx.params;
  const params = ctx.request.body;
  const [values, msg] = await validate(getPersonnelModelUpdateDescriptor(), params);
  if (msg) {
    ctx.fail(msg);
    return;
  }

  await getConnection().transaction(async transactionalEntityManager => {
    const record = await transactionalEntityManager.findOne(PersonnelModel, id);
    if (!record) {
      ctx.fail("记录不存在");
      return;
    }
    if (values.username !== record.username) {
      // 更换了用户名
      const record = await transactionalEntityManager.findOne(PersonnelModel, {where: {username: values.username}});
      if (record) {
        ctx.fail("用户名已存在");
        return;
      }
    }
    const entity = transactionalEntityManager.merge(PersonnelModel, record, values);
    await transactionalEntityManager.save(entity);
    ctx.success(await transactionalEntityManager.findOne(PersonnelModel, id));
  });
};
export const removePersonnelHandler = mapRemove<PersonnelModel>(getPersonnelModelRepository);
export const getInitialDataHandler = async (ctx: Context) => {
  let menu = [
    {
      path: '/app_list',
      name: '应用列表',
      icon: 'HomeOutlined',
    }
  ];
  if (ctx.authUser.admin) {
    menu.unshift(...[
      {
        path: '/application',
        name: '应用管理',
        icon: 'HomeOutlined',
      },
      {
        path: '/personnel',
        name: '人员管理',
        icon: 'HomeOutlined',
      },
      {
        path: '/log',
        name: '登录日志',
        icon: 'HomeOutlined',
      }
    ]);
  }
  ctx.success({
    user: ctx.authUser,
    menu,
  });
};
export const listApplicationHandler = async (ctx: Context) => {
  const authUser = ctx.authUser;
  const repo = getApplicationModelRepository();
  const result = await repo.query("SELECT app.* FROM application as app LEFT JOIN merge_personnel_application as m ON m.application_id = app.id LEFT JOIN personnel as people ON m.personnel_id = people.id WHERE people.id = ?", [authUser.id]);
  ctx.success(result);
};
