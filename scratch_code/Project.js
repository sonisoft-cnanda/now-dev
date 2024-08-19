Object.defineProperty(t, "__esModule", {
            value: true
        });
        const i = n(8);
        const s = n(2);
        const o = n(129);
        const a = n(3);
        const c = n(74);
        const u = n(6);
        const l = n(12);
        const p = n(22);
        const h = n(21);
        const d = n(20);
        const f = n(7);
        const m = n(15);
        const g = n(46);
        const y = n(66);
        const v = n(203);
        const b = n(146);
        const x = n(121);
        const w = n(4);
        const _ = n(14);
        const E = n(47);
        t.Project = {
            scaffoldProject(e) {
                return r(this, undefined, undefined, function* () {
                    t.Project.initProjectVars(e);
                    yield t.Project.generateProjectStructure();
                });
            },
            initProjectVars(e) {
                u.NowGlobals.APP_NAME = e;
                const n = i.workspace.workspaceFolders;
                if (!n || n.length === 0) {
                    return;
                }
                const r = n[0];
                u.NowGlobals.WS_NAME = r.name;
                u.NowGlobals.WS_PATH = r.uri.fsPath;
                u.NowGlobals.superRootPath = s.join(u.NowGlobals.WS_PATH, e);
                u.NowGlobals.rootPath = s.join(u.NowGlobals.superRootPath, w.NowConstants.PROJECT.NOWPROJECT_ROOT);
                u.NowGlobals.scratchPath = s.join(u.NowGlobals.superRootPath, w.NowConstants.PROJECT.NOWPROJECT_SCRATCH);
                t.Project.generateApplicationStatusBarItem(e);
                f.Utils.showFileStatusbarItems();
            },
            generateProjectStructure() {
                return r(this, undefined, undefined, function* () {
                    d.FileUtils.createFolder(u.NowGlobals.rootPath);
                    d.FileUtils.createFolder(u.NowGlobals.scratchPath);
                    d.FileUtils.createFolder(s.join(f.Utils.getWSpath(), u.NowGlobals.APP_NAME, "system"));
                    d.FileUtils.createFolder(u.NowGlobals.scratchPath);
                    const e = s.join(u.NowGlobals.EXTENSION_PATH, w.NowConstants.PROJECT.OUT_DIR, "assets");
                    o.copySync(e, u.NowGlobals.WS_PATH);
                    const t = s.join(e, "eslintRules");
                    o.copySync(t, u.NowGlobals.superRootPath);
                    const n = s.join(e, "vscode");
                    o.copySync(n, u.NowGlobals.WS_PATH);
                    const r = w.NowConstants.PROJECT.BGSCRIPTS_FOLDER;
                    const i = s.join(u.NowGlobals.superRootPath, r);
                    d.FileUtils.createFolder(i);
                    const a = s.join(e, r);
                    o.copySync(a, i);
                    const c = s.join(u.NowGlobals.WS_PATH, r);
                    yield o.remove(c);
                    const l = s.join(u.NowGlobals.WS_PATH, "file-templates");
                    yield o.remove(l);
                    const p = s.join(u.NowGlobals.WS_PATH, "i18n");
                    yield o.remove(p);
                    const h = s.join(u.NowGlobals.WS_PATH, "jstree");
                    yield o.remove(h);
                    const m = s.join(u.NowGlobals.WS_PATH, "lib", "documentation");
                    yield o.remove(m);
                    const g = s.join(u.NowGlobals.WS_PATH, "vscode");
                    yield o.remove(g);
                    const y = s.join(u.NowGlobals.WS_PATH, "eslintRules");
                    yield o.remove(y);
                });
            },
            downloadCore(e, n, i, s, o) {
                return r(this, undefined, undefined, function* () {
                    yield t.Project.scaffoldProject(e);
                    t.Project.getArtefacts(n, o, i, s);
                });
            },
            getArtefacts(e, n, i, o) {
                return r(this, undefined, undefined, function* () {
                    var _b;
                    l.Logger.log("[getartefacts] selected metadata", JSON.stringify(o));
                    let e = [];
                    let a = false;
                    let p = false;
                    const { progress: h, resolve: y } = n;
                    let v = {};
                    g.ServiceNow.runTerminalStuff();
                    let b = 0;
                    v[w.NowConstants.PROJECT.SYSTEM] = {};
                    for (var x = 0; x < o.length; x++) {
                        v[w.NowConstants.PROJECT.SYSTEM][o[x]] = true;
                    }
                    const _ = u.NowGlobals.StaticNowMap.ExtensionsMap;
                    let E = [];
                    for (let e = 0; e < i.length; e++) {
                        const t = i[e];
                        const n = t[w.NowConstants.PROJECT.SYS_CLASS_NAME];
                        if (_[n]) {
                            if (o.indexOf(n) !== -1) {
                                E.push(t);
                            }
                        }
                    }
                    let k = {};
                    h.report({
                        increment: 0,
                        message: `(1 of ${E.length})`
                    });
                    let C = 0;
                    let S = 100 / E.length;
                    for (let t = 0; t < E.length; t++) {
                        const n = E[t];
                        const r = n[w.NowConstants.PROJECT.SYS_CLASS_NAME];
                        const i = _[r];
                        const o = i.coverName;
                        const c = i.superCoverName;
                        let u = false;
                        v[c] || (v[c] = {});
                        (_b = v[c])[o] || (_b[o] = {});
                        const p = d.FileUtils.findOrCreateFileTypeDirectory(o, c);
                        const m = _[r].tags;
                        let g = "";
                        let y = "";
                        for (let e in m) {
                            g = e + "." + m[e];
                            if (g.endsWith(w.NowConstants.FILE.NOW_EXT)) {
                                u = true;
                                y = g;
                                break;
                            }
                        }
                        const x = n[w.NowConstants.PROJECT.SYS_ID];
                        let A = f.Utils.sanitizeFileName(n.sys_name, x, m) || x;
                        let T = "";
                        let P = v[c][o];
                        T = k[`${c}_${o}_${A.toLowerCase()}`] ? `${A}_${x}` : A;
                        k[`${c}_${o}_${T.toLowerCase()}`] = true;
                        const D = s.join(p, T);
                        if (u) {
                            P[T] = {};
                            P[T][w.NowConstants.PROJECT.SYS_ID] = x;
                            const e = D + "." + y;
                            d.FileUtils.createFile(e, x);
                            C++;
                            h.report({
                                increment: S,
                                message: `(${C} of ${E.length})`
                            });
                            continue;
                        }
                        const F = Object.keys(m).join();
                        l.Logger.log("[getArtefacts] requesting for file", c, o, A, b.toString());
                        if (/^[a-zA-Z0-9 _\(\)\[\].-]+$/.test(T)) {
                            a = true;
                            e.push({
                                metaType: r,
                                fileSysId: x,
                                tagTrail: F,
                                filePath: D,
                                tags: m,
                                superCoverName: c,
                                coverName: o,
                                fileName: T
                            });
                        }
                        else {
                            delete v[c][o][T];
                        }
                    }
                    f.Utils.writeRuntimeMap(v, true);
                    u.NowGlobals.NAME_SCOPE_MAP[w.NowConstants.PROJECT.ALL_APPLICATIONS][u.NowGlobals.APP_NAME].PROJECT_STATE = "inconsistent";
                    f.Utils.writeNameScopeMap(u.NowGlobals.NAME_SCOPE_MAP, false);
                    u.NowGlobals.SYSTEM_BUSY = true;
                    c.map(e, function (e) {
                        b++;
                        a = true;
                        return m.GatewayHelper.getFileContentAsync(function (e, i) {
                            return (o, a, c) => r(this, undefined, undefined, function* () {
                                let o = e.tags;
                                let u = e.filePath;
                                let m = e.superCoverName;
                                let g = e.coverName;
                                let y = e.fileName;
                                let x = e.fileSysId;
                                let _ = f.Utils.getSysnameFromCovername(g, m);
                                if (i[m][g][y] && v[m][g][y][w.NowConstants.PROJECT.SYS_ID] !== x) {
                                    y = `${y}_${x}`;
                                    u = `${u}_${x}`;
                                }
                                b--;
                                C++;
                                yield h.report({
                                    increment: S,
                                    message: `(${C} of ${E.length})`
                                });
                                l.Logger.log("[onFileResponse] Req response received", m, g, y, b.toString(), a);
                                let k = "";
                                if (!a || a.statusCode !== 200 || !c || !c.result || !c.result[0] || c.error) {
                                    l.Logger.log("[getArtefacts] found an empty record", m, g, y, b.toString());
                                    if (b === 0) {
                                        yield t.Project.postGetArtefacts(n, i);
                                    }
                                    return;
                                }
                                let A = false;
                                for (let e in o) {
                                    if (c.result[0][e] !== undefined) {
                                        A = true;
                                        break;
                                    }
                                }
                                if (A) {
                                    if (Object.keys(o).length > 1) {
                                        l.Logger.log(m, g, y, "has more than one tag", Object.keys(o).length.toString());
                                        d.FileUtils.createFolder(u);
                                        u = s.join(u, y);
                                    }
                                    for (let e in o) {
                                        let s = o[e];
                                        let a = c.result[0][e];
                                        if (a === undefined) {
                                            continue;
                                        }
                                        function T(e, s, o, a, c) {
                                            return function () {
                                                return r(this, undefined, undefined, function* () {
                                                    b--;
                                                    l.Logger.log(" [onFileCreation]  after creating file", a, e, s);
                                                    let r = v[e][s];
                                                    r[o][w.NowConstants.SYNC.SYS_UPDATED_ON] = c;
                                                    r[o][w.NowConstants.SYNC.SERVER_MOD_TIME] = f.Utils.getTimeInMilliSeconds(c);
                                                    const u = yield d.FileUtils.getFileTimeStamp(a);
                                                    const h = r[o][w.NowConstants.SYNC.LOCAL_MOD_TIME];
                                                    if (!h || u > h) {
                                                        r[o][w.NowConstants.SYNC.LOCAL_MOD_TIME] = u;
                                                        r[o][w.NowConstants.SYNC.CURRENT_LOCAL_MOD_TIME] = u;
                                                    }
                                                    p = true;
                                                    if (b === 0) {
                                                        yield t.Project.postGetArtefacts(n, i);
                                                    }
                                                });
                                            };
                                        }
                                        a = f.Utils.addContent(false, a, s, _, e);
                                        k = u + "." + e + "." + s;
                                        b++;
                                        let h = v[m][g];
                                        if (!h[y]) {
                                            h[y] = {};
                                            h[y][w.NowConstants.PROJECT.SYS_ID] = x;
                                        }
                                        d.FileUtils.createFile(k, a, T(m, g, y, k, c.result[0][w.NowConstants.SYNC.SYS_UPDATED_ON]));
                                    }
                                }
                                else if (b === 0) {
                                    yield t.Project.postGetArtefacts(n, i);
                                }
                            });
                        }(e, v), e.metaType, e.fileSysId, e.tagTrail).then(function (e) {
                            l.Logger.log(e);
                        }, () => { });
                    }, {
                        concurrency: 10
                    }).then(function () {
                        return r(this, undefined, undefined, function* () {
                            if (!a) {
                                yield t.Project.postGetArtefacts(n, v);
                            }
                        });
                    });
                });
            },
            postGetArtefacts(e, t) {
                return r(this, undefined, undefined, function* () {
                    l.Logger.log("[afterGetArtefacts] called");
                    v.Snippets.loadDynamicSnippets();
                    const n = p.i18n.translate(w.NowConstants.i18n.PROJECT_DOWNLOAD_SUCCESS);
                    f.Utils.resolvePromise(e, n);
                    _.MessageUtils.showInformationMessage(n);
                    f.Utils.clearCache();
                    u.NowGlobals.NAME_SCOPE_MAP[w.NowConstants.PROJECT.ALL_APPLICATIONS][u.NowGlobals.APP_NAME].PROJECT_STATE = "consistent";
                    f.Utils.writeNameScopeMap(u.NowGlobals.NAME_SCOPE_MAP, false);
                    f.Utils.writeRuntimeMap(t, true);
                    h.Sync.setRuntimeMap(t);
                    f.Utils.writeRuntimeMap({}, false, "scratch");
                    h.Sync.loadRunTimeMap();
                    E.nowEventEmitter.emit(E.nowEvents.PROJECT_OPEN);
                    y.UpdateSet.displayUpdatesetWrapper();
                    f.Utils.closeOpenTabs();
                    f.Utils.refreshExplorer();
                    u.NowGlobals.SYSTEM_BUSY = false;
                });
            },
            resetProject() {
                i.window.showWarningMessage(p.i18n.translate(w.NowConstants.i18n.PROJECT_RESET_CONFIRM), "yes", "no").then(e => {
                    if (e === "yes") {
                        t.Project.resetProjectCore();
                    }
                });
            },
            resetProjectCore() {
                return r(this, undefined, undefined, function* () {
                    const e = this.isWorkspaceAvailable();
                    if (!e) {
                        return;
                    }
                    if (g.ServiceNow.detectNowProject(e).length === 0) {
                        f.Utils.noAppsFoundPrompt();
                        return;
                    }
                    if (!(yield t.Project.ensureCurrentApplication())) {
                        return;
                    }
                    const n = u.NowGlobals.superRootPath;
                    yield d.FileUtils.recreateDirectory(n);
                    const r = u.NowGlobals.APP_NAME;
                    const i = this.showDownloadProjectProgressBar(r);
                    const s = u.NowGlobals.NOW_APP_SYS_ID;
                    const o = {
                        detail: s,
                        label: r
                    };
                    const a = h.Sync.getSrcRuntimeMap()[w.NowConstants.PROJECT.SYSTEM];
                    const c = Object.keys(a).map(e => {
                        if (a[e]) {
                            return e;
                        }
                    });
                    const l = (yield m.GatewayHelper.getArtefacts(s, "", c)).result;
                    t.Project.downloadCore(r, o, l, c, i);
                });
            },
            showApplicationPicker() {
                return r(this, undefined, undefined, function* () {
                    if (u.NowGlobals.SYSTEM_BUSY) {
                        return;
                    }
                    const e = f.Utils.getWSpath();
                    const n = g.ServiceNow.detectNowProject(e);
                    if (!n || n.length === 0) {
                        f.Utils.noAppsFoundPrompt();
                        f.Utils.hideFileStatusbarItems();
                        return;
                    }
                    const r = {
                        placeHolder: w.NowConstants.PROJECT.SELECT_APP_PLACEHOLDER
                    };
                    let s = [];
                    n.map(e => {
                        const t = {
                            label: e
                        };
                        if (e === u.NowGlobals.APP_NAME) {
                            t.description = "current";
                        }
                        s.push(t);
                    });
                    const o = yield i.window.showQuickPick(s, r);
                    if (!o) {
                        return;
                    }
                    const a = o.label;
                    l.Logger.log("Application Changed to ", a);
                    if (a !== u.NowGlobals.APP_NAME) {
                        yield t.Project.changeCurrentApplication(a);
                        return a;
                    }
                    else {
                        return undefined;
                    }
                });
            },
            generateApplicationStatusBarItem(e) {
                let t = u.NowGlobals.APPLICATION_STATUSBAR_ITEM;
                t || (t = u.NowGlobals.APPLICATION_STATUSBAR_ITEM = f.Utils.createStatusbarItem("nowvs.showApplicationPicker", e, "Select application", true, i.StatusBarAlignment.Right, 97));
                t.text = e;
            },
            changeCurrentApplication(e) {
                return r(this, undefined, undefined, function* () {
                    if (!u.NowGlobals.SYSTEM_BUSY && e) {
                        try {
                            u.NowGlobals.SYSTEM_BUSY = true;
                            f.Utils.closeOpenTabs();
                            f.Utils.clearCreds();
                            f.Utils.clearCache();
                            u.NowGlobals.APP_NAME = e;
                            f.Utils.loadAppNameVars(e);
                            if (yield h.Sync.loadGlobals()) {
                                this.ascertainProjectState();
                                y.UpdateSet.displayUpdatesetWrapper();
                                yield v.Snippets.loadDynamicSnippets();
                                u.NowGlobals.StaticNowMap = JSON.parse(JSON.stringify(x.StaticNowMap));
                                b.CustomFileTypes.updateStaticNowMap();
                                u.NowGlobals.CREATE_FILEGROUPS = [];
                                u.NowGlobals.CREATE_FILETYPES = [];
                                E.nowEventEmitter.emit(E.nowEvents.PROJECT_OPEN);
                            }
                            else {
                                E.nowEventEmitter.emit(E.nowEvents.CLEAR_CACHE);
                                y.UpdateSet.showUpdateSetLabel("");
                            }
                            t.Project.initProjectVars(e);
                            f.Utils.saveCurrentApplication(e);
                            _.MessageUtils.showInformationMessage(w.NowConstants.i18n.CURRENT_APP_CHANGE_PROMPT, e);
                            u.NowGlobals.SYSTEM_BUSY = false;
                        }
                        catch (e) {
                            t.Project.clearCurrentApp();
                            u.NowGlobals.SYSTEM_BUSY = false;
                            _.MessageUtils.showErrorMessage(w.NowConstants.i18n.CURRENT_APP_CHANGE_FAILURE);
                        }
                    }
                });
            },
            clearCurrentApp() {
                t.Project.generateApplicationStatusBarItem("");
                y.UpdateSet.showUpdateSetLabel("");
            },
            ensureCurrentApplication() {
                return r(this, undefined, undefined, function* () {
                    let e = "";
                    const n = f.Utils.getWSpath();
                    const r = u.NowGlobals.APP_NAME;
                    if (!r || !n) {
                        return false;
                    }
                    const i = s.join(n, r);
                    if (!r || !a.existsSync(i)) {
                        const r = g.ServiceNow.detectNowProject(n);
                        if (r.length === 0) {
                            f.Utils.noAppsFoundPrompt();
                            return false;
                        }
                        else {
                            e = yield t.Project.showApplicationPicker();
                            if (e) {
                                yield t.Project.changeCurrentApplication(e);
                                return true;
                            }
                            else {
                                yield t.Project.changeCurrentApplication(r[0]);
                                return false;
                            }
                        }
                    }
                    return true;
                });
            },
            isWorkspaceAvailable(e = true) {
                const t = i.workspace.workspaceFolders;
                if (t && t.length !== 0) {
                    return t[0].uri.fsPath;
                }
                else {
                    if (e) {
                        i.window.showErrorMessage(p.i18n.translate(w.NowConstants.i18n.NOWPROJECT_UNAVAILABLE), "Setup Workspace").then(e => {
                            if (e === "Setup Workspace") {
                                i.commands.executeCommand("nowvs.setupNowWorkspace");
                            }
                        });
                    }
                    return false;
                }
            },
            promptAndReadFolderName(e) {
                return r(this, undefined, undefined, function* () {
                    const t = yield i.window.showOpenDialog({
                        canSelectFiles: false,
                        canSelectFolders: true,
                        canSelectMany: false,
                        openLabel: e
                    });
                    if (t && t[0]) {
                        const e = t[0].fsPath;
                        return {
                            folderPath: e,
                            folderName: s.basename(e)
                        };
                    }
                });
            },
            showDownloadProjectProgressBar(e) {
                const t = w.NowConstants.PROJECT.PACKAGES_MAP_SINGULAR[u.NowGlobals.PACKAGE_TYPE];
                return f.Utils.showProgressBar(p.i18n.translate(w.NowConstants.i18n.DOWNLOADING_APP, t) + " " + e, false);
            },
            ascertainProjectState() {
                if (u.NowGlobals.NAME_SCOPE_MAP[w.NowConstants.PROJECT.ALL_APPLICATIONS][u.NowGlobals.APP_NAME].PROJECT_STATE !== "inconsistent") {
                    return true;
                }
                i.window.showErrorMessage(p.i18n.translate(w.NowConstants.i18n.PROJECT_INCONSISTENT_ERROR), {
                    modal: true
                }, "Reset Project").then(e => {
                    if (e === "Reset Project") {
                        t.Project.resetProjectCore();
                    }
                });
            }
        };
    