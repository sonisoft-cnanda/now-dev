t.BackgroundScriptRunner = new class {
      executeScript(e, t, n = "global", i = "on", s = "on") {
        return r(this, undefined, undefined, function* () {
          let r;
          try {
            if (!(yield this.callAnyService())) {
              return;
            }
            let a = yield this.retrieveSysScriptsPageCSRFToken();
            r = yield this.executeBackgroundScriptInSession(e, a, t, n, i, s);
          } catch (t) {
            const n = u.i18n.translate(l.NowConstants.i18n.BACKGROUND_SCRIPT_EXECUTION_ERROR) + "\n";
            if (e) {
              this.outputResult(n);
            }
          } finally {
            delete o.NowGlobals.COOKIEJAR;
          }
          return r;
        });
      }
      callAnyService() {
        return r(this, undefined, undefined, function* () {
          return yield a.GatewayHelper.authenticateUser();
        });
      }
      retrieveSysScriptsPageCSRFToken() {
        return r(this, undefined, undefined, function* () {
          const e = yield a.GatewayHelper.retrieveSysScriptsPageCSRFToken();
          let t = "<input name=\"sysparm_ck\" type=\"hidden\" value=\"";
          if (e.error || e.name === "StatusCodeError") {
            c.Logger.error(e.error);
            return;
          }
          let n = e.substring(e.indexOf(t));
          return n.substring(0, n.indexOf("\">")).replace(t, "");
        });
      }
      executeBackgroundScriptInSession(e, t, n, i = "global", s = "on", o = "on") {
        return r(this, undefined, undefined, function* () {
          var r = {
            form: {
              script: n,
              sysparm_ck: t,
              runscript: "Run script",
              sys_scope: i,
              record_for_rollback: "on",
              quota_managed_transaction: "on"
            }
          };
          let c = yield a.GatewayHelper.executeBackgroundScript(null, r);
          if (c && !c.error && c.name !== "StatusCodeError") {
            if (e) {
              this.outputResult(c);
            }
            return c;
          }
          {
            const e = u.i18n.translate(l.NowConstants.i18n.BACKGROUND_SCRIPT_EXECUTION_ERROR) + "\n";
            this.outputResult(e);
          }
        });
      }
      outputResult(e) {
        return r(this, undefined, undefined, function* () {
          if (o.NowGlobals.BACKGROUND_SCRIPT_WEBVIEW_PANEL) {
            o.NowGlobals.BACKGROUND_SCRIPT_WEBVIEW_PANEL.dispose();
          }
          const t = i.window.createWebviewPanel("WebView", "Title", i.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [i.Uri.file(s.join(o.NowGlobals.EXTENSION_PATH, l.NowConstants.PROJECT.OUT_DIR, "assets", "jstree"))]
          });
          o.NowGlobals.BACKGROUND_SCRIPT_WEBVIEW_PANEL = t;
          t.title = "Background script output";
          let n = new RegExp(/ HREF='/g);
          e = e.replace(n, " HREF='" + o.NowGlobals.url + "/");
          n = new RegExp(/ href='/g);
          e = e.replace(n, " href='" + o.NowGlobals.url + "/");
          t.webview.html = e;
        });
      }
    };