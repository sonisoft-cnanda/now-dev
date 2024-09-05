import path from 'path';
import { FluentConverter } from '../../src/fluent/FluentConverter'
import { Context } from '@servicenow/sdk-build/dist/build-core/plugins/Context';

const SECONDS = 1000;


describe('FluentConverter Integration Test', () => {
   
    describe('convert metadata file', () => {
       

        it('should convert metadata xml file to fluent', async () => {
            let appDir:string = path.resolve("test/assets/test_app");
            let xmlDir:string = path.resolve("test/assets/test_app/xmlMetadataImport");
            let converter:FluentConverter = new FluentConverter(appDir, xmlDir);
           let c:Context = await converter.convertMetadataFileToFluent("sys_rest_message_fn_1d0bb9de1b7f0610132a55392a4bcb73.xml", true);
            

           expect(c).not.toBeNull();
           expect(c.handledXmls).not.toBeNull();
          
        
        
        }, 700 * SECONDS)

    });

    xdescribe('convert application directory metadata', () => {
       

        xit('defined test', async () => {
          

        }, 700 * SECONDS)

    });

 
    
   
})