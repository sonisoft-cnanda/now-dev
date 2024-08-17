"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATFFileHandler = void 0;
let fs = require('fs');
let getDirName = require('path').dirname;
const nodePath = require('path');
class ATFFileHandler {
    getFileAsJson(path) {
        try {
            return JSON.parse(fs.readFileSync(path)) || {};
        }
        catch (ex) {
            console.log(ex);
            return {};
        }
    }
}
exports.ATFFileHandler = ATFFileHandler;
//# sourceMappingURL=ATFFileHandler.js.map