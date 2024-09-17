import path from "path";
import { AppConfig } from "../conf/AppConfig";
import { FileUtil } from "../fs/util/FileUtil";
import { Logger } from "../util/Logger";



export class Project{

    private _scopeName:string;

    private _appSysId:string;

    private _rootDir:string;

    private _scriptDir:string;

    private _testDir:string;

    private _atfDir:string;

    private _logger:Logger;

    public constructor(
        rootDir:string, 
        scriptDir:string, 
        testDir:string, 
        atfDir:string){

        this._logger = new Logger("Project");
        this._rootDir = rootDir;
        this._scriptDir = scriptDir;
        this._testDir = testDir;
        this._atfDir = atfDir;
    }

    public setScopeName(scopeName:string) : void{
        this._scopeName = scopeName;
    }

    public setAppSysId(appSysId:string){
        this._appSysId = appSysId;
    }

   
    public async generateProjectStructure(){
        //Create/verify root directory
       if(! await FileUtil.isDirectory(this._rootDir)){
            await FileUtil.createFolder(this._rootDir);
       }
       //Create script source directory
        await FileUtil.createFolder(path.join(this._rootDir, this._scriptDir));

        //Create Test Directory
        if(! await FileUtil.isDirectory(path.join(this._rootDir,this._testDir))){
            await FileUtil.createFolder(path.join(this._rootDir,this._testDir));
        }

         //Create ATF Test Directory
        const atfPath:string = path.join(this._rootDir, this._testDir, this._atfDir);
       
         if(! await FileUtil.isDirectory(atfPath)){
            await FileUtil.createFolder(atfPath);
        }

         //Create config directory for maintained metadata config
         const configDataPath:string = path.join(this._rootDir, AppConfig.instance.configDataPath);
       
         if(! await FileUtil.isDirectory(configDataPath)){
            await FileUtil.createFolder(configDataPath);
        }



    }
}