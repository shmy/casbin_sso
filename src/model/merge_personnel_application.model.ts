import {getRepository, Entity, Column} from "typeorm";
import BasicModel from "./basic.model";

@Entity({name: "merge_personnel_application"})
class MergePersonnelApplicationModel extends BasicModel {
  @Column({type: 'bigint', name: 'application_id'}) application_id: number;
  @Column({type: 'bigint', name: 'personnel_id'}) personnel_id: number;
}
export const getMergePersonnelApplicationModelRepository =  () => getRepository(MergePersonnelApplicationModel);
export default MergePersonnelApplicationModel;
