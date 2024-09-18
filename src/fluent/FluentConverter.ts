
import * as fs from 'fs';
 
 import * as path from 'path';
 


import { NowStringUtil } from '../util/NowStringUtil.js';
import { InvalidParameterException } from '../exception/InvalidParameterException.js';
import { FileExistsException } from '../exception/FileExistsException.js';
import { FileException } from '../exception/FileException.js';
import { PathException } from '../exception/PathException.js';
import { Logger } from '../util/Logger.js';
import { SourceFile } from 'ts-morph';

import os from 'os';
import { BUILT_INS, PLUGINS } from '@servicenow/sdk-build';
import { Diagnostic, FileSystem } from '@servicenow/sdk-project';
import {  Context } from '@servicenow/sdk-build';
import  { XmlData, Plugin, BuildOptions, Keys } from '@servicenow/sdk-build-core';
import { createProjectContext } from '@servicenow/sdk-project';
import * as stages_1 from '@servicenow/sdk-build/dist/stages/index.js';
import { extractEntities } from '@servicenow/sdk-build/dist/stages/ExtractAst.js';
const { extractXmlFile, extractXmlFiles, formatSourceFile, transform, getAstDiagnostics, getTypeScriptDiagnostics } = stages_1;

import { TransformResult } from '@servicenow/sdk-build/dist/stages/index.js';
import { EntityData } from '@servicenow/sdk-build-core';

export function createContext(
    rootDir: string,
    entityPlugins: Plugin[],
    builtInPlugins: Plugin[],
    debug: boolean,
    mode: 'serialize' | 'transform',
    fs: FileSystem,
    logger?: Logger
): Context {
    const projectContext = createProjectContext(rootDir, fs, logger)
    return new Context(
        projectContext.app,
        projectContext.compiler,
        projectContext.fs,
        projectContext.logger,
        entityPlugins,
        builtInPlugins,
        debug,
        mode
    )
}

export interface MetadataConversionResult {
    transformResults:TransformResult[];
    context:Context;
}


export class FluentConverter{

    private _debugSdk = true;
    public get debugSdk(): boolean {
        return this._debugSdk;
    }
    public set debugSdk(value: boolean) {
        this._debugSdk = value;
    }

    private _logger:Logger;
    public get logger() {
        return this._logger;
    }
    public set logger(value:Logger) {
        this._logger = value;
    }

    private _applicationRootDirectory: string;
    public get applicationRootDirectory(): string {
        return this._applicationRootDirectory;
    }
    public set applicationRootDirectory(value: string) {
        this._applicationRootDirectory = value;
    }

    private _xmlImportDirectory: string;
    public get xmlImportDirectory(): string {
        return this._xmlImportDirectory;
    }
    public set xmlImportDirectory(value: string) {
        this._xmlImportDirectory = value;
    }

    private _fluentDirectory: string;
    public get fluentDirectory(): string {
        return this._fluentDirectory;
    }
    public set fluentDirectory(value: string) {
        this._fluentDirectory = value;
    }

    private _context:Context;

    public getContext() : Context{
        return this._context;
    }

    private _metadataBackupDirectory: string;
    public get metadataBackupDirectory(): string {
        return this._metadataBackupDirectory;
    }
    public set metadataBackupDirectory(value: string) {
        this._metadataBackupDirectory = value;
    }


    private _backupMetadata = false;
    public get backupMetadata(): boolean {
        return this._backupMetadata;
    }
    public set backupMetadata(value: boolean) {
        this._backupMetadata = value;
    }

    private _deleteMetadataAfterFluentConversion = true;
    public get deleteMetadataAfterFluentConversion(): boolean {
        return this._deleteMetadataAfterFluentConversion;
    }
    public set deleteMetadataAfterFluentConversion(value: boolean) {
        this._deleteMetadataAfterFluentConversion = value;
    }

    private _processedFiles: TransformResult[];
    public get processedFiles(): TransformResult[] {
        return this._processedFiles;
    }
    public set processedFiles(value: TransformResult[]) {
        this._processedFiles = value;
    }

    /***
     * Scope of application to import from.
     * Primarily used when pulling from an instance.
     */
    private _appScope:string;

    public constructor(appRootDirectory:string, xmlImportDirectory:string, metadataBackupDirectory?:string){
        this.logger = new Logger("FluentConverter");
        this._applicationRootDirectory = appRootDirectory;
        this._xmlImportDirectory = xmlImportDirectory;
        if(!NowStringUtil.isStringEmpty(metadataBackupDirectory )){
            this.metadataBackupDirectory = metadataBackupDirectory;
            this.backupMetadata = true;
        }
           
        this._context = this.createFluentContext();
        this._fluentDirectory = path.resolve( this._applicationRootDirectory, this._context.app.config.fluentDir);
        this.processedFiles = [];
    }


    public async convertMetadataFileToFluent(metadataFileName:string, saveGenerated=true) : Promise<MetadataConversionResult> {
        const context = this.getContext();
        const options = this.getOptions();
        const entities = this.getEntities(context);
        const filePath = path.resolve(this._xmlImportDirectory, metadataFileName);
        const xmlFile = extractXmlFile(filePath, context, this._debugSdk);
        const transformResults:TransformResult[] = await this.executeTransform(entities, xmlFile, context, options);
       
        if(saveGenerated){
            this._logger.debug('Saving files');

            await this.saveGeneratedFiles(context, options);
        }

        const conversionResult:MetadataConversionResult = { transformResults:transformResults, context:context} as MetadataConversionResult;

        //this._logger.debug("Returning conversion results.", conversionResult);

        return conversionResult;
    }

    public async convertApplicationMetadata(saveGenerated=true){
       
        const options:BuildOptions = this.getOptions();
        const context = this.getContext();
        const entities = this.getEntities(context);
    
        const xmlArr = extractXmlFiles(this._xmlImportDirectory, context, this._debugSdk);
    
        const transformResults:TransformResult[] = await this.executeTransform(entities, xmlArr, context, options);
   
        if(saveGenerated){
            this._logger.debug('Saving files');

            await this.saveGeneratedFiles(context, options);
        }
      
        const conversionResult:MetadataConversionResult = { transformResults:transformResults, context:context} as MetadataConversionResult;

        //this._logger.debug("Returning conversion results.", conversionResult);

        return conversionResult;
    }

    // private backupMetadataFileAfterFluentGeneration(metadataFilePath:string){
    //     //After saving the file, mv the original metadata file to a backup directory
    //     if(this.backupMetadata){
    //        // get xml file that is associated with the source file
    //         const transformResult:TransformResult = this.getTransformResultByFluentSourceFilePath(metadataFilePath);
    //         if(!NowStringUtil.isStringEmpty(xmlFilePath)){
    //             this.moveFile(xmlFilePath, this.metadataBackupDirectory);
    //         }

            
    //     }
    // }

    // private getTransformResultByFluentSourceFilePath(fluentSourceFilePath:string) : TransformResult{
    //     let result:string = null;
    //     let sourceFilePath:string = fluentSourceFilePath.toLowerCase().trim();
    //     if(this.processedFiles.length > 0){
    //         for(var i=0; i < this.processedFiles.length; i++){
    //             let fileResult:TransformResult = this.processedFiles[i];
    //             if(Array.isArray(fileResult.sources) && fileResult.sources.length > 0){
    //                 const transformResultSourceFilePath = fileResult.sources[0].getFilePath().toLowerCase().trim();
    //                 if(transformResultSourceFilePath === sourceFilePath){
    //                     result = fileResult.handledXmls[0];
    //                     break;
    //                 }
    //             }

                
    //         }
    //     }
    //     return result;
    // }
   

    private verifyMetadataBackupDirectory(metadataBackupDirectory:string) : void{
        if(NowStringUtil.isStringEmpty(metadataBackupDirectory))
            throw new InvalidParameterException("metadataBackupDirectory null or empty.", {metadataBackupDirectory:metadataBackupDirectory} );
        
        const dirPath:string = path.resolve(metadataBackupDirectory);
        this._logger.debug("verifyMetadataBackupDirectory: metadataBackupDirectory resolved path: " + dirPath, {metadataBackupDirectory:metadataBackupDirectory});

        if(!fs.existsSync(dirPath)){
            this._logger.debug("verifyMetadataBackupDirectory: creating metadataBackupDirectory: " + dirPath, {metadataBackupDirectory:metadataBackupDirectory});

            fs.mkdirSync(dirPath);
        }else
            this._logger.debug("verifyMetadataBackupDirectory: metadataBackupDirectory directory already exists: " + dirPath, {metadataBackupDirectory:metadataBackupDirectory});

    }

    

    public moveFile(fromFilePath:string, toDirectory:string) : boolean{
        let isSuccess = false;

        try{
            //Get Absolute File and Directory Paths
            const abFilePath:string = path.resolve(fromFilePath);
            const abDirPath:string = path.resolve(toDirectory);

            //Verify fromFilePath is a file path
            const fileInfo:fs.Stats = fs.statSync(fromFilePath);
            const dirInfo:fs.Stats = fs.statSync(toDirectory);
            if(fileInfo.isFile() && dirInfo.isDirectory()){
                const targetFilePath:string = path.resolve(abDirPath, path.basename(abFilePath));
                //Check if file of same name exists in target already
                if(!(fs.existsSync(targetFilePath))){
                    try{
                        fs.copyFileSync(abFilePath, targetFilePath);
                    }catch(ex:unknown){
                        const err = ex as Error;
                        isSuccess = false;
                        throw new FileException("Error copying file.", err);
                    }

                    try{
                        fs.rmSync(abFilePath); 
                    }catch(ex:unknown){
                        const err = ex as Error;
                        isSuccess = false;
                        throw new FileException("Unable to remove file from existing directory, but file copied successfully.", err);
                    }
                    
                    const copiedFileExists:boolean = fs.existsSync(path.resolve(abDirPath, path.basename(abFilePath)));
                    const initialFileRemoved = !fs.existsSync(abFilePath);
                   
                    this._logger.debug("New File Exists: " + copiedFileExists + ", Old File Removed: " + initialFileRemoved, {abFilePath:abFilePath, abDirPath:abDirPath});

                    if(copiedFileExists && initialFileRemoved)
                        isSuccess = true;
           
                } 
                else 
                    throw new FileExistsException("File already exists in target path. Not moving file.");
                
            }else{
                const errMessage:string = "File or Directory are not correct types.  File: " + fromFilePath + " - Is File: " + fileInfo.isFile() + ", Directory: " + toDirectory + " - Is Directory:" + dirInfo.isDirectory();
                this._logger.error(errMessage, {fileInfo:fileInfo, dirInfo:dirInfo, fromFilePath:fromFilePath, toDirectory:toDirectory});
                throw new PathException(errMessage);
            }

           
        }catch(e:unknown){

            if (e instanceof FileException) {
                isSuccess = false;
                // A TypeError
              } else if (e instanceof FileExistsException) {
                isSuccess = false;
              
              } else {
                // everything else 
                const err = e as Error; 
                this._logger.error(err.message, err);
              }
        }
        


        return isSuccess;
    }

    /***
     * While xmlMetadataFiles can be an array, the sdk has some issues with processing these in bulk.  If one dies, the entire process dies.
     * We are breaking this up to handle one at a time, then it saves them all at the same time.
     */
    private async executeTransform(entities:EntityData[], xmlMetadataFiles:XmlData[], context:Context, options:BuildOptions) : Promise<TransformResult[]>{
       const results:TransformResult[] = [];
        if(xmlMetadataFiles.length > 1){
            //One of the issues that the
            //for(var i=0; i < xmlMetadataFiles.length; i++){
                //var xmlFile = xmlMetadataFiles.slice(i, i+1);
                //this._logger.debug(xmlFile[0].filePath, xmlFile[0]);
                //Try bulk editing them.  
                const result:TransformResult | null = await this.processFile(xmlMetadataFiles, entities, context, options);
                if(result != null)
                    results.push(result);
            //}
        }else if(xmlMetadataFiles.length == 1){
            const result:TransformResult | null = await this.processFile(xmlMetadataFiles, entities, context, options);
            if(result != null)
                results.push(result);
        }

        return results;
    }

    private async processFile(xmlFilesArr:XmlData[], entities:EntityData[], context:Context, options:BuildOptions) : Promise<TransformResult | null>{
        let result:TransformResult | null = null;
        try{
             this._logger.debug("Attempting transform of " + xmlFilesArr.length + " files.", xmlFilesArr);
             result = await transform(entities, xmlFilesArr, context, options);
             this._logger.debug("Transform Result.", result);
             //Store the processed file from this run.  The TransformResult maps the xml file to the now.ts file that was generated so we can backup the xml metadata file once the now.ts file
             //has been written to the filesystem.
             if(result)
                this.processedFiles.push(result);

             
         }catch(ex:unknown){
            const err = ex as Error;
             this._logger.error("Error transforming file: " + xmlFilesArr[0].filePath + ". \n" + err.message, {error:err,   options: options});
         }
         return result;
    }

    private getOptions() : BuildOptions{
        const options = {
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

        this._logger.debug("saveChanges - Context: " ,context);

        if(this.backupMetadata){
            this.verifyMetadataBackupDirectory(this.metadataBackupDirectory);
        }

        const changedFiles:SourceFile[] = context.compiler.getSourceFiles().filter((s) => {
            return (
                !s.isSaved() &&
                path.normalize(s.getFilePath()) !== Keys.getKeysFilePath(context) &&
                !context.compiler.isDerivedSourceFile(path.normalize(s.getFilePath())) &&
                !context.compiler.isGeneratedTableFile(path.normalize(s.getFilePath()))
            )
        })
    
        this._logger.debug("Changed FIles: ", {changedFiles:changedFiles, context:context, options:options});
        await Promise.all(
            changedFiles.map(async (sourceFile: SourceFile) => {
                
                context.logger.debug(`Saving changes: ${sourceFile.getFilePath()}`, sourceFile);
                await sourceFile.save();

                //After saving the file, mv the original metadata file to a backup directory
                //this.backupMetadataFileAfterFluentGeneration(sourceFile.getFilePath());
            })
        );
    }

    private getEntities(context:Context) : EntityData[]{
        //const options:BuildOptions = this.getOptions();
        if (context.app.package.devDependencies) {
            context.logger.info(`@servicenow/sdk version: ${context.app.package.devDependencies['@servicenow/sdk']}`)
        }
        context.logger.info(`Sources: ${context.app.config.fluentDir}`)
        context.logger.info(`Output: ${context.app.config.appOutputDir}`)
    
        // Check TypeScript diagnostics before extraction to avoid futile attempt to parse invalid code
        this.checkDiagnosticErrors([...getAstDiagnostics(context), ...getTypeScriptDiagnostics(context)] as unknown as Diagnostic[], context)

        const extractionResult = extractEntities(this._fluentDirectory, context, this._debugSdk);
        this._logger.debug("Extraction Result: ", extractionResult);
        const { data: entities, diagnostics  } = extractionResult.handled ? extractionResult : { data: [], diagnostics: [] };
        this._logger.debug("Entities: ", entities);
        
        if (!extractionResult.handled) {
            context.logger.info('No entities were handled while parsing source files')
        }
    
      
        // Check Fluent diagnostics after extraction now that we have all the necessary information
        this.checkDiagnosticErrors(diagnostics as Diagnostic[], context)

        return entities;
    }

    private createFluentContext() : Context{

        const context = createContext(this._applicationRootDirectory, PLUGINS, BUILT_INS, this._debugSdk, "transform", fs, this._logger);
        return context;
    }

    private checkDiagnosticErrors(diagnostics: Diagnostic[], context: Context) {
        const errorDiagnostics = diagnostics.filter((diagnostic) => diagnostic.level === Diagnostic.Level.Error)
    
        if (errorDiagnostics.length > 0) {
            context.logger.error('Diagnostic errors found in source files, fix errors and re-run fetch/build')
            const errorMessage = errorDiagnostics.map((d) => d.getFormattedText(context.compiler)).join(os.EOL)
            throw new Error(errorMessage)
        }
    
        const warnDiagnostics = diagnostics.filter((diagnostic) => diagnostic.level === Diagnostic.Level.Warn)
        if (warnDiagnostics.length > 0) {
            context.logger.warn(warnDiagnostics.map((d) => d.getFormattedText(context.compiler)).join(os.EOL))
        }
    }

    // debugData(data: Data[], logger: Logger, message = 'DATA:') {
    //     logger.info(message)
    //     logger.info(
    //         this.inspect(
    //             data.map((d) => {
    //                 if (d instanceof AstData) {
    //                     const { node, ...rest } = d
    //                     node
    //                     return rest
    //                 } else {
    //                     return d
    //                 }
    //             }),
    //             5
    //         )
    //     )
    // }

    // inspect(val: unknown, depth = 2) {
    //     return nodeInspect(val, {
    //         colors: true,
    //         compact: false,
    //         depth,
    //     })
    // }



    // getAstDiagnostics(context: Context) : FluentDiagnostic[] {
    //     const diagnostics: FluentDiagnostic[] = []

    //     context.compiler
    //         .getFluentSourceFilesFromDirectory(path.join(context.app.rootDir, context.app.config.fluentDir))
    //         .forEach((file) => {
    //             context.compiler.visitNodeTree(file, (node) => {
    //                 diagnostics.push(...context.getAstDiagnostics(node, context))
    //             })
    //         })

    //     return diagnostics
    // }

    // getTypeScriptDiagnostics(context: Context) : TypeScriptDiagnostic[] {
    //     return context.compiler
    //         .getFluentSourceFilesFromDirectory(path.join(context.app.rootDir, context.app.config.fluentDir))
    //         .flatMap((file) => context.compiler.getDiagnosticsForSourceFile(file))
    // }

}