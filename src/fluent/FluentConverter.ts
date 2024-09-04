
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
import { Logger } from '../util/Logger.js';
import { Context } from '@servicenow/sdk-build/dist/build-core/plugins/Context.js';
import { Logger as SDKLogger } from '@servicenow/sdk-project/dist/logger.js'
import { AstData, XmlData } from '@servicenow/sdk-build/dist/build-core/index.js';

export class FluentConverter{

    private _debugSdk:boolean = false;

    private _logger = new Logger("FluentConverter");

    private _applicationRootDirectory:string;

    private _xmlImportDirectory:string;

    private _fluentDirectory:string;

    /***
     * Scope of application to import from.
     * Primarily used when pulling from an instance.
     */
    private _appScope:string;

    public constructor(appRootDirectory:string, xmlImportDirectory:string){
        this._applicationRootDirectory = appRootDirectory;
        this._xmlImportDirectory = xmlImportDirectory;
    }

    public async convertMetadataFileToFluent(metadataFileName:string){
        const context = this.createFluentContext();
        const filePath = path.resolve(this._xmlImportDirectory, metadataFileName);
        let xmlFile = extractXmlFile(filePath, context, this._debugSdk);
        const entities = this.getEntities(context);
        const options = this.getOptions();
        await this.executeTransform(entities, xmlFile, context, options);
        this.saveGeneratedFiles(context, options as BuildOptions);
    }

    public async convertApplicationMetadata(){
        let xmlFileDirectory = "./download";
        let logger = this._logger;
        let appDirectory = "./";
        // let convertForIDEOptions = {directory: "", projectType: "fluent"};


       
        const options:BuildOptions = this.getOptions();
        const context = this.createFluentContext(); //createContext(appDirectory, PLUGINS, BUILT_INS, parsedOptions.debug, parsedOptions.mode as ("transform" | "serialize"), fs, logger);
        
        const entities = this.getEntities(context);
        // const fluentDir = path.resolve(appDirectory, context.app.config.fluentDir); // "fluentDir":"src/fluent",
        // const extractionResult = extractSourceFiles(fluentDir, context, options.debug)
        // const { data: entities, diagnostics } = extractionResult.handled ? extractionResult : { data: [], diagnostics: [] }


        //comment out to test for single file
        const xmlArr = extractXmlFiles(this._xmlImportDirectory, context, this._debugSdk);
        // const filePath = path.resolve(xmlFileDirectory, "sys_atf_test_suite_test_d6cfa6e62fc981101ba85d492799b674.xml");
        //console.log(filePath);
        //const xmlData = [];
        //let xmlFile = extractXmlFile(filePath, context, options.debug);
        //xmlData.push();
        await this.executeTransform(entities, xmlFile, context, options);
        // for(var i=0; i < xmlArr.length; i++){
        //     try{
        //        //const localContext = createContext(appDirectory, PLUGINS, BUILT_INS, parsedOptions.debug, parsedOptions.mode, fs, logger);
              
        //         var xmlFile = xmlArr.slice(i, i+1);
        //         console.log(xmlFile[0].filePath);
        //         //console.log(JSON.stringify(xmlFile));
        //          let result = await transform(entities, xmlFile, context, options as BuildOptions);
        //          //console.log(JSON.stringify(result));
        //         // if (result) {
        //         //     console.log('here');
        //         //     await saveChanges(localContext, parsedOptions)
        //         //     await localContext.keys.save(localContext, formatSourceFile) // TODO: Can probably remove this since keys.ts should get saved in `saveChanges`
        //         // }
        //     }catch(ex){
        //         console.log(ex);
        //     }
            
        // }
        
        
        console.log('Saving files');
        this.saveGeneratedFiles(context, options as BuildOptions);
      
    }

    /***
     * While xmlMetadataFiles can be an array, the sdk has some issues with processing these in bulk.  If one dies, the entire process dies.
     * We are breaking this up to handle one at a time, then it saves them all at the same time.
     */
    private async executeTransform(entities:AstData[], xmlMetadataFiles:XmlData[], context:Context, options:BuildOptions){
        let result:any = null;
        if(xmlMetadataFiles.length > 1){
            for(var i=0; i < xmlMetadataFiles.length; i++){
                try{
                   //const localContext = createContext(appDirectory, PLUGINS, BUILT_INS, parsedOptions.debug, parsedOptions.mode, fs, logger);
                  
                    var xmlFile = xmlMetadataFiles.slice(i, i+1);
                    this._logger.debug(xmlFile[0].filePath, xmlFile[0]);
                    //console.log(JSON.stringify(xmlFile));
                    result = await transform(entities, xmlMetadataFiles, context, options as BuildOptions);
                     //console.log(JSON.stringify(result));
                    // if (result) {
                    //     console.log('here');
                    //     await saveChanges(localContext, parsedOptions)
                    //     await localContext.keys.save(localContext, formatSourceFile) // TODO: Can probably remove this since keys.ts should get saved in `saveChanges`
                    // }
                }catch(ex){
                    this._logger.error(ex.message, {error:ex, xmlMetadataFiles: xmlMetadataFiles, entities:entities, context:context, options: options});
                }
                
            }
        }else{
            try{
           
                 this._logger.debug(xmlFile[0].filePath, xmlFile[0]);
                 result = await transform(entities, xmlMetadataFiles, context, options as BuildOptions);
             }catch(ex){
                 this._logger.error(ex.message, {error:ex, xmlMetadataFiles: xmlMetadataFiles, entities:entities, context:context, options: options});
             }
        }

        
        
    }

    private getOptions() : BuildOptions{
        let options = {
            debug: this._debugSdk,
            mode: 'transform',
            clean: true,
            transformDirectory: this._xmlImportDirectory,
        };
        return options as BuildOptions;
    }

    private async saveGeneratedFiles(context:Context, parsedOptions:BuildOptions){
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

    private getEntities(context:Context) : AstData[]{
        const extractionResult = extractSourceFiles(this._fluentDirectory, context, this._debugSdk)
        const { data: entities } = extractionResult.handled ? extractionResult : { data: [] }
        return entities;
    }

    private createFluentContext() : Context{

        let options = {
            debug: true,
            mode: 'transform',
            clean: true,
            transformDirectory:  this._xmlImportDirectory,
        };
        const parsedOptions = options;
        const context = createContext(this._applicationRootDirectory, PLUGINS, BUILT_INS, parsedOptions.debug, parsedOptions.mode as ("transform" | "serialize"), fs, this._logger);
        return context;
    }

}