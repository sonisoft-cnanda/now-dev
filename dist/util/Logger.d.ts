import * as winston from "winston";
export declare class Logger {
    static errorFilter: winston.Logform.FormatWrap;
    static infoFilter: winston.Logform.FormatWrap;
    static debugFilter: winston.Logform.FormatWrap;
    _labelName: string;
    _localLogger: winston.Logger;
    constructor(labelName: string);
    setLogger(logger: winston.Logger): void;
    getLabel(): string;
    private initLogger;
    static createLogger(labelName: string): Logger;
    debug(message: string, metadata?: unknown): void;
    info(message: string, metadata?: unknown): void;
    error(message: string, metadata?: unknown): void;
    warn(message: string, metadata?: unknown): void;
    addInfoMessage(message: string, metadata?: unknown): void;
    addErrorMessage(message: string, metadata?: unknown): void;
    addWarnMessage(message: string, metadata?: unknown): void;
    successful(message: string, metadata?: unknown): void;
}
