
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
import { AstData, XmlData } from '@servicenow/sdk-build/dist/build-core/index.js';

export class FluentConverter{

    private _debugSdk:boolean = true;

    private _logger = new Logger("FluentConverter");

    private _applicationRootDirectory:string;

    private _xmlImportDirectory:string;

    private _fluentDirectory:string;

    private _context:Context;

    /***
     * Scope of application to import from.
     * Primarily used when pulling from an instance.
     */
    private _appScope:string;

    public constructor(appRootDirectory:string, xmlImportDirectory:string){
        this._applicationRootDirectory = appRootDirectory;
        this._xmlImportDirectory = xmlImportDirectory;

        this._context = this.createFluentContext();
        this._fluentDirectory = path.resolve( this._applicationRootDirectory, this._context.app.config.fluentDir);
    }

    public getContext() : Context{
        return this._context;
    }

    public async convertMetadataFileToFluent(metadataFileName:string, saveGenerated:boolean=true) : Promise<Context> {
        const context = this.getContext();
        const options = this.getOptions();
        const entities = this.getEntities(context);
        const filePath = path.resolve(this._xmlImportDirectory, metadataFileName);
        let xmlFile = extractXmlFile(filePath, context, this._debugSdk);
        await this.executeTransform(entities, xmlFile, context, options);
        if(saveGenerated)
            this.saveGeneratedFiles(context, options as BuildOptions);

        return context;
    }

    public async convertApplicationMetadata(){
       
   
        const options:BuildOptions = this.getOptions();
        const context = this.getContext();
        const entities = this.getEntities(context);
    
        const xmlArr = extractXmlFiles(this._xmlImportDirectory, context, this._debugSdk);
    
        await this.executeTransform(entities, xmlArr, context, options);
   
        
       this._logger.debug('Saving files');
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

                    result = await transform(entities, xmlMetadataFiles, context, options as BuildOptions);
                    
                }catch(ex){
                    this._logger.error(ex.message, {error:ex, xmlMetadataFiles: xmlMetadataFiles, entities:entities, context:context, options: options});
                }
                
            }
        }else if(xmlMetadataFiles.length == 1){
            try{
           
                 this._logger.debug("Attempting transform of " + xmlMetadataFiles[0].filePath);
                 result = await transform(entities, xmlMetadataFiles, context, options as BuildOptions);
             }catch(ex){
                 this._logger.error("Error transforming file: " + xmlMetadataFiles[0].filePath + ". \n" + ex.message, {error:ex,   options: options});
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

    private async saveChanges(context:Context, options:BuildOptions) {
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
        this._logger.debug("Changed FIles: ", {changedFiles:changedFiles, context:context, options:options});
        await Promise.all(
            changedFiles.map(async (sourceFile) => {
                context.logger.debug(`Saving changes: ${sourceFile.getFilePath()}`, sourceFile);
                await sourceFile.save();
            })
        );
    }

    private getEntities(context:Context) : AstData[]{
        const extractionResult = extractSourceFiles(this._fluentDirectory, context, this._debugSdk);
        this._logger.debug("Extraction Result: ", extractionResult);
        const { data: entities } = extractionResult.handled ? extractionResult : { data: [] };
        this._logger.debug("Entities: ", entities);
        
        return entities;
    }

    private createFluentContext() : Context{

        let options = this.getOptions();
        const parsedOptions = options;
        const context = createContext(this._applicationRootDirectory, PLUGINS, BUILT_INS, this._debugSdk, "transform", fs, this._logger);
        return context;
    }

}