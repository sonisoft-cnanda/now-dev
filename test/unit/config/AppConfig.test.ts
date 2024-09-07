import { NowConfigProvider } from './../../../src/conf/NowConfigProvider';
import { AppConfig } from './../../../src/conf/AppConfig';
import mockfs from 'mock-fs';
import fs from 'fs';
import JSON5 from 'json5';

import { ConfigProvider } from 'typed-config';
import path from 'path';

let jsConfig:any = {
    'fs':{
        rootDir:"./tmp",
        scriptSrc:"src/server"
    },
    logLevel: "warn",
    metaDataTypes:"sys_script_include,sys_script,sys_script_client"
};
let json:string = JSON5.stringify(jsConfig);

describe('AppConfig', () => {
    beforeEach(() => {
        fs.writeFileSync(NowConfigProvider.CONFIG_FILE, json);
       });
     
    describe('init', () => {
        it('should load AppConfig with NowConfigProvider', async () => {
           await AppConfig.instance.init();
           expect(AppConfig.instance.isReady).toBe(true);
           
        });

        it('should load values from config file', async () => {
            await AppConfig.instance.init();

            let scriptPath:string = path.join(jsConfig.fs.rootDir, jsConfig.fs.scriptSrc)

            expect(AppConfig.instance.isReady).toBe(true);
            expect(AppConfig.instance.logLevel).toBe('warn');
            expect(AppConfig.instance.rootDirectory).toBe(jsConfig.fs.rootDir);
            expect(AppConfig.instance.scriptSourceDirectory).toBe(jsConfig.fs.scriptSrc);
            expect(AppConfig.instance.getScriptSourceDirectory()).toBe(scriptPath);
            expect(AppConfig.instance.metaDataTypes).not.toBeNull();
            expect(Array.isArray(AppConfig.instance.metaDataTypes)).toBe(true);
            expect(AppConfig.instance.metaDataTypes.length).toBe(3);

         });
    });

  

   
    afterEach(() => {
        fs.rmSync(NowConfigProvider.CONFIG_FILE);
        })

});