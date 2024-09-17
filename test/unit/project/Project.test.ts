

import { FileUtil } from './../../../src/fs/util/FileUtil';
import { Project } from './../../../src/project/Project';
import { AppConfig } from './../../../src/conf/AppConfig';
import fs, { RmDirOptions } from 'fs';
import JSON5 from 'json5';
import { NowConfigProvider } from '../../../src/conf/NowConfigProvider';
import path from 'path';

const jsConfig:any = {
    'fs':{
        rootDir:"./tmp",
        scriptSrc:"src/script"
    },
    logLevel: "debug"
};
const json:string = JSON5.stringify(jsConfig);



describe('Project', () => {
    let rootDir = "";
    let scriptDir = "";


    beforeEach(async () => {
        fs.writeFileSync(NowConfigProvider.CONFIG_FILE, json);

        await AppConfig.instance.init();

        rootDir = AppConfig.instance.rootDirectory;
        scriptDir = AppConfig.instance.scriptSourceDirectory;
    });
     
    describe('should generate default project structure', () => {
        it('can create project structure', async () => {
            const p:Project = new Project(
                AppConfig.instance.rootDirectory, 
                AppConfig.instance.scriptSourceDirectory, 
                AppConfig.instance.testDirectory, 
                AppConfig.instance.atfTestDirectory);
            await p.generateProjectStructure();
            const configDataPath:string = path.join(AppConfig.instance.rootDirectory, AppConfig.instance.configDataPath);
            expect(FileUtil.isDirectorySync(jsConfig.fs.rootDir)).toBe(true);
            expect(FileUtil.isDirectorySync(path.join(AppConfig.instance.rootDirectory,AppConfig.instance.scriptSourceDirectory))).toBe(true);
            expect(FileUtil.isDirectorySync(path.join(AppConfig.instance.rootDirectory,AppConfig.instance.testDirectory))).toBe(true);
            expect(FileUtil.isDirectorySync(path.join(AppConfig.instance.rootDirectory, AppConfig.instance.testDirectory, AppConfig.instance.atfTestDirectory))).toBe(true);
            expect(FileUtil.isDirectorySync(configDataPath)).toBe(true);
          
        }, 100000);
    });

  

   
    afterEach(async () => {
        if(FileUtil.isDirectorySync(jsConfig.fs.rootDir)){
            fs.rmSync(jsConfig.fs.rootDir, { recursive: true, force: true });
        }
        fs.rmSync(NowConfigProvider.CONFIG_FILE);
        
    })

});