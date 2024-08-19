t.i18n = {
      CURRENT_LOCALE: "en-US",
      MESSAGES: {},
      getCurrentLocale() {
        return this.CURRENT_LOCALE;
      },
      setCurrentLocale(e) {
        this.CURRENT_LOCALE = e;
      },
      loadLocaleBundle() {
        const e = this.getCurrentLocale() + ".json";
        const t = r.join(o.NowGlobals.EXTENSION_PATH, a.NowConstants.PROJECT.OUT_DIR, "assets", "i18n", e);
        try {
          this.MESSAGES = JSON.parse(i.readFileSync(t).toString());
        } catch (e) {
          s.Logger.log("[loadLocaleBundle] error loading locale bundle ", e);
        }
      },
      translate(e, ...t) {
        let n = this.MESSAGES[e];
        if (n) {
          t.map((e, t) => {
            const r = new RegExp(`\\$\\{${t}\\}`, "g");
            n = n.replace(r, e);
          });
          return n;
        } else {
          return e;
        }
      }
    };