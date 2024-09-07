form: {
              script: n,
              sysparm_ck: t,
              runscript: "Run script",
              sys_scope: i,
              record_for_rollback: s,
              quota_managed_transaction: o
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

            GET Request /sys.scripts.do
            