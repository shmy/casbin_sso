import {Enforcer} from "casbin/lib/enforcer";
import {ConnectionOptions} from "typeorm";
import TypeORMAdapter from "typeorm-adapter";
import {newEnforcer} from "casbin";

class CasbinUtil {
  private static initialized: boolean = false;
  private static _enforcer: Enforcer = null;
  static get enforcer(): Enforcer {
    return CasbinUtil._enforcer;
  }

  static async initialize(config: ConnectionOptions, modelFileUrl: string) {
    if (!CasbinUtil.initialized) {
      const policy = await TypeORMAdapter.newAdapter(config);
      CasbinUtil._enforcer = await newEnforcer(modelFileUrl, policy);
      CasbinUtil.initialized = true;
      await CasbinUtil.enforcer.loadPolicy();
      CasbinUtil.enforcer.enableAutoSave(true);
      CasbinUtil.enforcer.enableLog(true);
      // console.log('CasbinUtil initialized');
    }
    return Promise.resolve();
  }
}
export default CasbinUtil;
