import {createConnection, ConnectionOptions} from "typeorm";
import Koa from 'koa';
import Path from 'path';
import KoaBodyParser from 'koa-bodyparser';
import KoaStatic from 'koa-static';
import KoaMount from 'koa-mount';
import {authRouter, rpcRouter, v1Router} from "./router";
import CasbinUtil from "./util/casbin.util";
import ApplicationModel from "./model/application.model";
import MergePersonnelApplicationModel from "./model/merge_personnel_application.model";
import PersonnelModel, {initializeAdmin} from "./model/personnel.model";
import dotenv from "dotenv";
import LogModel from "./model/log.model";

dotenv.config({path: Path.join(__dirname, '../.env')});

const {MYSQL_HOST, MYSQL_PORT, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_DATABASE} = process.env;

const modelFileUrl = Path.join(__dirname, '../model.conf');
const config: ConnectionOptions = {
  type: "mysql",
  host: MYSQL_HOST,
  port: parseInt(MYSQL_PORT),
  username: MYSQL_USERNAME,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
};
;(async () => {
  await createConnection({
    ...config,
    name: "default",
    entities: [
      MergePersonnelApplicationModel,
      ApplicationModel,
      PersonnelModel,
      LogModel,
    ],
    logging: false,
    logger: "advanced-console",
    synchronize: true,
    bigNumberStrings: false,
  });
  await CasbinUtil.initialize(config, modelFileUrl);
  await initializeAdmin();
  const app = new Koa();
  app.proxy = true;
  app
    .use(KoaMount('/static', KoaStatic(Path.join(__dirname, '../public'))))
    .use(KoaBodyParser({
      onerror: function (err, ctx) {
        ctx.throw({msg: "参数解析错误"}, 400);
      }
    }))
    .use(async (ctx, next) => {
      ctx.success = (data: any) => {
        ctx.body = data
      };
      ctx.fail = (msg: string, status = 400) => {
        ctx.status = status;
        ctx.body = {msg}
      };
      try {
        await next();
      } catch (err) {
        ctx.fail(err.message);
      }
    })
    .use(v1Router.middleware())
    .use(rpcRouter.middleware())
    .use(authRouter.middleware())
    .use(ctx => {
      ctx.status = 404;
      ctx.body = {msg: 'not found'}
    });

  app.listen(3000);
})();
