import Router from 'koa-joi-router';
import * as casbinHandler from "./handler/casbin.handler";
import * as applicationHandler from "./handler/application.handler";
import * as personnelHandler from "./handler/personnel.handler";
import * as RpcHandler from "./handler/rpc.handler";
import * as LoginHandler from "./handler/login.handler";
import uploadHandler from "./handler/upload.handler";
import authenticationMiddleware from "./middleware/authentication.middleware";
import rpcSSOMiddleware from "./middleware/rpc.middleware";

export const v1Router = Router().prefix("/api/v1");
v1Router
  .use(authenticationMiddleware)
  // 上传
  .post('/upload/file', ...uploadHandler)
  .post('/upload/base64', ...uploadHandler)
  // 应用
  .get('/app', applicationHandler.listApplication)
  .get('/app/:id', applicationHandler.detailApplication)
  .post('/app', applicationHandler.createApplication)
  .put('/app/:id', applicationHandler.updateApplication)
  // 应用角色
  .get('/app/:id/personnel', applicationHandler.listPersonnel)
  .post('/app/:id/personnel', applicationHandler.createPersonnel)
  .delete('/app/:id/personnel', applicationHandler.removePersonnel)
  // 应用人员
  .get('/app/:id/personnel/:pid/role', casbinHandler.getAllRoleByPersonnelFromDomain)
  .post('/app/:id/personnel/:pid/role', casbinHandler.addRoleToPersonnelFromDomain)
  .delete('/app/:id/personnel/:pid/role', casbinHandler.removeRoleToPersonnelFromDomain)
  // 角色
  .get('/initial_data', personnelHandler.getInitialDataHandler)
  .get('/policy/:id', casbinHandler.getAllPolicyFromDomain)
  .post('/policy/:id', casbinHandler.addPolicyToDomain)
  .put('/policy/:id/update', casbinHandler.updatePolicyFromDomain)
  .put('/policy/:id/remove', casbinHandler.removePolicyFromDomain)
  .get('/policy/:id/export', casbinHandler.exportPolicyFromDomain)
  .post('/policy/:id/import', casbinHandler.importPolicyToDomain)
  .get('/personnel', personnelHandler.listPersonnelHandler)
  .get('/personnel/option', personnelHandler.allOptionPersonnelHandler)
  .get('/personnel/apps', personnelHandler.listApplicationHandler)
  .post('/personnel', personnelHandler.createPersonnelHandler)
  .put('/personnel/:id', personnelHandler.updatePersonnelHandler)
  .del('/personnel/:id', personnelHandler.removePersonnelHandler);

export const rpcRouter = Router().prefix("/rpc/v1");
rpcRouter
  .use(rpcSSOMiddleware)
  .post("/check_action_by_token", RpcHandler.checkActionByToken)
  .get("/get_user_by_token", RpcHandler.getUserByTokenHandler)
  .get("/get_permissions_by_token", RpcHandler.getPermissionsByTokenHandler)
  .get("/get_users_by_ids", RpcHandler.getUsersByIdsHandler)
  .get("/get_users_paging", RpcHandler.getUsersPagingHandler);

export const router = Router();
router.post('/api/login', LoginHandler.loginHandler);
router.get('/api/sso/:id/:token', LoginHandler.ssoLoginHandler);
router.delete('/api/logout', authenticationMiddleware, LoginHandler.logoutHandler);
