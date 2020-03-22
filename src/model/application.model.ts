import {getRepository, Entity, Column} from "typeorm";
import BasicModel from "./basic.model";
import {getRequiredRule} from "../rule";

@Entity({name: "application"})
class ApplicationModel extends BasicModel {
  @Column({length: 32}) name: string;
  @Column({length: 255, default: ''}) intro: string;
  @Column({name: 'logo_url', length: 255, default: ''}) logo_url: string;
  @Column({length: 255}) url: string;
  @Column({default: true}) enable: boolean;
}
export const getApplicationModelRepository =  () => getRepository(ApplicationModel);
export const getApplicationModelInstance =  () => new ApplicationModel();
export const getApplicationModelDescriptor =  () => ({
  name: [getRequiredRule("应用名称")],
  logo_url: [getRequiredRule("应用Logo")],
  url: [getRequiredRule("应用地址")],
});
export default ApplicationModel;
