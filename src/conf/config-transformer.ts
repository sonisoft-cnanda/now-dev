import { ValueTransform } from "typed-config/dist/src/types";


export function split2(splitChar: string): ValueTransform {
    return function (target: any, prop: string, value: any): string[] {
      return (value as string).split(splitChar);
    };
  }

  export function map2(transform) {
    return function mapTransform(target:any, propName:string, value:any) {
        let result = Promise.resolve([]);
        value.forEach((value) => {
            result = result.then((results) => Promise.resolve(transform(target, propName, value))
                .then((result) => results.concat(result)));
        });
        return result;
    };
}

export function trim2(target: any, prop: string, value: any) {
    const stringValue = value.toString();
    return stringValue.match(/^\s*(.*?)\s*$/m)[1];
}