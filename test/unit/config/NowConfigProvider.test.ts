import { NowConfigProvider } from './../../../src/conf/NowConfigProvider';
import mockfs from 'mock-fs';
import fs from 'fs';
import JSON5 from 'json5';

import { ConfigProvider } from 'typed-config';

const jsConfig:any = {
    'fs':{
        rootDir:"src/script"
    }
};
const json:string = JSON5.stringify(jsConfig);



describe('NowConfigProvider', () => {
    beforeEach(() => {
        fs.writeFileSync(NowConfigProvider.CONFIG_FILE, json);
       });
     
    describe('load', () => {
        it('can parse and get config', async () => {
           const provider:NowConfigProvider = new NowConfigProvider();
            const c:any = provider.getConfigFile();
            expect(c).not.toBeNull();
            
        });
    });

    describe('get', () => {
        it('should return rootDir value', async () => {
           const provider:NowConfigProvider = new NowConfigProvider();
            const c:any = provider.getConfigFile();
            expect(c).not.toBeNull();
            expect(provider.get("fs")).not.toBeUndefined();
            expect(provider.get("fs")).not.toBeNull();
            expect(provider.get("fs.rootDir")).not.toBeUndefined();
            expect(provider.get("fs.rootDir")).not.toBeNull();
            expect(provider.get("fs.rootDir")).toBe(jsConfig.fs.rootDir);
        });

        it('should not return non-existant value', async () => {
            const provider:NowConfigProvider = new NowConfigProvider();
             const c:any = provider.getConfigFile();
             expect(c).not.toBeNull();
             expect(provider.get("fsx")).toBeNull();
             expect(provider.get("fsx.rootDir")).toBeNull();
         });

    });

    describe('has', () => {
        it('should have fs and rootDir value', async () => {
            const provider:NowConfigProvider = new NowConfigProvider();
             const c:any = provider.getConfigFile();
             expect(c).not.toBeNull();
             expect(provider.has("fs")).toBe(true);
             expect(provider.has("fs.rootDir")).toBe(true);
         });
 
         it('non existent value should return null', async () => {
             const provider:NowConfigProvider = new NowConfigProvider();
              const c:any = provider.getConfigFile();
              expect(c).not.toBeNull();
              expect(provider.has("fsx")).toBe(false);
              expect(provider.has("fsx.rootDir")).toBe(false);
          });
    });

    afterEach(() => {
        fs.rmSync(NowConfigProvider.CONFIG_FILE);
        })

});