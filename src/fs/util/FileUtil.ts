import fs from 'fs-extra';
import { isNil } from '../../amb/Helper';
import { Logger } from '../../util/Logger';
import { join } from 'path';


export class FileUtil{

    static _logger = new Logger("FileUtil");

   

    public static async createFile(fPath:string, data: string | NodeJS.ArrayBufferView, options?: fs.WriteFileOptions) : Promise<void>{
        if(!isNil(options)){
            try{
                await fs.unlink(fPath);
            }catch(e){

            }
        }else
            options = {};
        
        await fs.writeFile(fPath, data, options);
    }

    public static createFileSync(fPath:string, data: string | NodeJS.ArrayBufferView, options?: fs.WriteFileOptions) : void{
        if(!isNil(options)){
            try{
                 fs.unlinkSync(fPath);
            }catch(e){

            }
        }else
            options = {};
        
         fs.writeFileSync(fPath, data, options);
    }

    public static async deleteFile(fPath:string) : Promise<void>{
        await fs.unlink(fPath);
    }

    public static deleteFileSync(fPath:string) : void{
        fs.unlinkSync(fPath);
    }

    public static async createFolder(folderPath:string) : Promise<void>{
        await fs.ensureDir(folderPath);
    }

    public static createFolderSync(folderPath:string) : void{
        fs.ensureDirSync(folderPath);
    }

    public static async deleteFolder(folderPath:string) : Promise<void>{
        await fs.unlink(folderPath);
    }

    public static deleteFolderSync(folderPath:string) : void{
        fs.unlink(folderPath);
    }

    public static async isDirectory(dName:string) : Promise<boolean>{
        try {
           
            return (await fs.lstat(dName)).isDirectory();
        }
        catch (e) {
            return false;
        }
    }

    public static isDirectorySync(dName:string){
        try {
           
            return fs.lstatSync(dName).isDirectory();
        }
        catch (e) {
            return false;
        }
    }

    public static deleteFolderContentSync(dirPath:string) : void {
        const folderContents:string[] = fs.readdirSync(dirPath);
        for (let n = 0; n < folderContents.length; n++) {
            try {
                const filePath:string = folderContents[n];
                fs.unlinkSync(join(dirPath, filePath));
            }
            catch (e) {
                FileUtil._logger.error(e);
            }
        }
    }

    public static async deleteFolderContent(dirPath:string) : Promise<void> {
        const folderContents:string[] = await fs.readdir(dirPath);
        for (let n = 0; n < folderContents.length; n++) {
            try {
                const filePath:string = folderContents[n];
                await fs.unlink(join(dirPath, filePath));
            }
            catch (e) {
                FileUtil._logger.error(e);
            }
        }
    }

   public static recreateDirectorySync(dirPath:string) {
     
        if (process.platform === "win32") {
                FileUtil.deleteFolderRecursiveSync(dirPath);
        }
        else {
            fs.removeSync(dirPath);
        }
        fs.mkdirSync(dirPath);
       
    }

    public static async recreateDirectory(dirPath:string) {
     
        if (process.platform === "win32") {
             await FileUtil.deleteFolderRecursive(dirPath);
        }
        else {
            await fs.remove(dirPath);
        }
        await fs.mkdir(dirPath);
   
    }

    public static deleteFolderRecursiveSync(dirPath:string) : void{
        try {
            if (fs.existsSync(dirPath)) {
                fs.readdirSync(dirPath).forEach( (val, index) => {
                    const curPath = join(dirPath, val);
                    if (FileUtil.isDirectorySync(curPath)) {
                        FileUtil.deleteFolderRecursiveSync(curPath);
                    }
                    else {
                        FileUtil.deleteFileSync(curPath);
                    }
                    
                });
                fs.rmdirSync(dirPath);
            }
        }
        catch (e) {
            FileUtil._logger.error(e);
        }
    }

    public static async deleteFolderRecursive(dirPath:string) : Promise<void>{
        try {
            if (fs.existsSync(dirPath)) {
                fs.readdirSync(dirPath).forEach( async (val, index) => {
                    const curPath = join(dirPath, val);
                    if (await FileUtil.isDirectory(curPath)) {
                        await FileUtil.deleteFolderRecursive(curPath);
                    }
                    else {
                        await FileUtil.deleteFile(curPath);
                    }
                    
                });
                await fs.rmdir(dirPath);
            }
        }
        catch (e) {
            FileUtil._logger.error(e);
        }
    }

    public static isDirectoryEmptySync(dirPath:string) : boolean{
        const dirContents:string[] = fs.readdirSync(dirPath);
        return !dirContents || dirContents.length === 0;
    }

    public static isValidFileName =  (fileName:string) => /^[^\\/:\*\?"<>\|]+$/.test(fileName);
}