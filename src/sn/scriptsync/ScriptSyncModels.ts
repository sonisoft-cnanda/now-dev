export interface ScriptTypeConfig {
    table: string;
    label: string;
    nameField: string;
    scriptField: string;
    extension: string;
}

export const SCRIPT_TYPES: Record<string, ScriptTypeConfig> = {
    sys_script_include: { table: 'sys_script_include', label: 'Script Include', nameField: 'name', scriptField: 'script', extension: '.js' },
    sys_script: { table: 'sys_script', label: 'Business Rule', nameField: 'name', scriptField: 'script', extension: '.js' },
    sys_ui_script: { table: 'sys_ui_script', label: 'UI Script', nameField: 'name', scriptField: 'script', extension: '.js' },
    sys_ui_action: { table: 'sys_ui_action', label: 'UI Action', nameField: 'name', scriptField: 'script', extension: '.js' },
    sys_script_client: { table: 'sys_script_client', label: 'Client Script', nameField: 'name', scriptField: 'script', extension: '.js' },
};

export interface SyncScriptOptions {
    scriptName: string;
    scriptType: string;
    filePath: string;
    direction?: 'push' | 'pull';
}

export interface SyncResult {
    scriptName: string;
    scriptType: string;
    filePath: string;
    direction: 'push' | 'pull';
    success: boolean;
    sysId?: string;
    message: string;
    error?: string;
    timestamp: string;
}

export interface SyncAllOptions {
    directory: string;
    scriptTypes?: string[];
}

export interface SyncAllResult {
    directory: string;
    scriptTypes: string[];
    totalFiles: number;
    synced: number;
    failed: number;
    scripts: SyncResult[];
    timestamp: string;
}

export interface ParsedFileName {
    isValid: boolean;
    scriptName?: string;
    scriptType?: string;
}

export interface ScriptRecord {
    sys_id: string;
    name: string;
    script: string;
    [key: string]: unknown;
}

export interface ScriptRecordResponse {
    result: ScriptRecord;
}

export interface ScriptRecordListResponse {
    result: ScriptRecord[];
}
