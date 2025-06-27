import { app as s, BrowserWindow as p } from "electron";
import { spawn as m } from "child_process";
import u from "http";
import { fileURLToPath as w } from "node:url";
import t from "node:path";
const d = t.dirname(w(import.meta.url));
process.env.APP_ROOT = t.join(d, "..");
const a = process.env.VITE_DEV_SERVER_URL, T = t.join(process.env.APP_ROOT, "dist-electron"), P = t.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = a ? t.join(process.env.APP_ROOT, "public") : P;
let n, r = null;
function v() {
  try {
    let o;
    if (a)
      o = t.join(process.env.APP_ROOT, "..", "Api");
    else {
      const e = t.join(t.dirname(s.getPath("exe")), "resources");
      o = t.join(e, "api-server");
    }
    console.log("Starting API server from:", o), r = m("node", ["server.js"], {
      cwd: o,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: "3002" }
      // Set the port explicitly
    }), r.stdout && r.stdout.on("data", (e) => {
      console.log(`API Server: ${e}`);
    }), r.stderr && r.stderr.on("data", (e) => {
      console.error(`API Server Error: ${e}`);
    }), r.on("close", (e) => {
      console.log(`API server process exited with code ${e}`), r = null;
    }), r.on("error", (e) => {
      console.error("Failed to start API server:", e), r = null;
    }), console.log("API server started with PID:", r.pid);
  } catch (o) {
    console.error("Error starting API server:", o);
  }
}
function c() {
  r && (console.log("Stopping API server..."), r.kill("SIGTERM"), r = null);
}
function A() {
  return new Promise((o) => {
    const e = {
      hostname: "localhost",
      port: 3002,
      path: "/",
      method: "GET",
      timeout: 1e3
    }, i = u.request(e, (f) => {
      o(f.statusCode === 200);
    });
    i.on("error", () => {
      o(!1);
    }), i.on("timeout", () => {
      o(!1);
    }), i.end();
  });
}
async function I(o = 10) {
  for (let e = 0; e < o; e++) {
    if (console.log(`Checking API health, attempt ${e + 1}/${o}`), await A())
      return console.log("API is ready!"), !0;
    await new Promise((i) => setTimeout(i, 1e3));
  }
  return console.error("API failed to start after maximum attempts"), !1;
}
function l() {
  n = new p({
    icon: t.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: t.join(d, "preload.mjs")
    }
  }), n.webContents.on("did-finish-load", () => {
    n == null || n.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), a ? n.loadURL(a) : n.loadFile(t.join(P, "index.html"));
}
s.on("window-all-closed", () => {
  c(), process.platform !== "darwin" && (s.quit(), n = null);
});
s.on("activate", () => {
  p.getAllWindows().length === 0 && l();
});
s.on("before-quit", () => {
  c();
});
s.on("will-quit", () => {
  c();
});
s.whenReady().then(async () => {
  v(), await I() ? (console.log("API is ready, creating window..."), l()) : (console.error("Failed to start API server, creating window anyway..."), l());
});
export {
  T as MAIN_DIST,
  P as RENDERER_DIST,
  a as VITE_DEV_SERVER_URL
};
