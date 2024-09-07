t.uploadFile = new class {
      addAdditionalFields(e, t, n, r) {
        var i = c.NowGlobals.StaticNowMap.ExtensionsMap[t];
        if (i[g.NowConstants.SYNC.UPDATE]) {
          var s = i[g.NowConstants.SYNC.UPDATE];
          for (let t in s) {
            e[t] = s[t];
          }
        }
        if (!r) {
          return;
        }
        if (t === "sys_ui_policy") {
          e.short_description = n;
        } else if (t === "ecc_agent_capability_value_test") {
          e.capability = n;
        }
        if (i.create_tag) {
          const t = i.create_tag;
          if (t instanceof Array) {
            for (let r in t) {
              e[t[r]] = n;
            }
          } else {
            e[t] = n;
          }
        }
        let o = c.NowGlobals.APP_SCOPE;
        if (o && o !== g.NowConstants.PROJECT.GLOBAL_SCOPE) {
          switch (t) {
            case "sys_ui_script":
              e.script_name = n.replace(o + ".", "");
              break;
            case "cmn_map_page":
              e.suffix = n.replace(o + "_", "");
              break;
            case "sys_ui_macro":
              e.scoped_name = o + "_" + n;
              break;
            case "sys_ui_extension_point":
            case "sys_client_extension_point":
            case "sys_extension_point":
              e.api_name = o + "." + n;
          }
        }
      }
      uploadFile(e, t, n, i, s, a, p, d, v) {
        let w = this.getPostData(n, i, s, p, v);
        if (!w) {
          l.Sync.decrementCounter();
          return Promise.resolve("e");
        }
        if (!d) {
          w.name = s;
        }
        let _;
        let E;
        let k = this;
        function C(n, i, s, c) {
          return function (u, v, w) {
            return r(this, undefined, undefined, function* () {
              if (u) {
                l.Sync.setErrorAction(true);
                l.Sync.pushErrorFiles(s);
                l.Sync.decrementCounter();
                return;
              }
              if (!w || w.error || !w.result) {
                const r = w ? w.result || w.error : "";
                y.Insights.sendEvent({
                  eventType: "Sync Detail",
                  sysName: p,
                  fileAction: "upload",
                  status: "failure",
                  failureReason: r,
                  realm: c
                });
                l.Sync.setErrorAction(true);
                l.Sync.pushErrorFiles(s);
                if (d) {
                  if (w && w.error && w.error.message !== "Operation Failed") {
                    b.MessageUtils.showErrorMessage(g.NowConstants.i18n.FILE_CHANGES_FAILED, s);
                  }
                  h.downloadFile.downloadFile(e, t, p, a, s, i, n, d, c);
                } else {
                  yield m.syncUtils.deleteFileLocally(n, i, s, c);
                  l.Sync.pushDeleteFileList(n, i, s, c);
                  b.MessageUtils.showErrorMessage(x.i18nConstants.FILE_CREATION_ERROR, `${s} - ${w.error.detail}`);
                }
                k.postUploadFile(e, t, c);
                return Promise.resolve();
              }
              f.Logger.log("[onFileUploadResponse] After getting response before reducing counter: ", l.Sync.getCounter().toString());
              let r = w.result;
              let v = r[g.NowConstants.SYNC.SYS_UPDATED_ON];
              if (d) {
                y.Insights.sendEvent({
                  eventType: "Sync Detail",
                  sysName: p,
                  fileAction: "upload",
                  realm: c
                });
              } else {
                y.Insights.sendEvent({
                  eventType: "Sync Detail",
                  sysName: p,
                  fileAction: "create-client",
                  realm: c
                });
                let e = r[g.NowConstants.PROJECT.SYS_ID];
                let t = l.Sync.getRuntimeMap(c);
                m.syncUtils.ensureJSONStructure(t, n, i, s);
                t[n][i][s][g.NowConstants.PROJECT.SYS_ID] = e;
                if (o.Utils.isGlobalApp()) {
                  l.Sync.globalFilesForCreate.push([e, p]);
                }
              }
              let _ = o.Utils.getTimeInMilliSeconds(v);
              l.Sync.setSuccessAction(true);
              const E = l.Sync.getRuntimeMap(c)[n][i][s];
              E[g.NowConstants.SYNC.SYS_UPDATED_ON] = v;
              E[g.NowConstants.SYNC.LASTMODIFIED] = o.Utils.getTimeInMilliSeconds();
              E[g.NowConstants.SYNC.LIVE] = true;
              E[g.NowConstants.SYNC.UNCHANGED] = true;
              E[g.NowConstants.SYNC.SERVER_MOD_TIME] = _;
              E[g.NowConstants.SYNC.CURRENT_SERVER_MOD_TIME] = _;
              let C = E[g.NowConstants.SYNC.CURRENT_LOCAL_MOD_TIME];
              E[g.NowConstants.SYNC.LOCAL_MOD_TIME] = C;
              if (e && !d) {
                E[g.NowConstants.SYNC.LOCAL_MOD_TIME] = _;
                E[g.NowConstants.SYNC.CURRENT_LOCAL_MOD_TIME] = _;
              }
              k.postUploadFile(e, t, c);
            });
          };
        }
        l.Sync.setHaveAPICalls(true);
        this.addAdditionalFields(w, p, s, !d);
        if (v) {
          try {
            _ = l.Sync.getRuntimeMap(v)[n][i][s].scopeId;
            E = c.NowGlobals.updateSets.get(l.Sync.getRuntimeMap(v)[n][i][s].scopeId).sysId;
          } catch (e) {
            m.syncUtils.deleteFileLocally(n, i, s, v);
            l.Sync.decrementCounter();
            return Promise.resolve();
          }
        } else {
          _ = o.Utils.isGlobalApp() ? g.NowConstants.PROJECT.GLOBAL_SCOPE : c.NowGlobals.NOW_APP_SYS_ID;
          E = c.NowGlobals.sessionUpdateset.sysId;
        }
        if (d) {
          return u.GatewayHelper.putFileContentAsync(C(n, i, s, v), p, a, w, _, E);
        } else {
          return u.GatewayHelper.postFileContentAsync(C(n, i, s, v), p, w, E);
        }
      }
      getPostData(e, t, n, r, u) {
        let h = {};
        const d = c.NowGlobals.StaticNowMap.ExtensionsMap[r];
        const m = d.tags;
        let g = false;
        if (Object.keys(m).length > 1) {
          g = true;
        }
        for (let c in m) {
          let y = m[c];
          let v = "";
          v = g ? `${n}${i.sep}${n}.${c}.${y}` : `${n}.${c}.${y}`;
          let b = o.Utils.getPath(e, t, v, u);
          if (!s.existsSync(b)) {
            continue;
          }
          const x = d.validation && d.validation[y];
          let w;
          let _;
          if (x) {
            if (y === "js") {
              const e = x.ignoreRules;
              if (e) {
                w = e[c];
              }
            } else if (y === "html" || y === "xml") {
              const e = x.applyRules;
              if (e) {
                _ = e[c];
              }
            }
          }
          let E = a.FileUtils.readFileSync(b);
          if (!p.syntaxChecker.isCodeValid(b, {
            ignoreRule: w,
            validationType: _,
            sysName: r
          }, E)) {
            f.Logger.log(`[uploadFile] code of ${n} is not valid. Hence not doing any API call. `);
            l.Sync.setSyntaxError(true);
            return null;
          }
          h[c] = o.Utils.removeContent(E, y, r, c);
        }
        return h;
      }
      overwriteFileInServer(e, t, n, r, i) {
        const s = o.Utils.getSysnameFromCovername(t, n);
        let a = "";
        if (r) {
          a = l.Sync.getRuntimeMap(i)[n][t][e][g.NowConstants.PROJECT.SYS_ID];
        }
        l.Sync.incrementCounter();
        l.Sync.incrementCounter();
        return this.uploadFile(true, false, n, t, e, a, s, r, i).then(e => {
          l.Sync.refreshSyncStatusFlags();
          l.Sync.decrementCounter();
          return e;
        });
      }
      forcePushFile(e) {
        return r(this, undefined, undefined, function* () {
          if (c.NowGlobals.SYSTEM_BUSY) {
            return;
          }
          if (!(yield l.Sync.loadGlobals())) {
            return;
          }
          c.NowGlobals.SYSTEM_BUSY = true;
          f.Logger.log("Force pushing the file: ", e);
          const r = a.FileUtils.getFileMetadataByPath(e);
          if (!r && r.sysId) {
            return;
          }
          const {
            superCoverName: s,
            coverName: o,
            fileName: u,
            appName: p
          } = r;
          let {
            realm: h
          } = r;
          let d = true;
          h = h === g.NowConstants.PROJECT.NOWPROJECT_ROOT ? "" : p;
          const m = l.Sync.getRuntimeMap(h);
          if (!m[s]?.[o]?.[u]?.[g.NowConstants.PROJECT.SYS_ID]) {
            d = false;
          }
          const v = a.FileUtils.getFileTimeStamp(e);
          if (d) {
            m[s][o][u][g.NowConstants.SYNC.CURRENT_LOCAL_MOD_TIME] = v;
          }
          this.overwriteFileInServerWrapper(u, o, s, d, h).then(e => {
            y.Insights.sendEvent({
              eventType: "Sync",
              syncType: "Auto sync on save",
              status: "success"
            });
            f.Logger.log("[After force push file]", e);
            c.NowGlobals.SYSTEM_BUSY = false;
            c.NowGlobals.TRIGGER_KEYBINDING = false;
          }, e => {
            y.Insights.sendEvent({
              eventType: "Sync",
              syncType: "Auto sync on save",
              status: "failure",
              failureReason: e
            });
            f.Logger.log("error in force push file", e.toString());
            c.NowGlobals.SYSTEM_BUSY = false;
            c.NowGlobals.TRIGGER_KEYBINDING = false;
          });
        });
      }
      overwriteFileInServerWrapper(e, t, n, i, s) {
        return r(this, undefined, undefined, function* () {
          let r = l.Sync.getRuntimeMap(s);
          if (s) {
            let i = r[n][t][e].scopeId;
            i ||= yield o.Utils.loadScopeDetailsForScratchFile({
              superCoverName: n,
              coverName: t,
              fileName: e
            });
            let a = c.NowGlobals.updateSets.get(i);
            if (!a) {
              yield v.UpdateSet.displayScratchFileUpdateSet();
            }
            a = c.NowGlobals.updateSets.get(i);
            let l = c.NowGlobals.SYNC_ON_SAVE_CACHE.get(a.sysId);
            if (!l) {
              const e = yield u.GatewayHelper.getUpdateSetsDefaultStatusAsync(a.sysId);
              if (!e || e.error) {
                return Promise.resolve();
              }
              e.result.forEach(e => c.NowGlobals.SYNC_ON_SAVE_CACHE.set(e.sys_id, e.is_default));
              l = c.NowGlobals.SYNC_ON_SAVE_CACHE.get(a.sysId);
            }
            if (l === "true") {
              m.syncUtils.showUpdateSetPrompt(d.i18n.translate(g.NowConstants.i18n.CANNOT_SYNC_DEFAULT_UPDATESET), s);
              return Promise.resolve();
            }
          }
          return this.overwriteFileInServer(e, t, n, i, s);
        });
      }
      postUploadFile(e, t, n) {
        return r(this, undefined, undefined, function* () {
          l.Sync.decrementCounter();
          if (e) {
            o.Utils.writeRuntimeMap(l.Sync.getRuntimeMap(n), true, n);
          }
          if (l.Sync.getCounter() === 0) {
            return l.Sync.postSyncProcess(t, e, n);
          }
          c.NowGlobals.SYSTEM_BUSY = false;
          c.NowGlobals.TRIGGER_KEYBINDING = false;
        });
      }
      uploadFileWrapper(e, t, n, i, s, o, a, c, u) {
        return r(this, undefined, undefined, function* () {
          l.Sync.incrementCounter();
          return this.activateUpdateSet(n, i, s, u).then(() => this.uploadFile(e, t, n, i, s, o, a, c, u)).catch(() => {});
        });
      }
      activateUpdateSet(e, t, n, i) {
        return r(this, undefined, undefined, function* () {
          if (i && !o.Utils.canSetUpdateSetInUrl()) {
            const r = l.Sync.getRuntimeMap(i)[e][t][n].scopeId;
            const s = l.Sync.scratchSyncHandler.inactiveUpdateSets;
            if (s.has(r)) {
              const e = s.get(r);
              s.delete(r);
              yield u.GatewayHelper.setCurrentUpdateset(e, r);
              return Promise.resolve();
            }
          }
          return Promise.resolve();
        });
      }
    };