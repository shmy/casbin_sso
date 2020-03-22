import isLength from 'validator/lib/isLength';

export const getRequiredRule = (label: string) => {
  return {required: true, message: label + " 不能为空"};
};

export const getMinLengthRule = (label: string, min: number) => {
  return {validator: (_: any, value: string) => isLength(value, {min}), message: `${label} 长度不能小于 ${min} 位`};
};
export const getMaxLengthRule = (label: string, max: number) => {
  return {validator: (_: any, value: string) => isLength(value, {max}), message: `${label} 长度不能大于 ${max} 位`};
};
export const getBetweenLengthRule = (label: string, min: number, max: number) => {
  return {
    validator: (_: any, value: string) => isLength(value, {min, max}),
    message: `${label} 的长度需要在 ${min} 至 ${max} 位之间`
  };
};
export const getBetweenLengthOptionalRule = (label: string, min: number, max: number) => {
  return {
    validator: (_: any, value: string) => {
      if (!value) {
        return true;
      }
      return isLength(value, {min, max})
    },
    message: `${label} 的长度需要在 ${min} 至 ${max} 位之间`
  };
};
