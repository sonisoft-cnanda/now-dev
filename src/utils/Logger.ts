
import * as winston from 'winston';


export class Logger{

    static #instance: Logger;

    //static logUri:vscode.Uri;

    static logFileName:string;
    static debugLogFileName:string;

    logger:winston.Logger;
         /**
     * The Singleton's constructor should always be private to prevent direct
     * construction calls with the `new` operator.
     */
    private constructor() {
     this.logger =  winston.createLogger({
        level: 'debug',
        format: winston.format.combine(
            winston.format.simple(),
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
        transports: [
            new winston.transports.File({
                level: 'info',
                //dirname: Logger.logUri.fsPath,
                filename: Logger.logFileName
            }),
            new winston.transports.File({
                level: 'debug',
                //dirname: Logger.logUri.fsPath,
                filename: Logger.debugLogFileName
            }),
        ]
        })
    }

    /**
     * The static getter that controls access to the singleton instance.
     *
     * This implementation allows you to extend the Singleton class while
     * keeping just one instance of each subclass around.
     */
    public static get instance(): Logger {
        if (!Logger.#instance) {
            Logger.#instance = new Logger();
        }

        return Logger.#instance;
    }
    
    //FIXME: Resolve this from vscode usage
    public static init(logUri:any){
       throw new Error("Not Implemented");
    }


}