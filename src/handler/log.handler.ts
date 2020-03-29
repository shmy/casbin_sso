import {mapList} from "./basic.handler";
import LogModel, {getLogModelRepository} from "../model/log.model";

export const listLog = mapList<LogModel>(getLogModelRepository);
