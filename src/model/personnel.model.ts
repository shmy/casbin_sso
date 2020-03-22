import {getRepository, Entity, Column, BeforeInsert, BeforeUpdate} from "typeorm";
import BasicModel from "./basic.model";
import Bcrypt from "bcrypt";
import {getBetweenLengthOptionalRule, getBetweenLengthRule, getRequiredRule} from "../rule";

const saltRounds = 10;
const hashPassword = (password: string) => Bcrypt.hash(password, saltRounds);
@Entity({name: "personnel"})
class PersonnelModel extends BasicModel {

  @Column({length: 32}) username: string;
  @Column({length: 128, select: false}) password: string;
  @Column({name: 'avatar_url', length: 255, default: ''}) avatar_url: string;
  @Column({name: 'real_name', length: 16, default: ''}) real_name: string;
  @Column({length: 32, default: ''}) phone: string;
  @Column({length: 64, default: ''}) email: string;
  @Column({default: true}) enable: boolean;
  @Column({type: 'text', select: false}) keyword: string;
  @Column({type: 'text', default: null, select: false}) token: string;
  @Column({default: false}) admin: boolean;

  @BeforeInsert()
  async transformPassword() {
    this.password = await hashPassword(this.password);
  }

  @BeforeInsert()
  @BeforeUpdate()
  async computedColumns() {
    this.keyword = (this.username || '') + (this.real_name || '') + (this.phone || '') + (this.email || '');
    if (!this.keyword) {
      this.keyword = undefined;
    }
    if (!this.password) {
      this.password = undefined;
    } else {
      this.password = await hashPassword(this.password);
    }
  }
}
export const getPersonnelModelRepository =  () => getRepository(PersonnelModel);
export const getPersonnelModelInstance =  () => new PersonnelModel();
export const getPersonnelModelDescriptor =  () => ({
  username: [getRequiredRule("用户名"), getBetweenLengthRule("用户名", 4, 16)],
  password: [getRequiredRule("密码"), getBetweenLengthRule("密码", 4, 32)],
});
export const getPersonnelModelUpdateDescriptor =  () => ({
  username: [getRequiredRule("用户名"), getBetweenLengthRule("用户名", 4, 16)],
  password: [getBetweenLengthOptionalRule("密码", 4, 32)],
});
export const initializeAdmin = async () => {
  const repo = getPersonnelModelRepository();
  const record = await repo.findOne({where: {id: 1}});
  if (!record) {
    const entity = new PersonnelModel();
    entity.username = "admin";
    entity.password = "admin";
    entity.real_name = "admin";
    entity.admin = true;
    await repo.save(entity);
  }
};
export default PersonnelModel;
