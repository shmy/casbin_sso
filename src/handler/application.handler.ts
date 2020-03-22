import {mapAll, mapCreate, mapDetail, mapUpdate} from "./basic.handler";

import ApplicationModel, {
  getApplicationModelDescriptor, getApplicationModelInstance,
  getApplicationModelRepository
} from "../model/application.model";
import {Context} from "koa";
import {getConnection} from "typeorm";
import MergePersonnelApplicationModel, {getMergePersonnelApplicationModelRepository} from "../model/merge_personnel_application.model";
import PersonnelModel from "../model/personnel.model";

export const listApplication = mapAll<ApplicationModel>(getApplicationModelRepository);
export const detailApplication = mapDetail<ApplicationModel>(getApplicationModelRepository);
export const createApplication = mapCreate<ApplicationModel>(getApplicationModelRepository, getApplicationModelDescriptor, getApplicationModelInstance);
export const updateApplication = mapUpdate<ApplicationModel>(getApplicationModelRepository, getApplicationModelDescriptor);

export const listPersonnel = async (ctx: Context) => {
  const {id} = ctx.params;
  const repo = getApplicationModelRepository();
  const result = await repo.query("SELECT people.* FROM personnel as people LEFT JOIN merge_personnel_application as m ON m.personnel_id = people.id LEFT JOIN application as app ON m.application_id = app.id WHERE app.id = ?", [id]);
  ctx.success(result.map((item: PersonnelModel) => {
    item.password = undefined;
    return item;
  }));
};
export const createPersonnel = async (ctx: Context) => {
  let {id: applicationId} = ctx.params;
  let {id: personnelId} = ctx.request.body;
  await getConnection().transaction(async transactionalEntityManager => {
    const _m = await transactionalEntityManager.findOne(MergePersonnelApplicationModel, {
      where: {
        personnel_id: personnelId,
        application_id: applicationId
      }
    });
    if (_m) {
      ctx.fail('记录已存在');
      return;
    }
    const _p = await transactionalEntityManager.findOne(PersonnelModel, {where: {id: personnelId}});
    if (!_p) {
      ctx.fail('用户不存在');
      return;
    }
    const _a = await transactionalEntityManager.findOne(ApplicationModel, {where: {id: applicationId}});
    if (!_a) {
      ctx.fail('应用不存在');
      return;
    }
    const entity = new MergePersonnelApplicationModel();
    entity.application_id = +applicationId;
    entity.personnel_id = +personnelId;
    ctx.success(await transactionalEntityManager.save(entity));
  });
};
export const removePersonnel = async (ctx: Context) => {
  const {id: applicationId} = ctx.params;
  const {id: personnelId} = ctx.query;
  const repo = getMergePersonnelApplicationModelRepository();
  const entity = new MergePersonnelApplicationModel();
  entity.application_id = applicationId;
  entity.personnel_id = personnelId;
  await repo.delete(entity);
  ctx.success(null);
};
