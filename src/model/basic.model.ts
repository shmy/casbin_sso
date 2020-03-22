import {CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn} from "typeorm";

class BasicModel {
  @PrimaryGeneratedColumn({type: "bigint"}) id: number;
  @CreateDateColumn({name: "created_at", type: "timestamp"}) created_at: Date;
  @UpdateDateColumn({name: "updated_at", type: "timestamp"}) updated_at: Date;
}
export default BasicModel;
