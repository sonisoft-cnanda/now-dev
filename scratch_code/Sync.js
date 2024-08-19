t.Sync = new class {
      constructor() {
        this.NO_SYNC_MSG = false;
        this.runTimeMapObj = {};
        this.scratchRuntimeMapObj = {};
        this.serverJSONObj = {};
        this.timeStampArray = [{}];
        this.deletedFileList = [];
        this.patchFiles = [];
        this.hasAPICalls = false;
        this.patch = false;
        this.xhrCounter = 0;
        this.successAction = false;
        this.errorAction = false;
        this.errorFiles = [];
        this.syntaxErrors = false;
        this.syntaxErrorFiles = [];
        this.globalFilesForCreate = [];
      }
      getRuntimeMap(e) {
        if (e) {
          return this.scratchRuntimeMapObj;
        } else {
          return this.runTimeMapObj;
        }
      }
      getSrcRuntimeMap() {
        return this.runTimeMapObj;
      }
      getScratchRuntimeMap() {
        return this.scratchRuntimeMapObj;
      }
      startSyncProcess(e, t, n) {
        return r(this, undefined, undefined, function* () {
          try {
            w.Logger.log("sync process started");
            c.NowGlobals.SYSTEM_BUSY = true;
            f.syncUtils.showSyncLoader();
            this.SRC_SYNC = e;
            this.SCRATCH_SYNC = t;
            this.init();
            if (this.SRC_SYNC) {
              this.refreshLocalJSON();
              this.parseExplorerTree();
            }
            if (this.SCRATCH_SYNC) {
              this.scratchSyncHandler = new T.ScratchFileSyncHandler();
              yield this.scratchSyncHandler.init();
              if (this.scratchSyncHandler.hasLocalModifiedFiles()) {
                yield this.scratchSyncHandler.loadRemoteUpdateSetMappings();
              }
            }
            this.launchSelectiveSync(n);
          } catch (e) {
            c.NowGlobals.SYSTEM_BUSY = false;
            c.NowGlobals.TRIGGER_KEYBINDING = false;
            f.syncUtils.hideSyncLoader();
            this.errorInSync(e);
          }
        });
      }
      launchSelectiveSync(e) {
        if (!this.SCRATCH_SYNC || !this.scratchSyncHandler.hasLocalModifiedFiles()) {
          return this.postSelectiveSync(null, e);
        }
        this.scratchSyncHandler.getDataForSyncWebView().then(t => {
          c.NowGlobals.SYSTEM_BUSY = false;
          c.NowGlobals.TRIGGER_KEYBINDING = false;
          f.syncUtils.hideSyncLoader();
          t.SYNC_STATUS = {};
          t.SYNC_STATUS.SRC_SYNC = this.SRC_SYNC;
          t.SYNC_STATUS.SCRATCH_SYNC = this.SCRATCH_SYNC;
          P.SelectiveSyncView.launch(t, (t, n) => {
            setTimeout(() => {
              D.UpdateSet.displayScratchFileUpdateSet();
            }, 500);
            if (!c.NowGlobals.SYSTEM_BUSY) {
              switch (n) {
                case "EXIT":
                  return;
                case "SKIP":
                  this.SCRATCH_SYNC = false;
                  break;
                case "SYNC_SUBMIT":
                  break;
                default:
                  return;
              }
              c.NowGlobals.SYSTEM_BUSY = true;
              c.NowGlobals.SYNC_PROGRESS_OBJ = h.Utils.showProgressBar(x.i18n.translate(S.NowConstants.i18n.SYNC_PROGRESS_MSG, c.NowGlobals.APP_NAME), false);
              if (e && e.trigger === "keybinding") {
                c.NowGlobals.TRIGGER_KEYBINDING = true;
              }
              this.postSelectiveSync(t, e);
            }
          });
        });
      }
      postSelectiveSync(e, t) {
        if (this.SRC_SYNC && !c.NowGlobals.SCRATCH_FOLDER_SYNC_ENABLED) {
          this.SCRATCH_SYNC = false;
        }
        if (!this.SRC_SYNC && !this.SCRATCH_SYNC) {
          f.syncUtils.hideSyncLoader();
          c.NowGlobals.SYSTEM_BUSY = false;
          c.NowGlobals.TRIGGER_KEYBINDING = false;
          F.MessageUtils.showInformationMessage(S.NowConstants.i18n.NO_FILE_SELECTED_FOR_SYNC);
          return;
        }
        if (this.SRC_SYNC) {
          this.metadataOperations.push(this.loadUpdateSet.bind(this), this.loadServerJSON.bind(this));
        }
        if (this.SCRATCH_SYNC) {
          this.metadataOperations.push(this.scratchSyncHandler.loadRemoteUpdateSetMappings.bind(this.scratchSyncHandler));
          this.metadataOperations.push(this.scratchSyncHandler.updateServerTimestamps.bind(this.scratchSyncHandler));
          this.scratchSyncHandler.updateDataFromSyncWebView(e);
        }
        this.runSync();
      }
      runSync() {
        Promise.all(this.metadataOperations.map(e => e())).then(() => {
          const e = this.SCRATCH_SYNC ? this.getScratchFilesToSync() : [];
          const t = (this.SRC_SYNC ? this.parseLocalJSON(true) : []).concat(e);
          this.runSyncAllFiles(t, true);
        }).catch(e => {
          this.errorInSync(e);
        });
      }
      loadUpdateSet() {
        return r(this, undefined, undefined, function* () {
          if (!this.hasLocalChanges || h.Utils.canSetUpdateSetInUrl()) {
            return Promise.resolve();
          }
          const e = yield u.ServiceNow.preSyncTasks();
          if (!e || f.syncUtils.shouldStopProcess(e)) {
            f.syncUtils.hideSyncLoader();
            c.NowGlobals.SYSTEM_BUSY = false;
            c.NowGlobals.TRIGGER_KEYBINDING = false;
            return Promise.reject();
          } else {
            return undefined;
          }
        });
      }
      postLoadServerJSON(e) {
        try {
          if (!c.NowGlobals.SYSTEM_BUSY) {
            f.syncUtils.hideSyncLoader();
            return;
          }
          if (e) {
            throw new Error();
          }
          this.parseServerJSONComposite();
        } catch (e) {
          this.errorInSync(e);
        }
      }
      postSyncProcess(e, t, n) {
        return r(this, undefined, undefined, function* () {
          yield this.setSysScopeForCreateFiles();
          this.deleteEntriesInRuntimeMap();
          w.Logger.log("delete entreis in runtime map");
          this.runPatchProcess(e);
          h.Utils.writeRuntimeMap(this.runTimeMapObj, true);
          h.Utils.writeRuntimeMap(this.scratchRuntimeMapObj, true, "scratch");
          h.Utils.refreshExplorer();
          this.showSyncCompleteMsg(t);
          this.cleanup();
          f.syncUtils.hideSyncLoader();
          w.Logger.log("SYNC PROCESS ENDED");
          c.NowGlobals.SYSTEM_BUSY = false;
          c.NowGlobals.TRIGGER_KEYBINDING = false;
        });
      }
      getScratchFilesToSync() {
        if (this.scratchSyncHandler && this.scratchSyncHandler.hasLocalModifiedFiles()) {
          return this.scratchSyncHandler.processFiles();
        } else {
          return [];
        }
      }
      errorInSync(e) {
        return r(this, undefined, undefined, function* () {
          A.Insights.sendEvent({
            eventType: "Sync",
            syncType: "Project",
            status: "failure",
            failureReason: e,
            trigger: c.NowGlobals.TRIGGER_KEYBINDING ? "keybinding" : null
          });
          w.Logger.error("ERROR IN SYNC", e);
          F.MessageUtils.showErrorMessage(S.NowConstants.i18n.SYNC_COMPLETE_ERROR, c.NowGlobals.APP_NAME);
          this.cleanup();
          f.syncUtils.hideSyncLoader();
          c.NowGlobals.SYSTEM_BUSY = false;
          c.NowGlobals.TRIGGER_KEYBINDING = false;
        });
      }
      showSyncCompleteMsg(e) {
        return r(this, undefined, undefined, function* () {
          if (!this.SCRATCH_SYNC && !this.SRC_SYNC && c.NowGlobals.SYNC_ON_SAVE) {
            return;
          }
          let t = e ? v.syncCurrentFile.getCurrentFileName() : c.NowGlobals.APP_NAME;
          const n = e ? "Current file" : "Project";
          if (n === "Project") {
            N.nowEventEmitter.emit(N.nowEvents.SYNC_COMPLETE);
          }
          if (this.NO_SYNC_MSG) {
            F.MessageUtils.showInformationMessage(S.NowConstants.i18n.METADATA_SELECTION_CHANGE, t);
            c.NowGlobals.CREATE_FILEGROUPS = [];
            c.NowGlobals.CREATE_FILETYPES = [];
            this.NO_SYNC_MSG = false;
            return;
          }
          if (!this.successAction && !this.patch && !this.syntaxErrors && !this.errorAction) {
            F.MessageUtils.showInformationMessage(S.NowConstants.i18n.NO_CHANGES_DETECTED, t);
            A.Insights.sendEvent({
              eventType: "Sync",
              syncType: n,
              status: "success",
              trigger: c.NowGlobals.TRIGGER_KEYBINDING ? "keybinding" : null
            });
            return;
          }
          if (!this.successAction && !this.patch && !this.syntaxErrors && this.errorAction) {
            F.MessageUtils.showErrorMessage(S.NowConstants.i18n.SYNC_COMPLETE_ERROR, t);
            A.Insights.sendEvent({
              eventType: "Sync",
              syncType: n,
              status: "failure",
              failureReason: "omni-failure",
              trigger: c.NowGlobals.TRIGGER_KEYBINDING ? "keybinding" : null
            });
            return;
          }
          if (this.patch) {
            let e = [];
            for (let t = 0; t < this.patchFiles.length; t++) {
              e.push(this.patchFiles[t][3]);
            }
            let t = e.join();
            F.MessageUtils.showInformationMessage(S.NowConstants.i18n.MERGE_CONFLICTS_DETECTED, t);
          }
          if (this.errorAction) {
            let e = this.errorFiles.join(", ");
            F.MessageUtils.showErrorMessage(S.NowConstants.i18n.FILES_SYNC_ERROR, e);
          }
          if (this.successAction && (this.patch || this.syntaxErrors || this.errorAction)) {
            F.MessageUtils.showWarningMessage(S.NowConstants.i18n.SYNC_COMPLETE_PARTIAL, t);
            A.Insights.sendEvent({
              eventType: "Sync",
              syncType: n,
              status: "partial",
              trigger: c.NowGlobals.TRIGGER_KEYBINDING ? "keybinding" : null
            });
            return;
          } else if (!this.successAction || this.patch || this.syntaxErrors || this.errorAction) {
            A.Insights.sendEvent({
              eventType: "Sync",
              syncType: n,
              status: "failure",
              trigger: c.NowGlobals.TRIGGER_KEYBINDING ? "keybinding" : null
            });
            return;
          } else {
            F.MessageUtils.showInformationMessage(S.NowConstants.i18n.SYNC_COMPLETED, t);
            A.Insights.sendEvent({
              eventType: "Sync",
              syncType: n,
              status: "success",
              trigger: c.NowGlobals.TRIGGER_KEYBINDING ? "keybinding" : null
            });
            return;
          }
        });
      }
      loadGlobals() {
        return r(this, undefined, undefined, function* () {
          const e = yield C.Project.isWorkspaceAvailable(false);
          if (!e) {
            return false;
          }
          if (!c.NowGlobals.WS_PATH || c.NowGlobals.WS_PATH !== e) {
            if (u.ServiceNow.detectNowProject(e).length === 0) {
              h.Utils.noAppsFoundPrompt();
              return false;
            }
            c.NowGlobals.WS_PATH = e;
            c.NowGlobals.superRootPath = i.join(c.NowGlobals.WS_PATH, c.NowGlobals.APP_NAME);
            c.NowGlobals.rootPath = i.join(c.NowGlobals.superRootPath, S.NowConstants.PROJECT.NOWPROJECT_ROOT);
            const t = yield b.Credentials.getCredentials(c.NowGlobals.superRootPath);
            if (t) {
              E.Authentication.loadKeychainValues(t);
              N.nowEventEmitter.emit(N.nowEvents.CREDENTIALS_LOADED);
            } else {
              w.Logger.log("An error has occurred retrieving the credentials");
              F.MessageUtils.showErrorMessage(S.NowConstants.i18n.RETRIEVE_CREDENTIALS_FAILED);
              const e = yield _.AuthenticationWizard.run();
              yield u.ServiceNow.setUserCredentialsAndUpdateSettings();
              if (!e) {
                return false;
              }
            }
            this.loadRunTimeMap();
            return true;
          }
          return c.NowGlobals.WS_PATH === e;
        });
      }
      setSysScopeForCreateFiles() {
        return r(this, undefined, undefined, function* () {
          if (!h.Utils.isGlobalApp()) {
            return;
          }
          if (this.globalFilesForCreate.length === 0) {
            return;
          }
          let e = "";
          for (let t in this.globalFilesForCreate) {
            e += `{sysId: '${this.globalFilesForCreate[t][0]}', sys_table: '${this.globalFilesForCreate[t][1]}'},`;
          }
          let t = "var arr = [" + e + "];\n        for(var i=0; i<arr.length; i++) {\n            var item = arr[i];\n            var table = item[\"sys_table\"];\n            var id = item[\"sysId\"];\n            var gr = new GlideRecord(table);\n            gr.get(id);\n            gr.sys_scope = \"global\";\n            gr.update();\n        }";
          yield k.BackgroundScriptRunner.executeScript(false, t);
        });
      }
      runPatchProcess(e) {
        if (this.patchFiles.length !== 0) {
          if (e) {
            const e = {
              opened: true,
              disabled: false
            };
            let t = {};
            let n = [];
            for (let e = 0; e < this.patchFiles.length; e++) {
              const n = this.patchFiles[e][0];
              const r = this.patchFiles[e][1];
              const i = this.patchFiles[e][2];
              const s = this.patchFiles[e][3];
              if (!t.hasOwnProperty(n)) {
                t[n] = {};
              }
              if (!t[n].hasOwnProperty(r)) {
                t[n][r] = {};
              }
              if (!t[n][r].hasOwnProperty(i)) {
                t[n][r][i] = [];
              }
              t[n][r][i].push(s);
            }
            for (let r in t) {
              let i = [];
              for (let n in t[r]) {
                let s = [];
                for (let i in t[r][n]) {
                  let o = [];
                  for (let s = 0; s < t[r][n][i].length; s++) {
                    const a = t[r][n][i][s];
                    o.push({
                      text: a,
                      state: e,
                      icon: "codicon codicon-symbol-file",
                      a_attr: {
                        title: a
                      }
                    });
                  }
                  s.push({
                    text: i,
                    children: o,
                    state: e
                  });
                }
                i.push({
                  text: n,
                  children: s,
                  state: e
                });
              }
              n.push({
                text: r,
                children: i,
                state: e
              });
            }
            g.launch(n);
          } else {
            w.Logger.log("not showing diff. Instead showign information message ");
            o.window.showInformationMessage(x.i18n.translate(S.NowConstants.i18n.FILE_MODIFIED_BOTH), S.NowConstants.SYNC.OPEN_DIFF, S.NowConstants.SYNC.MARK_AS_RESOLVED, S.NowConstants.SYNC.OVERWRITE_SERVER, S.NowConstants.SYNC.OVERWRITE_LOCAL).then(e => {
              const t = v.syncCurrentFile.getCurrentSuperCoverName();
              const n = v.syncCurrentFile.getCurrentCoverName();
              const r = v.syncCurrentFile.getCurrentFileName();
              const i = v.syncCurrentFile.getCurrentRealm();
              if (e === S.NowConstants.SYNC.OPEN_DIFF) {
                y.diffViewer.openDiffWithServerVersion(t, n, r, i);
              } else if (e === S.NowConstants.SYNC.MARK_AS_RESOLVED) {
                this.markAsResolved(t, n, r, i);
              } else if (e === S.NowConstants.SYNC.OVERWRITE_SERVER) {
                m.uploadFile.overwriteFileInServer(r, n, t, true, i).then(() => {
                  F.MessageUtils.showInformationMessage(S.NowConstants.i18n.FILE_OVERWRITE_RESPONSE, r, "server");
                }, () => {
                  F.MessageUtils.showErrorMessage(S.NowConstants.i18n.FILE_OVERWRITE_FAILED);
                });
              } else if (e === S.NowConstants.SYNC.OVERWRITE_LOCAL) {
                d.downloadFile.overwriteFileInLocal(r, n, t, i).then(() => {
                  F.MessageUtils.showInformationMessage(S.NowConstants.i18n.FILE_OVERWRITE_RESPONSE, r, "local system");
                }, () => {
                  F.MessageUtils.showErrorMessage(S.NowConstants.i18n.FILE_OVERWRITE_FAILED);
                });
              }
            });
          }
        }
      }
      markAsResolved(e, t, n, r) {
        let i = [];
        let s = "";
        s = r ? r === c.NowGlobals.APP_NAME ? S.NowConstants.PROJECT.NOWPROJECT_SCRATCH + "/" + c.NowGlobals.APP_NAME : r : c.NowGlobals.APP_NAME;
        const o = {
          appName: s,
          superCoverName: e,
          coverName: t,
          fileName: n
        };
        i.push(o);
        g.changeTimestamp(JSON.stringify(i));
      }
      cleanup() {
        this.serverJSONObj = {};
        this.timeStampArray = [{}];
        this.deletedFileList = [];
        this.patchFiles = [];
        this.SRC_SYNC = false;
        this.SCRATCH_SYNC = false;
      }
      deleteEntriesInRuntimeMap() {
        for (let e = 0; e < this.deletedFileList.length; e++) {
          const t = this.deletedFileList[e][0];
          const n = this.deletedFileList[e][1];
          const r = this.deletedFileList[e][2];
          const i = this.deletedFileList[e][3];
          w.Logger.log(`[deleteEntriesInRuntimeMap] ${t}/${n}/${r}`);
          delete this.getRuntimeMap(i)[t][n][r];
        }
        this.deletedFileList = [];
      }
      loadRunTimeMap() {
        w.Logger.log(" Loading runtime map from the fileSystem");
        let e = "";
        e = c.NowGlobals.superRootPath;
        if (e) {
          let t = i.join(e, S.NowConstants.PROJECT.SYSTEM, S.NowConstants.PROJECT.RUNTIMEMAP);
          try {
            this.runTimeMapObj = JSON.parse(p.FileUtils.readFileSync(t));
          } catch (e) {
            w.Logger.log("[loadRunTimeMap] Error in loading runtime map", e);
          }
          const n = i.join(e, S.NowConstants.PROJECT.SYSTEM, S.NowConstants.PROJECT.SCRATCH_RUNTIMEMAP);
          try {
            let e = JSON.parse(p.FileUtils.readFileSync(n));
            e ||= {};
            this.scratchRuntimeMapObj = e;
          } catch (e) {
            w.Logger.log("[loadRunTimeMap] Error in loading scratch runtime map", e);
          }
        }
      }
      loadServerJSON() {
        w.Logger.log("[SRC server timestamp called]");
        const e = Object.entries(t.Sync.getSrcRuntimeMap().system);
        const n = [];
        for (const [t, r] of e) {
          if (r) {
            n.push(t);
          }
        }
        return l.GatewayHelper.getArtefactsAsync(c.NowGlobals.NOW_APP_SYS_ID, "sys_updated_on", null, n).then(e => {
          try {
            w.Logger.log("[SRC server timestamp returned]");
            this.serverJSONObj = {};
            if (!e || e.errno || e.error || e.result && e.result.error) {
              return Promise.reject();
            } else {
              this.serverJSONObj = e;
              return this.postLoadServerJSON();
            }
          } catch (e) {
            return Promise.reject();
          }
        }, () => Promise.reject());
      }
      refreshLocalJSON() {
        for (let e in this.runTimeMapObj) {
          if (e === S.NowConstants.PROJECT.SYSTEM) {
            continue;
          }
          if (!this.runTimeMapObj.hasOwnProperty(e)) {
            continue;
          }
          if (this.runTimeMapObj[e] === S.NowConstants.PROJECT.SYSTEM) {
            continue;
          }
          const t = this.runTimeMapObj[e];
          for (let e in t) {
            const n = t[e];
            for (let e in n) {
              const t = n[e];
              t[S.NowConstants.SYNC.LIVE] = false;
              t[S.NowConstants.SYNC.UNCHANGED] = false;
            }
          }
        }
      }
      parseExplorerTree() {
        const e = c.NowGlobals.rootPath || "";
        h.Utils.getChildDirs(e).forEach(n => {
          if (n === S.NowConstants.SYNC.JS_CONFIG_FILE) {
            return;
          }
          const r = i.join(e, n);
          h.Utils.getChildDirs(r).forEach(e => {
            const o = i.join(r, e);
            let a = [];
            const c = f.syncUtils.getSysName(n, e);
            if (!c) {
              return;
            }
            if (!t.Sync.NO_SYNC_MSG && f.syncUtils.shouldSkip(e)) {
              return;
            }
            const u = f.syncUtils.getTagsObj(n, e);
            let l = false;
            if (u && Object.keys(u).length > 1) {
              l = true;
            }
            if (l) {
              p.FileUtils.filterHiddenFiles(s.readdirSync(o)).forEach(e => {
                const t = i.join(o, e);
                s.readdirSync(t).forEach(e => {
                  a.push(e);
                });
              });
            } else {
              a = s.readdirSync(o);
            }
            a.forEach(t => {
              const r = t.split(".");
              if (r.length <= 2) {
                return;
              }
              const s = r.pop();
              const a = r.pop();
              const u = r.join(".");
              if (!f.syncUtils.isValidTag(c, a, s) || !u) {
                return;
              }
              f.syncUtils.ensureJSONStructure(this.getSrcRuntimeMap(), n, e);
              const h = this.runTimeMapObj[n][e];
              if (h.hasOwnProperty(u)) {
                h[u][S.NowConstants.SYNC.LIVE] = true;
              } else {
                const e = h[u] = {};
                e[S.NowConstants.SYNC.UNCHANGED] = false;
                e[S.NowConstants.SYNC.LIVE] = true;
              }
              let d = 0;
              if (h[u].hasOwnProperty(S.NowConstants.SYNC.CURRENT_LOCAL_MOD_TIME)) {
                d = h[u][S.NowConstants.SYNC.CURRENT_LOCAL_MOD_TIME];
              }
              if (l) {
                t = `${u}${i.sep}${t}`;
              }
              let m = p.FileUtils.getFileTimeStamp(i.join(o, t));
              if (m > d) {
                h[u][S.NowConstants.SYNC.CURRENT_LOCAL_MOD_TIME] = m;
              }
              if (f.syncUtils.isFileModified(n, e, u)) {
                this.hasLocalChanges = true;
              }
            });
          });
        });
      }
      parseServerJSONComposite() {
        const e = this.serverJSONObj.result;
        const t = c.NowGlobals.StaticNowMap.ExtensionsMap;
        e.forEach(e => {
          const n = e[S.NowConstants.PROJECT.SYS_CLASS_NAME];
          const r = t[n].tags;
          const i = e[S.NowConstants.PROJECT.SYS_ID];
          const s = h.Utils.sanitizeFileName(e[S.NowConstants.PROJECT.SYS_NAME], i, r) || i;
          const o = e[S.NowConstants.SYNC.SYS_UPDATED_ON];
          this.parseServerJSONInner(n, s, o, i);
        });
      }
      canSyncFile(e) {
        const t = this.getAction(e);
        return t !== S.NowConstants.SYNC.FILE_NOT_TOUCHED && (e.action = t, true);
      }
      parseLocalJSON(e) {
        const n = [];
        for (let r in this.runTimeMapObj) {
          if (r === S.NowConstants.PROJECT.SYSTEM) {
            continue;
          }
          const i = this.runTimeMapObj[r];
          for (let s in i) {
            const o = i[s];
            if (t.Sync.NO_SYNC_MSG || !f.syncUtils.shouldSkip(s)) {
              for (let t in o) {
                const i = o[t];
                const a = i[S.NowConstants.SYNC.LIVE];
                const u = i[S.NowConstants.SYNC.UNCHANGED];
                let l = "";
                if (i.hasOwnProperty(S.NowConstants.PROJECT.SYS_ID)) {
                  l = i[S.NowConstants.PROJECT.SYS_ID];
                }
                let p = h.Utils.getSysnameFromCovername(s, r);
                if (h.Utils.isGUITypeFromCoverName(s, r)) {
                  p = h.Utils.getGUISysNameFromCoverName(s, r);
                }
                const d = {
                  appName: c.NowGlobals.APP_NAME,
                  showDiff: e,
                  superCoverName: r,
                  coverName: s,
                  fileName: t,
                  sys_name: p,
                  sys_id: l,
                  live: a,
                  unchanged: u
                };
                if (this.canSyncFile(d)) {
                  n.push(d);
                }
              }
            }
          }
        }
        return n;
      }
      runSyncAllFiles(e, t, n) {
        if (e.length === 0) {
          return this.postSyncProcess(t, false, n);
        }
        this.trackSyncStats(e);
        let r = this;
        const {
          progress: i,
          resolve: s
        } = c.NowGlobals.SYNC_PROGRESS_OBJ;
        i.report({
          increment: 0,
          message: `(1 of ${e.length})`
        });
        let o = 0;
        let u = 100 / e.length;
        a.map(e, function (t) {
          if (t) {
            return r.doAction(false, t).then(function (t) {
              o++;
              i.report({
                increment: u,
                message: `(${o} of ${e.length})`
              });
            }, e => {
              w.Logger.error(e);
            });
          } else {
            return null;
          }
        }, {
          concurrency: 10
        }).then(() => {
          if (!r.hasAPICalls) {
            w.Logger.log("[bPromise then] did not find any API calls");
            r.postSyncProcess(t, false, n);
          }
        }, () => {});
      }
      init() {
        this.refreshSyncStatusFlags();
        this.syntaxErrors = false;
        this.syntaxErrorFiles = [];
        this.serverJSONObj = {};
        this.timeStampArray = [{}];
        this.deletedFileList = [];
        this.patchFiles = [];
        this.xhrCounter = 0;
        this.patch = false;
        this.globalFilesForCreate = [];
        this.hasLocalChanges = false;
        c.NowGlobals.SYNC_ON_SAVE_CACHE = new Map();
        this.metadataOperations = [];
        if (c.NowGlobals.WEBVIEW_PANEL) {
          c.NowGlobals.WEBVIEW_PANEL.dispose();
        }
      }
      refreshSyncStatusFlags() {
        this.successAction = false;
        this.errorAction = false;
        this.errorFiles = [];
        this.hasAPICalls = false;
      }
      writeRuntimeMap(e) {
        h.Utils.writeRuntimeMap(e, true);
      }
      setSuccessAction(e) {
        this.successAction = e;
      }
      setErrorAction(e) {
        this.errorAction = e;
      }
      pushErrorFiles(e) {
        this.errorFiles.push(e);
      }
      setSyntaxError(e) {
        this.syntaxErrors = e;
      }
      pushSyntaxErrorFiles(e) {
        this.syntaxErrorFiles.push(e);
      }
      pushPatchFiles(e, t, n) {
        this.patchFiles.push([e, t, n]);
      }
      getCounter() {
        return this.xhrCounter;
      }
      incrementCounter() {
        this.xhrCounter++;
      }
      decrementCounter() {
        this.xhrCounter--;
      }
      clearXHRCounter() {
        this.xhrCounter = 0;
      }
      getPatchFiles() {
        return this.patchFiles;
      }
      setHaveAPICalls(e) {
        this.hasAPICalls = e;
      }
      setRuntimeMap(e) {
        this.runTimeMapObj = JSON.parse(JSON.stringify(e));
      }
      pushDeleteFileList(e, t, n, r) {
        this.deletedFileList.push([e, t, n, r]);
      }
      parseServerJSON() {
        const e = this.serverJSONObj.artefacts;
        for (let t = 0; t < e.length; t++) {
          const n = e[t];
          n.id;
          const r = n.types;
          for (let e = 0; e < r.length; e++) {
            const t = r[e];
            const n = t.id;
            t.pluralName;
            if (!c.NowGlobals.StaticNowMap.ExtensionsMap[n]) {
              continue;
            }
            const i = t.artefacts;
            if (i && i.length !== 0) {
              for (let e = 0; e < i.length; e++) {
                const t = i[e].sysId;
                const r = h.Utils.sanitizeFileName(i[e].name) || t;
                const s = "";
                this.parseServerJSONInner(n, r, s, t);
              }
            }
          }
        }
      }
      parseServerJSONInner(e, t, n, r) {
        const i = h.Utils.isGuiTypeFromSysName(e);
        if (f.syncUtils.shouldSkip(e)) {
          return;
        }
        if (!p.FileUtils.isValidFileName(t)) {
          return;
        }
        if (!n || !t) {
          return;
        }
        const {
          coverName: s,
          superCoverName: o
        } = h.Utils.getCoverNamesFromSysname(e);
        if (!h.Utils.isSupportedTypeFromSysName(e)) {
          return;
        }
        const a = h.Utils.getTimeInMilliSeconds(n);
        f.syncUtils.ensureJSONStructure(this.getSrcRuntimeMap(), o, s);
        const c = this.runTimeMapObj[o][s];
        if (!c.hasOwnProperty(t) && i) {
          const e = Object.keys(c).find(function (e) {
            return c[e][S.NowConstants.PROJECT.SYS_ID] === r;
          });
          w.Logger.log("Different filename with same sysId found. hence we are using the same entry", e);
          if (e) {
            t = e;
          }
        }
        const u = h.Utils.hasOwnPropertyIgnoreCase(c, t);
        if (u) {
          if (c[u][S.NowConstants.PROJECT.SYS_ID] !== r) {
            t = `${t}_${r}`;
          }
        } else {
          const e = `${t}_${r}`;
          if (h.Utils.hasOwnPropertyIgnoreCase(c, e)) {
            t = e;
          }
        }
        if (c.hasOwnProperty(t)) {
          const e = c[t];
          if (f.syncUtils.isLive(o, s, t)) {
            if (e[S.NowConstants.PROJECT.SYS_ID] !== r) {
              w.Logger.log("[parseServerJSON] found a file with same name but different sysId. Hence skipping it");
              return;
            }
            e[S.NowConstants.SYNC.UNCHANGED] = true;
          } else {
            e[S.NowConstants.SYNC.UNCHANGED] = false;
          }
        } else {
          const e = c[t] = {};
          e[S.NowConstants.PROJECT.SYS_ID] = r;
          e[S.NowConstants.SYNC.LIVE] = false;
          e[S.NowConstants.SYNC.UNCHANGED] = true;
        }
        c[t][S.NowConstants.SYNC.CURRENT_SERVER_MOD_TIME] = a;
      }
      getAction(e) {
        const {
          superCoverName: n,
          coverName: r,
          fileName: s,
          sys_name: o,
          sys_id: a,
          live: u,
          unchanged: l,
          realm: d
        } = e;
        const m = h.Utils.isGUITypeFromCoverName(r, n);
        if (!d && !f.syncUtils.isFileSelected(o)) {
          if (u) {
            this.setSuccessAction(true);
            p.FileUtils.deletefolder(i.join(c.NowGlobals.rootPath, n, r));
          }
          this.deletedFileList.push([n, r, s]);
          return S.NowConstants.SYNC.FILE_NOT_TOUCHED;
        }
        if (t.Sync.NO_SYNC_MSG && f.syncUtils.shouldSkip(r)) {
          return S.NowConstants.SYNC.FILE_NOT_TOUCHED;
        }
        if (u) {
          if (l && a) {
            if (m) {
              return S.NowConstants.SYNC.FILE_NOT_TOUCHED;
            }
            const e = this.getRuntimeMap(d)[n][r][s];
            if (e.hasOwnProperty(S.NowConstants.SYNC.SERVER_MOD_TIME)) {
              const t = e[S.NowConstants.SYNC.CURRENT_LOCAL_MOD_TIME];
              const n = e[S.NowConstants.SYNC.CURRENT_SERVER_MOD_TIME];
              const r = e[S.NowConstants.SYNC.LOCAL_MOD_TIME];
              const i = e[S.NowConstants.SYNC.SERVER_MOD_TIME];
              if (n > i && t > r) {
                A.Insights.sendEvent({
                  eventType: "Sync Detail",
                  sysName: o,
                  fileAction: "conflict",
                  realm: d
                });
                return S.NowConstants.SYNC.FILE_UPDATED_ON_BOTH;
              } else if (n > i) {
                return S.NowConstants.SYNC.FILE_UPDATED_ON_SERVER;
              } else if (t > r) {
                return S.NowConstants.SYNC.FILE_UPDATED_ON_CLIENT;
              } else {
                return S.NowConstants.SYNC.FILE_NOT_TOUCHED;
              }
            }
          }
          if (!l && !a) {
            if (m) {
              return S.NowConstants.SYNC.FILE_NOT_TOUCHED;
            } else if (d) {
              return S.NowConstants.SYNC.FILE_DELETED_ON_SERVER;
            } else {
              return S.NowConstants.SYNC.FILE_CREATED_ON_CLIENT;
            }
          }
          if (!l && a) {
            A.Insights.sendEvent({
              eventType: "Sync Detail",
              sysName: o,
              fileAction: "delete-server",
              realm: d
            });
            return S.NowConstants.SYNC.FILE_DELETED_ON_SERVER;
          }
        } else {
          if (l && a) {
            return S.NowConstants.SYNC.FILE_CREATED_ON_SERVER;
          }
          if (!l && a) {
            if (!m) {
              A.Insights.sendEvent({
                eventType: "Sync Detail",
                sysName: o,
                fileAction: "delete-client",
                realm: d
              });
            }
            return S.NowConstants.SYNC.FILE_DELETED_ON_CLIENT;
          }
          if (!l && !a) {
            return S.NowConstants.SYNC.FILE_DELETED_ON_BOTH;
          }
        }
        return S.NowConstants.SYNC.FILE_NOT_TOUCHED;
      }
      doAction(e, t) {
        return r(this, undefined, undefined, function* () {
          const {
            appName: n,
            showDiff: r,
            superCoverName: i,
            coverName: s,
            fileName: o,
            sys_name: a,
            sys_id: u,
            live: l,
            unchanged: p,
            action: g,
            realm: y
          } = t;
          const v = h.Utils.isGUITypeFromCoverName(s, i);
          switch (g) {
            case S.NowConstants.SYNC.FILE_CREATED_ON_SERVER:
              w.Logger.log("File has been created in the server. Downloading it", o, s, i);
              return d.downloadFile.downloadFile(e, r, a, u, o, s, i, false, y);
            case S.NowConstants.SYNC.FILE_CREATED_ON_CLIENT:
              w.Logger.log("File created locally. Uploading file ", i, s, o);
              return m.uploadFile.uploadFileWrapper(e, r, i, s, o, u, a, false, y);
            case S.NowConstants.SYNC.FILE_UPDATED_ON_SERVER:
              w.Logger.log("File has been modified in the server. downloading file ", i, s, o);
              return d.downloadFile.downloadFile(e, r, a, u, o, s, i, true, y);
            case S.NowConstants.SYNC.FILE_UPDATED_ON_CLIENT:
              w.Logger.log("File has been updated locally. uploading file. Sending request ", i, s, o);
              return m.uploadFile.uploadFileWrapper(e, r, i, s, o, u, a, true, y);
            case S.NowConstants.SYNC.FILE_UPDATED_ON_BOTH:
              this.patch = true;
              let t = n;
              if (y && t === c.NowGlobals.APP_NAME) {
                t = S.NowConstants.PROJECT.NOWPROJECT_SCRATCH + "/" + n;
              }
              this.patchFiles.push([t, i, s, o]);
              return Promise.resolve();
            case S.NowConstants.SYNC.FILE_DELETED_ON_SERVER:
              w.Logger.log("File has been deleted in the server. Deleting file locally.", i, s, o);
              yield f.syncUtils.deleteFileLocally(i, s, o, y);
              this.deletedFileList.push([i, s, o, y]);
              return Promise.resolve();
            case S.NowConstants.SYNC.FILE_DELETED_ON_CLIENT:
              if (v || !c.NowGlobals.FILE_DELETION_ENABLED) {
                w.Logger.log("Either file deletion is disabled or GUI file has been deleted in the client. Hence re downloading the file and creating locally", o, s, i);
                return d.downloadFile.downloadFile(e, r, a, u, o, s, i, false, y);
              } else {
                w.Logger.log("File has been deleted locally. Delete in the server", i, s, o);
                this.deletedFileList.push([i, s, o, y]);
                return f.syncUtils.deleteFileInServer(i, s, o, y);
              }
            case S.NowConstants.SYNC.FILE_DELETED_ON_BOTH:
              w.Logger.log("File has been deleted at both places. Delete entry", i, s, o);
              this.deletedFileList.push([i, s, o, y]);
              return Promise.resolve();
            case S.NowConstants.SYNC.FILE_NOT_TOUCHED:
            default:
              return Promise.resolve();
          }
        });
      }
      trackSyncStats(e) {
        let t = 0;
        let n = 0;
        let r = 0;
        e.forEach(e => {
          switch (e.action) {
            case S.NowConstants.SYNC.FILE_CREATED_ON_CLIENT:
            case S.NowConstants.SYNC.FILE_UPDATED_ON_CLIENT:
            case S.NowConstants.SYNC.FILE_DELETED_ON_CLIENT:
              t++;
              break;
            case S.NowConstants.SYNC.FILE_CREATED_ON_SERVER:
            case S.NowConstants.SYNC.FILE_UPDATED_ON_SERVER:
            case S.NowConstants.SYNC.FILE_DELETED_ON_SERVER:
              n++;
              break;
            case S.NowConstants.SYNC.FILE_DELETED_ON_BOTH:
            case S.NowConstants.SYNC.FILE_UPDATED_ON_BOTH:
              r++;
          }
        });
        A.Insights.sendEvent({
          eventType: "Sync Stats",
          srcSync: this.SRC_SYNC,
          scratchSync: this.SCRATCH_SYNC,
          clientChanged: t,
          serverChanged: n,
          conflicts: r,
          trigger: c.NowGlobals.TRIGGER_KEYBINDING ? "keybinding" : null
        });
      }
    };