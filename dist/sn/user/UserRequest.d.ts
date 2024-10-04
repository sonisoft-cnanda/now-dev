import { IServiceNowInstance } from "../IServiceNowInstance.js";
import { SNRequestBase } from "../SNRequestBase.js";
import { IUser } from "./model/IUser.js";
export declare class UserRequest extends SNRequestBase {
    constructor(instance: IServiceNowInstance);
    getUser(userId: string): Promise<IUser>;
}
