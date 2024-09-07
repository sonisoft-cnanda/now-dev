 class y {
            constructor() { }
            static get() {
                return y.instance ?? (y.instance = new y());
            }
            getFileName() {
                return `${l.ReferencesUtils.getScriptIncludeScope(this.searchWord)}.${this.searchWord}`;
            }
            getScriptIncludeAPI(siName, scope) {
                return `/api/now/table/sys_script_include?sysparm_query=api_name%3D${scope}.${siName}`;
            }
            getFileContentAPI(table, t, sys_id) {
                return `/api/now/table/${table}?sysparm_query=sys_id=${sys_id}&sysparm_fields=sys_id,${t},sys_name,sys_class_name,sys_package,sys_package.name,sys_scope,sys_scope.name,sys_scope.scope&sysparm_exclude_reference_link=true`;
            }
          
            getScriptIncludeURI(e, t, n = false) {
                return r(this, undefined, undefined, function* () {
                    let r = null;
                    const s = this.getScriptIncludePaths(e);
                    if (s.length === 0) {
                        r = i.Uri.parse(`ref:${e}.script.js`).with({
                            query: this.getScriptIncludeAPI(e, t),
                            fragment: "sys_script_include",
                            authority: t,
                            path: `/${e}.script.js`
                        });
                    }
                    else if (n) {
                        r = i.Uri.file(s[0]);
                    }
                    if (r) {
                        return [{
                                targetUri: r,
                                targetRange: new i.Range(new i.Position(0, 0), new i.Position(0, 0))
                            }];
                    }
                    else {
                        return [];
                    }
                });
            }
            getScriptIncludePaths(e) {
                const s = "sys_script_include";
                let a = p.Sync.getSrcRuntimeMap();
                const { superCoverName: u, coverName: l } = c.Utils.getCoverNamesFromSysname(s);
                let d = [];
                let f = a[u]?.[l]?.[e];
                if (f) {
                    d.push(...h.syncUtils.getPeerFilePaths(u, l, e, s, null));
                }
                a = p.Sync.getScratchRuntimeMap();
                f = a[u]?.[l]?.[e];
                if (f) {
                    const t = c.Utils.sanitizeFileName(f.packageName);
                    d.push(...h.syncUtils.getPeerFilePaths(u, l, e, s, t));
                }
                return d.filter(e => o.existsSync(e));
            }
            openReferenceFile(e) {
                const t = e.tagAlias;
                const n = e.fileName;
                const r = e.tableName;
                const s = e.sysId;
                const o = e.lineNo;
                const a = e.applicationLabel.toLowerCase();
                let c;
                const u = l.ReferencesUtils.getTagNameFromAlias(r, t);
                const p = this.getReferenceFilePaths(r, s, u);
                if (p && p.length > 0) {
                    c = i.Uri.file(p[0]);
                }
                else {
                    c = i.Uri.parse(`ref:${n}.${u}.js`).with({
                        query: this.getFileContentAPI(r, u, s),
                        fragment: r,
                        authority: a,
                        path: `/${u}/${a}/${n}.${u}.js`
                    });
                }
                this.openFile(c, o);
            }
            getReferenceFilePaths(e, t, n) {
                if (!n) {
                    return;
                }
                const { superCoverName: r, coverName: i } = c.Utils.getCoverNamesFromSysname(e);
                let s = [];
                s.push(this.getFilePathFromMap(p.Sync.getSrcRuntimeMap(), r, i, t, e, n));
                if (s.length === 0 || !s[0]) {
                    s.push(this.getFilePathFromMap(p.Sync.getScratchRuntimeMap(), r, i, t, e, n));
                }
                return s.filter(e => e && o.existsSync(e));
            }
            getFilePathFromMap(e, t, n, r, i, s) {
                const a = e[t]?.[n];
                if (a) {
                    const e = this.filterBySysId(a, r);
                    if (e && e.length > 0) {
                        let r;
                        if (a[e[0]].packageName) {
                            r = c.Utils.sanitizeFileName(a[e[0]].packageName);
                        }
                        return this.getTagPath(t, n, e[0], i, s, r);
                    }
                }
            }
            getTagPath(e, t, n, r, i, o) {
                const l = o ? s.join(u.NowConstants.PROJECT.NOWPROJECT_SCRATCH, o) : u.NowConstants.PROJECT.NOWPROJECT_ROOT;
                let p = s.join(c.Utils.getWSpath(), a.NowGlobals.APP_NAME, l, e, t);
                const d = a.NowGlobals.StaticNowMap.ExtensionsMap[r];
                if (h.syncUtils.isMultiTag(d)) {
                    p = s.join(p, n);
                }
                if (d.tags[i]) {
                    return s.join(p, [n, i, d.tags[i]].join("."));
                }
                else {
                    return "";
                }
            }
            filterBySysId(e, t) {
                return Object.keys(e).filter(n => {
                    const r = e[n];
                    return r.sys_id && r.sys_id === t;
                });
            }
            static downloadVirtualFile(e) {
                return r(this, undefined, undefined, function* () {
                    if (!a.NowGlobals.SYSTEM_BUSY) {
                        a.NowGlobals.SYSTEM_BUSY = true;
                        try {
                            const t = e;
                            const n = t.query;
                            const r = t.fragment;
                            const s = t.path.split(".")[0].substr(1);
                            if (!h.syncUtils.isTableSupported(r)) {
                                f.MessageUtils.showErrorMessage(u.NowConstants.i18n.REFERENCES_FILE_TYPE_NOT_SUPPORTED, s);
                                a.NowGlobals.SYSTEM_BUSY = false;
                                return;
                            }
                            let c = "&sysparm_fields=sys_id,sys_name,sys_class_name,sys_package,sys_package.name,sys_scope,sys_scope.name,sys_scope.scope";
                            c = `${c}${"&sysparm_exclude_reference_link=true"}`;
                            const { result: l } = yield m.GatewayHelper.getQuery(`${n}${c}`);
                            if (!l || !l[0]) {
                                f.MessageUtils.showErrorMessage(u.NowConstants.i18n.REFERENCES_VIRTUAL_FILE_DOWNLOAD_FAILED, s);
                                a.NowGlobals.SYSTEM_BUSY = false;
                                return;
                            }
                            yield i.commands.executeCommand("workbench.action.closeActiveEditor");
                            let p = {
                                selectedFileType: r,
                                selectedFiles: []
                            };
                            let v = {
                                sysId: l[0].sys_id
                            };
                            const b = (yield d.FileUtils.searchRuntimeMapBySysId(new Set().add(v.sysId), "scratch")).get(v.sysId);
                            let x = false;
                            if (b && b.length > 0) {
                                for (let e in b) {
                                    const t = b[e].tagPath;
                                    if (o.existsSync(t)) {
                                        y.get().openFile(i.Uri.file(t));
                                        x = true;
                                    }
                                }
                            }
                            if (x) {
                                a.NowGlobals.SYSTEM_BUSY = false;
                                return;
                            }
                            v.fileName = l[0].sys_name;
                            v.sysName = l[0].sys_class_name;
                            v.packageId = l[0].sys_package;
                            v.packageName = l[0]["sys_package.name"];
                            v.scopeId = l[0].sys_scope;
                            v.scopeName = l[0]["sys_scope.name"];
                            v.scopeValue = l[0]["sys_scope.scope"];
                            p.selectedFiles.push(v);
                            g.FileSearch.searchFile(p);
                        }
                        catch (e) {
                            a.NowGlobals.SYSTEM_BUSY = false;
                        }
                    }
                });
            }
        }