t.FileUtils = {
            isThreeLevel(e) {
                const t = o.parse(o.resolve(e, "..", "..")).name;
                return !!l.NowGlobals.StaticNowMap.SysNamesMap.hasOwnProperty(t);
            },
            getFileMetadataBySysId(e) {
                return new Promise((t, n) => r(this, undefined, undefined, function* () {
                    if (typeof e == "string") {
                        e = new Set([e]);
                    }
                    if (!e || e.size === 0) {
                        return n("Invalid input");
                    }
                    const r = yield this.searchRuntimeMapBySysId(e, p.NowConstants.PROJECT.REALM_SCRATCH);
                    const i = yield this.searchRuntimeMapBySysId(e, p.NowConstants.PROJECT.REALM_SRC);
                    const s = new Map();
                    r.forEach((e, t) => {
                        s.set(t, e);
                    });
                    i.forEach((e, t) => {
                        if (s.has(t)) {
                            s.get(t).push(...e);
                        }
                        else {
                            s.set(t, e);
                        }
                    });
                    t(s);
                }));
            },
            searchRuntimeMapBySysId(e, t) {
                return r(this, undefined, undefined, function* () {
                    let n;
                    let r;
                    const i = new Map();
                    if (t === p.NowConstants.PROJECT.REALM_SRC) {
                        n = d.Sync.getSrcRuntimeMap();
                        r = l.NowGlobals.rootPath;
                    }
                    else {
                        n = d.Sync.getScratchRuntimeMap();
                        r = l.NowGlobals.scratchPath;
                    }
                    for (let s in n) {
                        if (s === p.NowConstants.PROJECT.SYSTEM) {
                            continue;
                        }
                        const a = n[s];
                        for (let n in a) {
                            const c = a[n];
                            for (let a in c) {
                                const u = c[a];
                                const { sys_id: l } = u;
                                if (!e.has(l)) {
                                    continue;
                                }
                                const d = f.syncUtils.getTagsObj(s, n);
                                if (!d) {
                                    continue;
                                }
                                let m;
                                if (t === p.NowConstants.PROJECT.REALM_SRC) {
                                    m = o.join(r, s, n);
                                }
                                else {
                                    yield h.Utils.ensureScratchFileHasScopeDetails(u, {
                                        superCoverName: s,
                                        coverName: n,
                                        fileName: a
                                    });
                                    const { packageName: e } = u;
                                    if (!e) {
                                        continue;
                                    }
                                    const t = h.Utils.sanitizeFileName(e);
                                    m = o.join(r, t, s, n);
                                }
                                const g = Object.getOwnPropertyNames(d);
                                if (g.length > 1) {
                                    m = o.join(m, a);
                                }
                                const y = [];
                                g.forEach(e => {
                                    const n = d[e];
                                    const r = `${a}.${e}.${n}`;
                                    const i = o.join(m, r);
                                    y.push({
                                        realm: t,
                                        tagName: e,
                                        tagPath: i,
                                        ext: n
                                    });
                                });
                                i.set(l, y);
                                if (i.size === e.size) {
                                    return i;
                                }
                            }
                        }
                    }
                    return i;
                });
            },
            getFileMetadataByPath(e) {
                if (!e) {
                    return;
                }
                o.parse(e).name.split(".").pop();
                const i = e.substr(l.NowGlobals.WS_PATH.length + 1);
                let [s, a, ...c] = i.split(o.sep);
                const u = a === p.NowConstants.PROJECT.REALM_SCRATCH;
                const f = a === p.NowConstants.PROJECT.BGSCRIPTS_FOLDER;
                const m = a === p.NowConstants.PROJECT.SYSTEM;
                let g = {};
                if (u) {
                    s = c.shift();
                }
                if (f) {
                    g.code = p.NowConstants.PROJECT.ERROR_CODE_BGSCRIPTS;
                    return g;
                }
                if (m) {
                    g.code = p.NowConstants.PROJECT.ERROR_CODE_SYSTEM_FILE;
                    return g;
                }
                const [y, v] = c;
                const b = c.pop().split(".");
                const x = b.pop();
                const w = b.pop();
                const _ = b.join(".");
                const E = h.Utils.getSysnameFromCovername(v, y);
                g = {
                    appName: s,
                    coverName: v,
                    superCoverName: y,
                    sysName: E,
                    type: h.Utils.getFileTypeBySysName(E, w)
                };
                if (!h.Utils.checkFilePathInCurrentApp(e)) {
                    g.code = p.NowConstants.PROJECT.ERROR_CODE_ALIEN_FILE;
                    return g;
                }
                const k = (u ? d.Sync.getScratchRuntimeMap() : d.Sync.getSrcRuntimeMap())?.[y]?.[v]?.[_];
                if (!k) {
                    g.code = p.NowConstants.PROJECT.ERROR_CODE_NEW_FILE;
                    return g;
                }
                const { sys_id: C } = k;
                return Object.assign(Object.assign({}, g), {
                    sysId: C,
                    fileName: _,
                    fieldName: w,
                    ext: x,
                    realm: a
                });
            },
            parseFilePath(e, t = false) {
                const n = o.basename(e).split(".").slice(0, -2).join(".");
                if (!n) {
                    return;
                }
                const r = o.parse(e);
                const i = r.name.split(".").pop();
                if (r.ext === ".now") {
                    t = true;
                }
                if (!t && !this.isThreeLevel(e)) {
                    e = o.dirname(e);
                }
                const s = o.dirname(e);
                const a = o.dirname(s);
                const c = o.dirname(a);
                const u = o.basename(s);
                const p = o.basename(a);
                const d = o.basename(c);
                const f = l.NowGlobals.scratchPath || "";
                let m;
                if (e.indexOf(f) !== -1) {
                    m = d;
                }
                const g = h.Utils.getSysnameFromCovername(u, p);
                return {
                    superCoverName: p,
                    coverName: u,
                    fileName: n,
                    srcOrAppName: d,
                    sysName: g,
                    type: h.Utils.getFileTypeBySysName(g, i),
                    realm: m
                };
            },
            getUserRootPath: () => c.env.HOME || c.env.HOMEPATH || c.env.USERPROFILE,
            findOrCreateFileTypeDirectory(e, n, r) {
                let i = l.NowGlobals.rootPath || "";
                if (r) {
                    i = o.join(l.NowGlobals.superRootPath, p.NowConstants.PROJECT.NOWPROJECT_SCRATCH, r);
                }
                let s = o.join(i, n);
                let a = o.join(s, e);
                t.FileUtils.createFolder(a);
                return a;
            },
            createFolder(e) {
                s.ensureDirSync(e);
            },
            createFile(e, t, n, r) {
                if (r) {
                    try {
                        i.unlinkSync(e);
                    }
                    catch (e) { }
                }
                else {
                    r = {};
                }
                i.writeFile(e, t, r, e => {
                    if (e) {
                        u.Logger.error(e);
                    }
                    if (n) {
                        n();
                    }
                });
            },
            createFileSync(e, t) {
                i.writeFileSync(e, t);
            },
            writeFileSync(e, t) {
                i.writeFileSync(e, t);
            },
            getTagsFronSysName: e => l.NowGlobals.StaticNowMap.ExtensionsMap[e].tags,
            getPrologueContent(e, t, n, r) {
                const s = t + "." + n + "." + r + ".ft";
                const a = o.join(e, "assets", "file-templates", s);
                let c = "";
                try {
                    c = i.readFileSync(a).toString();
                }
                catch (e) { }
                return c;
            },
            isDirectory(e) {
                try {
                    return i.lstatSync(e).isDirectory();
                }
                catch (e) {
                    return false;
                }
            },
            filterHiddenFiles: e => e.filter(e => !/(^|\/)\.[^\/\.]/g.test(e)),
            getFileTimeStamp(e) {
                const t = i.statSync(e);
                return new Date(a.inspect(t.mtime)).getTime();
            },
            readFileSync: e => i.readFileSync(e).toString(),
            isFileExist: e => i.existsSync(e),
            deleteFileSync(e) {
                i.unlinkSync(e);
            },
            deleteFileAsync(e) {
                i.unlink(e, e => { });
            },
            deleteFolderContentSync(e) {
                let t = i.readdirSync(e);
                for (let n = 0; n < t.length; n++) {
                    try {
                        i.unlinkSync(o.join(e, t[n]));
                    }
                    catch (e) {
                        u.Logger.log(e);
                    }
                }
            },
            deletefolder(e) {
                if (i.existsSync(e)) {
                    s.removeSync(e);
                }
            },
            recreateDirectory(e) {
                return r(this, undefined, undefined, function* () {
                    if (c.platform === "win32") {
                        yield t.FileUtils.deleteFolderRecursive(e);
                    }
                    else {
                        s.removeSync(e);
                    }
                    i.mkdirSync(e);
                });
            },
            deleteFolderRecursive(e) {
                return r(this, undefined, undefined, function* () {
                    try {
                        if (i.existsSync(e)) {
                            i.readdirSync(e).forEach(function (n, s) {
                                return r(this, undefined, undefined, function* () {
                                    var r = o.join(e, n);
                                    if (i.lstatSync(r).isDirectory()) {
                                        yield t.FileUtils.deleteFolderRecursive(r);
                                    }
                                    else {
                                        i.unlinkSync(r);
                                    }
                                });
                            });
                            i.rmdirSync(e);
                        }
                    }
                    catch (e) {
                        u.Logger.error(e);
                    }
                });
            },
            validateFileName: e => e.indexOf("/") === -1 && e.indexOf("\\") === -1 && e.indexOf(":") === -1,
            isDirectoryEmpty(e) {
                const t = i.readdirSync(e);
                return !t || t.length === 0;
            },
            isValidFileName: e => /^[^\\/:\*\?"<>\|]+$/.test(e)
        };
    