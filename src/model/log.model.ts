import {getRepository, Entity, Column, BeforeInsert, BeforeUpdate} from "typeorm";
import BasicModel from "./basic.model";
import {lookup} from "geoip-lite";

// 登录日志
@Entity({name: "log"})
class LogModel extends BasicModel {
  @Column({type: 'tinyint', name: 'successful'}) successful: boolean; // 1. 成功 2. 失败
  @Column({type: 'bigint', name: 'personnel_id'}) personnel_id: number;
  @Column({type: 'bigint', name: 'application_id'}) application_id: number;
  @Column({name: 'ip'}) ip: string;
  @Column({name: 'user_agent'}) userAgent: string;
  @Column({name: 'region'}) region: string;

  @BeforeInsert()
  @BeforeUpdate()
  async computedColumns() {
    this.region = '';
    if (this.ip) {
      const p = lookup(this.ip);
      if (p) {
        this.region = p.country + p.city;
      }
    }
  }
}

export const getLogModelRepository = () => getRepository(LogModel);
export const getLogModelInstance = () => new LogModel();

export default LogModel;
