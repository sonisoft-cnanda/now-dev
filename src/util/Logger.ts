import * as winston from "winston";
const { combine, timestamp, json, metadata, label} = winston.format;
const { format, transports } = winston;


export class Logger{

	static errorFilter = winston.format((info) => {
		return info.level === "error" ? info : false;
	  });

	  static infoFilter = winston.format((info) => {
		return info.level === "info" ? info : false;
	  });

	  static  debugFilter = winston.format((info) => {
		return info.level === "debug" ? info : false;
	  });

    _labelName:string;
	_localLogger:winston.Logger;

  _logLevel:string;

	public constructor(labelName:string, level:string = "info"){
		this._labelName = labelName;
    this._logLevel = level;
		this.initLogger();
	}

    public setLogger(logger:winston.Logger):void{
        this._localLogger = logger;
    }

    public getLabel(){
      return this._labelName;
    }

    private initLogger():void{
        this._localLogger = winston.createLogger({
            level: this._logLevel,
            format: combine(
                label({ label: this._labelName }),
                timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                // Format the metadata object
                metadata({ fillExcept: ["message", "level", "timestamp", "label"] })
            ),
            transports: [
              new transports.File({
                filename: "logs/combined.log",
                format: format.combine(timestamp(),format.json())
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

    public static createLogger(labelName:string):Logger{
        return new Logger(labelName);
    }

	public debug(message:string, metadata?:unknown):void {
		this._localLogger.debug(message, metadata);
	}

    public info ( message:string, metadata?:unknown) :void{
		this._localLogger.info(message, metadata);
	}

	public error ( message:string, metadata?:unknown) :void{
		this._localLogger.error(message, metadata);
	}

	public warn ( message:string, metadata?:unknown) :void{
		this._localLogger.warn(message, metadata);
	}

	public addInfoMessage ( message:string, metadata?:unknown) :void{
		this._localLogger.info(message, metadata);
	}

	public addErrorMessage ( message:string, metadata?:unknown) :void{
		this._localLogger.error(message, metadata);
	}

	public addWarnMessage ( message:string, metadata?:unknown) :void{
		this._localLogger.warn(message, metadata);
	}

  public successful(message:string, metadata?:unknown){
    this._localLogger.info(message, metadata);
  }

}


