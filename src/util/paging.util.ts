import {Context} from "koa";

type parsePagingDefine = (ctx: Context) => { offset: number, limit: number }
const parsePaging: parsePagingDefine = (ctx: Context) => {
  let {page, per_page} = ctx.query;
  page = parseInt(page || 1);
  per_page = parseInt(per_page || 20);
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  if (isNaN(per_page) || per_page < 1) {
    page = 20;
  }
  return {
    offset: (page - 1) * per_page,
    limit: per_page,
  };
};
export default parsePaging;
