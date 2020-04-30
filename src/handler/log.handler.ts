import {getLogModelRepository} from "../model/log.model";
import {Context} from "koa";
import parsePaging from "../util/paging.util";

export const listLog = async (ctx: Context) => {
  const {offset, limit} = parsePaging(ctx);
  const repo = getLogModelRepository();
  const sql = "SELECT `log`.`*`, `app`.`name` AS `app_name`, `people`.`username` AS `personnel_username`, `people`.`real_name` AS `personnel_real_name` FROM `log` LEFT JOIN `personnel` AS `people` ON `people`.`id` = `log`.`personnel_id` LEFT JOIN `application` AS `app` ON `app`.`id` = `log`.`application_id` ORDER BY `log`.`created_at` DESC LIMIT " + offset + ", " + limit;
  const countSql = "SELECT COUNT(`log`.`id`) AS `count` FROM `log`";
  const result = await repo.query(sql);
  const count = await repo.query(countSql);
  ctx.success({result: result, count: count[0].count});
};
