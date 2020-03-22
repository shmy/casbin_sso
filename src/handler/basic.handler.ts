import {Context} from "koa";
import parsePaging from "../util/paging.util";
import validate from "../util/validator.util";
import {Repository, getRepository} from "typeorm";

type Descriptor = { [s: string]: any };
type GetRepository<T> = () => Repository<T>;
type GetDescriptor = () => Descriptor;
type GetInstance<T> = () => T;

export const mapAll = <T>(getRepository: GetRepository<T>) => {
  return async (ctx: Context) => {
    const repo = getRepository();
    const query = repo.createQueryBuilder().orderBy("`created_at`", "DESC");
    const result = await query.getMany();
    ctx.success(result);
  };
};

export const mapList = <T>(getRepository: GetRepository<T>, keyword?: string) => {
  return async (ctx: Context) => {
    const {offset, limit} = parsePaging(ctx);
    const repo = getRepository();
    let query = repo.createQueryBuilder().offset(offset).limit(limit).orderBy("`created_at`", "DESC");
    if (keyword && ctx.query.q) {
      query = query.where(`\`${keyword}\` LIKE :name`, {name: `%${ctx.query.q}%`});
    }
    const result = await query.getManyAndCount();
    ctx.success({result: result[0], count: result[1]});
  };
};

export const mapDetail = <T>(getRepository:GetRepository<T>) => {
  return async (ctx: Context) => {
    const {id} = ctx.params;
    const repo = getRepository();
    const record = await repo.findOne(id);
    if (!record) {
      ctx.fail("记录不存在");
      return;
    }
    ctx.success(record);
  };
};

export const mapCreate = <T>(getRepository: GetRepository<T>, getDescriptor: GetDescriptor, getInstance: GetInstance<T>) => {
  return async (ctx: Context) => {
    const params = {...ctx.request.body};
    const [values, msg] = await validate(getDescriptor(), params);
    if (msg) {
      ctx.fail(msg);
      return;
    }
    const entity = Object.assign(getInstance(), values);
    const repo = getRepository();
    const record = await repo.save(entity);
    ctx.success(await repo.findOne(record.id));
  };
};

export const mapUpdate = <T>(getRepository:GetRepository<T>, getDescriptor: GetDescriptor) => {
  return async (ctx: Context) => {
    const {id} = ctx.params;
    const params = {...ctx.request.body};
    const [values, msg] = await validate(getDescriptor(), params);
    if (msg) {
      ctx.fail(msg);
      return;
    }
    const repo = getRepository();
    const record = await repo.findOne(id);
    if (!record) {
      ctx.fail("记录不存在");
      return;
    }
    await repo.save(repo.merge(record, values));
    ctx.success(await repo.findOne(id));
  };
};

export const mapRemove = <T>(getRepository: GetRepository<T>) => {
  return async (ctx: Context) => {
    const {id} = ctx.params;
    const repo = getRepository();
    const record = await repo.findOne(id);
    if (!record) {
      ctx.fail("记录不存在");
      return;
    }
    await repo.delete(id);
    ctx.success(null);
  };
};
