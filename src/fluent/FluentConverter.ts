import { transformAndUpdateMetadata, convertForIDE } from '@servicenow/sdk-cli-core'
import {createConsoleLogger} from '@servicenow/sdk-project'
import * as fs from 'fs';
 import {createContext} from '@servicenow/sdk-build/dist/build/Context.js';
 import { extractSourceFiles } from '@servicenow/sdk-build/dist/build/stages/ExtractAst.js';
 import {  extractXmlFiles, extractXmlFile } from '@servicenow/sdk-build/dist/build/stages/ExtractXml.js';
 import { BuildOptions, parseBuildOptions } from '@servicenow/sdk-build/dist/build-core/BuildOptions.js'
 import { Keys } from '@servicenow/sdk-build/dist/build-core/Keys.js'
 import { formatSourceFile } from '@servicenow/sdk-build/dist/build/stages/util/FormatSourceFile.js'
 import * as path from 'path';
 import { transform } from '@servicenow/sdk-build/dist/build/stages/Transform.js';
import {  BUILT_INS, PLUGINS }  from '@servicenow/sdk-build/dist/build/index.js';
import { Logger } from '../util/Logger';


export class FluentConverter{

    _logger = new Logger("FluentConverter");


    public constructor(){

    }


    public async convertApplicationMetadata(){
        let xmlFileDirectory = "./download";
        let logger = createConsoleLogger();
        let appDirectory = "./";
        // let convertForIDEOptions = {directory: "", projectType: "fluent"};


        let options = {
            debug: true,
            mode: 'transform',
            clean: true,
            transformDirectory: xmlFileDirectory,
        };
        const parsedOptions = options;
        const context = createContext(appDirectory, PLUGINS, BUILT_INS, parsedOptions.debug, parsedOptions.mode as ("transform" | "serialize"), fs, logger);
        const fluentDir = path.resolve(appDirectory, context.app.config.fluentDir)
        const extractionResult = extractSourceFiles(fluentDir, context, options.debug)
        const { data: entities, diagnostics } = extractionResult.handled ? extractionResult : { data: [], diagnostics: [] }


        //comment out to test for single file
        const xmlArr = extractXmlFiles(options.transformDirectory, context, options.debug)
        // const filePath = path.resolve(xmlFileDirectory, "sys_atf_test_suite_test_d6cfa6e62fc981101ba85d492799b674.xml");
        //console.log(filePath);
        //const xmlData = [];
        //let xmlFile = extractXmlFile(filePath, context, options.debug);
        //xmlData.push();

        for(var i=0; i < xmlArr.length; i++){
            try{
               //const localContext = createContext(appDirectory, PLUGINS, BUILT_INS, parsedOptions.debug, parsedOptions.mode, fs, logger);
              
                var xmlFile = xmlArr.slice(i, i+1);
                console.log(xmlFile[0].filePath);
                //console.log(JSON.stringify(xmlFile));
                 let result = await transform(entities, xmlFile, context, options as BuildOptions);
                 //console.log(JSON.stringify(result));
                // if (result) {
                //     console.log('here');
                //     await saveChanges(localContext, parsedOptions)
                //     await localContext.keys.save(localContext, formatSourceFile) // TODO: Can probably remove this since keys.ts should get saved in `saveChanges`
                // }
            }catch(ex){
                console.log(ex);
            }
            
        }
        
        
        console.log('Saving files');
        await this.saveChanges(context, parsedOptions)
        await context.keys.save(context, formatSourceFile) // TODO: Can probably remove this since keys.ts should get saved in `saveChanges`
        
    }

    private async saveChanges(context, options) {
        if (options.dontSaveFiles) {
            return;
        }
        const changedFiles = context.compiler.getSourceFiles().filter((s) => {
            return (
                !s.isSaved() &&
                s.getFilePath() !== Keys.getKeysFilePath(context) &&
                !context.compiler.isDerivedSourceFile(s.getFilePath())
            )
        });
        //console.log(JSON.stringify(changedFiles));
        await Promise.all(
            changedFiles.map(async (sourceFile) => {
                context.logger.info(`Saving changes: ${sourceFile.getFilePath()}`)
                await sourceFile.save()
            })
        );
    }

}