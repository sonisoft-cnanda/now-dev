import * as fs from 'fs-extra';


export class ATFFileHandler{

    getFileAsJson(path: string) : unknown {
        try {
            
            return fs.readJSONSync(path) || {};
        }
        catch(ex){
            console.log(ex);
            return {};
        }
    }


}