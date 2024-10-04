/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const isUndefined = (value) => value === undefined;
export const isNull = (value) => value === null;
export const isNil = (value) => isNull(value) || isUndefined(value);
export const isObject = (x) => x != null && typeof x === 'object';
export const isEmptyObject = (obj) => isObject(obj) && Object.keys(obj).length === 0;
//# sourceMappingURL=utils.js.map