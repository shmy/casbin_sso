import {mapCreate, mapList, mapRemove, mapUpdate} from "./basic.handler";
import PersonnelModel, {
  getPersonnelModelDescriptor,
  getPersonnelModelInstance,
  getPersonnelModelRepository, getPersonnelModelUpdateDescriptor
} from "../model/personnel.model";
import {Context} from "koa";
import {getApplicationModelRepository} from "../model/application.model";

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
export const createPersonnelHandler = mapCreate<PersonnelModel>(getPersonnelModelRepository, getPersonnelModelDescriptor, getPersonnelModelInstance);
export const updatePersonnelHandler = mapUpdate<PersonnelModel>(getPersonnelModelRepository, getPersonnelModelUpdateDescriptor);
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
