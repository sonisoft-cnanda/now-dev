
let fs = require('fs');
let getDirName = require('path').dirname;
const nodePath = require('path');

export class ATFFileHandler{

    getFileAsJson(path: string) {
        try {
            return JSON.parse(fs.readFileSync(path)) || {};
        }
        catch(ex){
            console.log(ex);
            return {};
        }
    }


}