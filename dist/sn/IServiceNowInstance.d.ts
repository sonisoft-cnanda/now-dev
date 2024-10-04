export interface IServiceNowInstance {
    isDefault(): boolean;
    getHost(): string;
    getUserName(): string;
    getAlias(): string;
    getPassword(): string;
}
