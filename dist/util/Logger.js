import * as winston from "winston";
const { combine, timestamp, json, metadata, label } = winston.format;
const { format, transports } = winston;
export class Logger {
    static errorFilter = winston.format((info) => {
        return info.level === "error" ? info : false;
    });
    static infoFilter = winston.format((info) => {
        return info.level === "info" ? info : false;
    });
    static debugFilter = winston.format((info) => {
        return info.level === "debug" ? info : false;
    });
    _labelName;
    _localLogger;
    constructor(labelName) {
        this._labelName = labelName;
        this.initLogger();
    }
    setLogger(logger) {
        this._localLogger = logger;
    }
    getLabel() {
        return this._labelName;
    }
    initLogger() {
        this._localLogger = winston.createLogger({
            level: "debug",
            format: combine(label({ label: this._labelName }), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), 
            // Format the metadata object
            metadata({ fillExcept: ["message", "level", "timestamp", "label"] })),
            transports: [
                new transports.File({
                    filename: "logs/combined.log",
                    format: format.combine(timestamp(), format.json())
                }),
                new transports.File({
                    filename: "logs/app-error.log",
                    level: "error",
                    format: combine(Logger.errorFilter(), timestamp(), json()),
                }),
                new transports.File({
                    filename: "logs/app-info.log",
                    level: "info",
                    format: combine(Logger.infoFilter(), timestamp(), json()),
                }),
                new transports.File({
                    filename: "logs/app-debug.log",
                    level: "debug",
                    format: combine(Logger.debugFilter(), timestamp(), json()),
                }),
            ],
            exitOnError: false
        });
    }
    static createLogger(labelName) {
        return new Logger(labelName);
    }
    debug(message, metadata) {
        this._localLogger.debug(message, metadata);
    }
    info(message, metadata) {
        this._localLogger.info(message, metadata);
    }
    error(message, metadata) {
        this._localLogger.error(message, metadata);
    }
    warn(message, metadata) {
        this._localLogger.warn(message, metadata);
    }
    addInfoMessage(message, metadata) {
        this._localLogger.info(message, metadata);
    }
    addErrorMessage(message, metadata) {
        this._localLogger.error(message, metadata);
    }
    addWarnMessage(message, metadata) {
        this._localLogger.warn(message, metadata);
    }
    successful(message, metadata) {
        this._localLogger.info(message, metadata);
    }
}
//# sourceMappingURL=Logger.js.map