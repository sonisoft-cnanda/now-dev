 getScopeFromUri(e) {
                return r(this, undefined, undefined, function* () {
                    try {
                        if (e.scheme === f.ReferencesConstants.fileSchemeRef) {
                            let t = e.authority;
                            const n = a.NowGlobals.sysScopeNameValueMap[t];
                            return n || t;
                        }
                        {
                            const r = e.fsPath.substr(a.NowGlobals.WS_PATH.length + 1);
                            let [s, l, ...f] = r.split(o.sep);
                            const m = l === u.NowConstants.PROJECT.REALM_SCRATCH;
                            if (l === u.NowConstants.PROJECT.BGSCRIPTS_FOLDER) {
                                return c.Utils.getAppScope();
                            }
                            if (!m) {
                                return c.Utils.getAppScope();
                            }
                            s = f.shift();
                            const [g, y] = f;
                            const v = f.pop().split(".");
                            v.pop();
                            const b = v.pop();
                            const x = v.join(".");
                            const w = h.Sync.getScratchRuntimeMap();
                            const _ = w?.[g]?.[y]?.[x];
                            if (!_) {
                                return c.Utils.getAppScope();
                            }
                            let E = _.scopeValue;
                            if (!E) {
                                const e = c.Utils.getSysnameFromCovername(y, g);
                                const t = _.sys_id;
                                let n = "&sysparm_fields=sys_id,sys_name,sys_class_name,sys_package,sys_package.name,sys_scope,sys_scope.name,sys_scope.scope";
                                n = `${n}${"&sysparm_exclude_reference_link=true"}`;
                                const r = p.default.get().getFileContentAPI(e, b, t);
                                const { result: i } = yield d.GatewayHelper.getQuery(`${r}${n}`);
                                if (i && i[0]) {
                                    _.scopeValue = i[0]["sys_scope.scope"];
                                    c.Utils.writeRuntimeMap(w, true, "scratch");
                                    return _.scopeValue;
                                }
                            }
                            return E || c.Utils.getAppScope();
                        }
                    }
                    catch (e) {
                        return null;
                    }
                });
            }