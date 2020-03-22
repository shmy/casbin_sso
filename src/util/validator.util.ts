import schema from "async-validator";

type validateDefine = (descriptor: any, source:any ) => Promise<[any, any]>
const validate: validateDefine = (descriptor: any, source:any ) => {
  return new Promise((resolve) => {
    const validator = new schema(descriptor);
    validator.validate(source, {first: true}).then((value) => {
      resolve([source, null])
    }).catch((err) => {
      resolve([null, err.errors ? err.errors[0].message : '参数错误'])
    });
  })
};
export default validate;
