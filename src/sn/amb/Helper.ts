export const isUndefined = (value:any) => value === undefined;
export const isNull = (value:any) => value === null;
export const isNil = (value:any) => isNull(value) || isUndefined(value);
export const isObject = (x:any) => x != null && typeof x === 'object';
export const isEmptyObject = (obj:any) => isObject(obj) && Object.keys(obj).length === 0;