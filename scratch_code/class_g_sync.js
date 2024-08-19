 class g {
            constructor() {
                this.GET_UPDATE_SET_STATUS_URL = "/api/now/table/sys_update_set?sysparm_fields=sys_id,is_default&sysparm_query=sys_idIN";
                this.GET_FILE_METADATA_URL = "/api/now/table/sys_metadata?sysparm_fields=sys_id,sys_name,sys_class_name,sys_updated_on&sysparm_query=sys_update_nameIN";
                this.GET_SCOPE_NAMES_URL = "/api/now/table/sys_metadata?sysparm_fields=sys_package,sys_package.name,sys_scope,sys_scope.name&sysparm_exclude_reference_link=true&sysparm_query=sys_update_nameIN";
                this.GET_RECENT_UPDATE_SETS_URL = "/api/now/table/sys_update_xml?sysparm_fields=name,update_set&sysparm_exclude_reference_link=true&sysparm_display_value=true&sysparm_query=ORDERBYDESCsys_recorded_at^nameIN";
                this.BLUEBIRD_CONCURRENCY_LIMIT = 10;
                this.runtimeMap = a.Sync.getScratchRuntimeMap();
                this.localUpdateSetMappings = c.NowGlobals.updateSets;
                this.remoteUpdateSetMappings = new Map();
                this.updateSetStore = new Map();
                this.updateSetStatusMappings = new Map();
                this.rejectedScopesForUpload = new Map();
                this.inactiveUpdateSets = new Map();
                this.localAffectedFiles = [];
                this.eligibleFilesForSync = [];
                this.eligibleScopesForSync = new Set();
            }
            static syncAllFiles() {
                return r(this, undefined, undefined, function* () {
                    new g().initAllFilesSync();
                });
            }
            static syncCurrentFile() { }
            init() {
                return r(this, undefined, undefined, function* () {
                    this.resetFlags();
                    this.updateLocalTimestamps();
                    this.loadLocalAffectedFiles();
                    yield this.computeEligibleFiles();
                });
            }
            computeEligibleFiles() {
                return r(this, undefined, undefined, function* () {
                    yield this.ensureAffectedFilesHaveScopeDetails();
                    this.generateEligibleFilesAndScopesListForSync();
                });
            }
            initAllFilesSync() {
                return r(this, undefined, undefined, function* () {
                    yield this.init();
                    yield this.loadRemoteUpdateSetMappings();
                    yield this.updateServerTimestamps();
                    const e = this.processFiles();
                    a.Sync.runSyncAllFiles(e, true, "scratch");
                });
            }
            processFiles(e = true) {
                const t = [];
                for (let n in this.runtimeMap) {
                    const r = this.runtimeMap[n];
                    for (let i in r) {
                        const s = r[i];
                        if (a.Sync.NO_SYNC_MSG || !d.syncUtils.shouldSkip(i)) {
                            for (let r in s) {
                                const o = s[r];
                                if (!o.localCopyExists) {
                                    continue;
                                }
                                const c = true;
                                const u = o.serverCopyExists;
                                const p = o[l.NowConstants.PROJECT.SYS_ID];
                                const f = o.packageName;
                                const m = o.scopeId;
                                const g = h.Utils.sanitizeFileName(f);
                                if (this.isFileRejectedByUser(o, m)) {
                                    continue;
                                }
                                let y = h.Utils.getSysnameFromCovername(i, n);
                                if (h.Utils.isGUITypeFromCoverName(i, n)) {
                                    y = h.Utils.getGUISysNameFromCoverName(i, n);
                                }
                                const v = {
                                    appName: f,
                                    showDiff: e,
                                    superCoverName: n,
                                    coverName: i,
                                    fileName: r,
                                    sys_name: y,
                                    sys_id: p,
                                    live: c,
                                    unchanged: u,
                                    realm: g
                                };
                                if (a.Sync.canSyncFile(v)) {
                                    if (d.syncUtils.shouldSkipScratchScopes(m, n, i, p)) {
                                        continue;
                                    }
                                    t.push(v);
                                }
                            }
                        }
                    }
                }
                return t;
            }