 t.diffViewer = new class {
      openDiffWithServerVersion(e, t, n, l) {
        const p = i.syncUtils.getTagsObj(e, t, n);
        let h = s.NowGlobals.rootPath ? s.NowGlobals.rootPath : "";
        const d = o.Utils.getSysnameFromCovername(t, e);
        let f = (l ? a.Sync.getScratchRuntimeMap() : a.Sync.getSrcRuntimeMap())[e][t][n][u.NowConstants.PROJECT.SYS_ID];
        let m = false;
        if (Object.keys(p).length > 1) {
          m = true;
        }
        if (l) {
          h = r.join(s.NowGlobals.scratchPath, l);
        }
        for (let i in p) {
          const s = p[i];
          let a = "";
          a = m ? r.join(h, e, t, n, `${n}.${i}.${s}`) : r.join(h, e, t, `${n}.${i}.${s}`);
          const u = `now:${d}/${f}/${i}.${s}`;
          if (c.FileUtils.isFileExist(a)) {
            o.Utils.showDiff(u, a);
          }
        }
      }
    }();