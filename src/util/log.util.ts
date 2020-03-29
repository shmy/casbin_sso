import {Context, Next} from "koa";
import LogModel, {getLogModelRepository} from "../model/log.model";

export const pushLoginLog = async (ctx: Context, pId: number, Aid: number, successful = true) => {
  const repo = getLogModelRepository();
  const entity = new LogModel();
  entity.personnel_id = pId;
  entity.application_id = Aid;
  entity.successful = successful;
  entity.ip = ctx.ip;
  entity.userAgent = ctx.header['user-agent'];
  try {
    await repo.save(entity);
  } catch (err) {
    console.log(err)
    //
  }
};
