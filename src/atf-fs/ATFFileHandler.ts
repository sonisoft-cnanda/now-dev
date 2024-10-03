import * as fs from 'fs-extra';


export class ATFFileHandler{

    public getFileAsJson(path: string) : unknown {
        try {
            
            return fs.readJSONSync(path) || {};
        }
        catch(ex){
            console.log(ex);
            return {};
        }
    }

    public async writeTestFile() : Promise<void>{

    }

    public async writeTestMetadata() : Promise<void>{
        
    }


}