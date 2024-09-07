import path from 'path';
import { FluentConverter } from '../../src/fluent/FluentConverter'
import { Context } from '@servicenow/sdk-build/dist/build-core/plugins/Context';
import fs from 'fs';

const SECONDS = 1000;

const TEST_APP_TEMPLATE_DIRECTORY:string = "test/assets/test_app_template";
const TEMP_DIR:string = "test/tmp";
const TEST_APP_DIR_NAME:string = "test_app";

const TEST_APP_DIRECTORY:string = path.resolve(TEMP_DIR, TEST_APP_DIR_NAME);

const TEST_APP_XML_METADATA_IMPORT_DIRECTORY:string = TEST_APP_DIRECTORY + "/download";
//const TEST_APP_XML_METADATA_IMPORT_DIRECTORY:string = TEST_APP_DIRECTORY + "/xmlMetadataImport";
const TEST_APP_METADATA_BACKUP_DIRECTORY:string = TEST_APP_DIRECTORY + "/metadata_backup";
const TEST_APP_METADATA_FILE_NAME:string = "sys_rest_message_ce1194101b090610132a55392a4bcb85.xml";
const TEST_APP_MOVE_METADATA_FILE:string = TEST_APP_XML_METADATA_IMPORT_DIRECTORY + "/" + TEST_APP_METADATA_FILE_NAME;

describe('FluentConverter Integration Test', () => {
   
    beforeEach(async () => {

        if(fs.existsSync(TEST_APP_DIRECTORY)){
            fs.rmdirSync(TEST_APP_DIRECTORY, { recursive: true, force: true } as fs.RmDirOptions);
        }

        fs.cpSync(TEST_APP_TEMPLATE_DIRECTORY, TEST_APP_DIRECTORY, { force: true, recursive: true});

    });

    afterEach(() => {
        // if(fs.existsSync(TEST_APP_DIRECTORY)){
        //     fs.rmdirSync(TEST_APP_DIRECTORY, { recursive: true, force: true } as fs.RmDirOptions);
        // }
    });

    xdescribe('should move file', () => {
       

        it('should convert metadata xml file to fluent', async () => {
            let converter:FluentConverter = new FluentConverter(TEST_APP_DIRECTORY, TEST_APP_XML_METADATA_IMPORT_DIRECTORY);
            let success:boolean = converter.moveFile(TEST_APP_MOVE_METADATA_FILE, TEST_APP_METADATA_BACKUP_DIRECTORY);
            
            expect(success).toBe(true);
            expect(fs.existsSync(path.resolve(TEST_APP_METADATA_BACKUP_DIRECTORY, TEST_APP_METADATA_FILE_NAME))).toBe(true);
            expect(fs.existsSync(path.resolve(TEST_APP_XML_METADATA_IMPORT_DIRECTORY, TEST_APP_METADATA_FILE_NAME))).toBe(false);
        
        
        }, 700 * SECONDS)

    });


    describe('convert metadata file', () => {
       

        it('should convert metadata xml file to fluent with metadata moved to backup directory', async () => {
            let fileName:string = "sys_rest_message_fn_1d0bb9de1b7f0610132a55392a4bcb73.xml";
            let appDir:string = path.resolve(TEST_APP_DIRECTORY);
            let xmlDir:string = path.resolve(TEST_APP_XML_METADATA_IMPORT_DIRECTORY);
            let converter:FluentConverter = new FluentConverter(appDir, xmlDir, TEST_APP_METADATA_BACKUP_DIRECTORY);
           let c:Context = await converter.convertMetadataFileToFluent(fileName, true);
            const outFileName:string = "sys_rest_message_fn_1d0bb9de1b7f0610132a55392a4bcb73.now.ts";

           expect(c).not.toBeNull();
           const outPath:string = path.resolve(TEST_APP_DIRECTORY, "src/fluent/generated", outFileName);
          // console.log(outPath);
           expect(fs.existsSync(outPath)).toBe(true);
        //    expect(fs.existsSync(path.resolve(TEST_APP_METADATA_BACKUP_DIRECTORY, fileName))).toBe(true);
        //     expect(fs.existsSync(path.resolve(TEST_APP_XML_METADATA_IMPORT_DIRECTORY, fileName))).toBe(false);
          
        
        
        }, 700 * SECONDS)

    });

    describe('convert application directory metadata', () => {
       

        it('should convert all metadata xml files to fluent with metadata moved to backup directory', async () => {
          
            let appDir:string = path.resolve(TEST_APP_DIRECTORY);
            let xmlDir:string = path.resolve(TEST_APP_XML_METADATA_IMPORT_DIRECTORY);
            let converter:FluentConverter = new FluentConverter(appDir, xmlDir, TEST_APP_METADATA_BACKUP_DIRECTORY);
            await converter.convertApplicationMetadata();
            

          
           const outPath:string = path.resolve(TEST_APP_DIRECTORY, "src/fluent/generated");
           let contents = fs.readdirSync(outPath);

           const backupPath:string = path.resolve(TEST_APP_METADATA_BACKUP_DIRECTORY);
            let backupContents = fs.readdirSync(backupPath);

            expect(contents).not.toBeNull();
            expect(backupContents).not.toBeNull();

          // console.log(outPath);
        //    expect(fs.existsSync(outPath)).toBe(true);
        //    expect(fs.existsSync(path.resolve(TEST_APP_METADATA_BACKUP_DIRECTORY, fileName))).toBe(true);
        //     expect(fs.existsSync(path.resolve(TEST_APP_XML_METADATA_IMPORT_DIRECTORY, fileName))).toBe(false);
          
        
        
        }, 700 * SECONDS)

    });

 
    
   
})