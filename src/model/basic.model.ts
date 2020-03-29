import {BeforeInsert, BeforeUpdate, Column, PrimaryGeneratedColumn} from "typeorm";

class BasicModel {
  @PrimaryGeneratedColumn({type: "bigint"}) id: number;
  @Column({name: "created_at", type: "datetime"}) created_at: Date;
  @Column({name: "updated_at", type: "datetime"}) updated_at: Date;
  @BeforeInsert()
  createDate() {
    this.created_at = this.updated_at = new Date();
  }
  @BeforeUpdate()
  updateDate() {
    this.updated_at = new Date();
  }
}
export default BasicModel;
