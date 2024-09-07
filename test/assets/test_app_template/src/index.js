import path from "path";
import { FluentConverter } from "../../../../dist/fluent/FluentConverter.js";



const SECONDS = 1000;

const TEST_APP_TEMPLATE_DIRECTORY = "test/assets/test_app_template";
const TEMP_DIR = "./";
const TEST_APP_DIR_NAME = "test_app";
const TEST_APP_DIRECTORY = path.resolve(TEMP_DIR);
const TEST_APP_XML_METADATA_IMPORT_DIRECTORY = TEST_APP_DIRECTORY + "/xmlMetadataImport";

const TEST_APP_METADATA_BACKUP_DIRECTORY = TEST_APP_DIRECTORY + "/metadata_backup";
const TEST_APP_METADATA_FILE_NAME = "sys_rest_message_ce1194101b090610132a55392a4bcb85.xml";
const TEST_APP_MOVE_METADATA_FILE = TEST_APP_XML_METADATA_IMPORT_DIRECTORY + "/" + TEST_APP_METADATA_FILE_NAME;

let fileName = "sys_rest_message_fn_1d0bb9de1b7f0610132a55392a4bcb73.xml";
let appDir = path.resolve(TEST_APP_DIRECTORY);
let xmlDir = path.resolve(TEST_APP_XML_METADATA_IMPORT_DIRECTORY);
let converter = new FluentConverter(appDir, xmlDir, TEST_APP_METADATA_BACKUP_DIRECTORY);
let c = await converter.convertMetadataFileToFluent(fileName, true);
