// ==UserScript==
// @name         Quotex Server License & Bootstrap Client
// @namespace    https://demotoliveadmin.lovable.app
// @version      3.0.0
// @description  Clean server-connected license client & bootstrap loader for demotoliveadmin.lovable.app
// @author       TRADER EYASIN
// @match        *://qxbroker.com/*
// @match        *://quotex.io/*
// @match        *://quotex-market.com/*
// @match        *://market-qx.*/*
// @match        *://*.quotex.*/*
// @match        *://*.qxbroker.*/*
// @match        *://*.market-qx.*/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// @connect      demotoliveadmin.lovable.app
// @connect      *.lovable.app
// @run-at       document-start
// ==/UserScript==

(function () {
  const SERVER_URL = "https://demotoliveadmin.lovable.app";
  const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

  if (pageWin.__qxServerClientRunning) {
    if (typeof pageWin.__qxOpenLicenseModal === "function") {
      pageWin.__qxOpenLicenseModal();
    }
    return;
  }

  function purgeLegacyAdminStorage() {
    try {
      if (localStorage.getItem("qx_lovable_clean_v30") === "1") return;
      [
        "appActivation",
        "appDeviceToken",
        "customDeviceId",
        "active_license_key",
        "active_device_token",
        "lastVerified",
        "qxCustomProxyUrl"
      ].forEach((k) => localStorage.removeItem(k));
      localStorage.setItem("qx_lovable_clean_v30", "1");
    } catch (e) {}
  }

  purgeLegacyAdminStorage();

  // 1. Storage Helpers
  function getDeviceId() {
    let id = localStorage.getItem("app_device_id");
    if (!id) {
      id = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
        ? crypto.randomUUID()
        : "dev_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
      localStorage.setItem("app_device_id", id);
    }
    return id;
  }

  function getStoredAuth() {
    return {
      key: (localStorage.getItem("app_license_key") || "").trim(),
      token: (localStorage.getItem("app_device_token") || "").trim(),
      deviceId: getDeviceId()
    };
  }

  function saveAuth(key, token) {
    const cleanKey = String(key || "").trim();
    const cleanToken = String(token || "").trim();
    if (cleanKey) localStorage.setItem("app_license_key", cleanKey);
    if (cleanToken) localStorage.setItem("app_device_token", cleanToken);
  }

  function clearAuth() {
    try {
      localStorage.removeItem("app_license_key");
      localStorage.removeItem("app_device_token");
    } catch (e) {}
  }

  // 2. Multi-Transport API Helpers (MV3 Extension -> Direct Fetch -> Tampermonkey GM)
  function parseJsonSafe(text) {
    if (!text || typeof text !== "string") return null;
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function fetchJson(url, bodyStr) {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: bodyStr
    })
      .then(async (res) => {
        const text = await res.text();
        const parsed = parseJsonSafe(text);
        if (!parsed) {
          return {
            ok: false,
            status: res.status,
            data: { valid: false, reason: "invalid_response", detail: "HTTP " + res.status + " non-JSON response" }
          };
        }
        return { ok: res.ok, status: res.status, data: parsed };
      })
      .catch((err) => ({
        ok: false,
        status: 0,
        data: { valid: false, reason: "network_error", detail: (err && err.message) || "Network error" }
      }));
  }

  function getGmRequestFn() {
    if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest;
    if (typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function") return GM.xmlHttpRequest;
    return null;
  }

  function gmRequest(method, url, bodyStr) {
    const gmReq = getGmRequestFn();
    if (!gmReq) {
      return Promise.resolve({ ok: false, status: 0, text: "", data: { valid: false, reason: "no_gm" } });
    }
    return new Promise((resolve) => {
      let settled = false;
      const done = (r) => {
        if (settled) return;
        settled = true;
        resolve(r);
      };
      const timer = setTimeout(() => {
        done({ ok: false, status: 0, text: "", data: { valid: false, reason: "timeout" } });
      }, 15000);

      const onLoad = (res) => {
        clearTimeout(timer);
        if (!res || res.status === 0) {
          done({ ok: false, status: 0, text: "", data: { valid: false, reason: "gm_blocked" } });
          return;
        }
        const parsed = parseJsonSafe(res.responseText);
        done({
          ok: res.status >= 200 && res.status < 300,
          status: res.status,
          text: res.responseText || "",
          data: parsed || { valid: false, reason: "invalid_response" }
        });
      };

      try {
        const reqOpts = {
          method: method,
          url: url,
          headers: method === "POST"
            ? { "Content-Type": "application/json", "Accept": "application/json" }
            : { "Accept": "*/*" },
          data: method === "POST" ? bodyStr : undefined,
          anonymous: true,
          timeout: 14000,
          onload: onLoad,
          onerror: () => {
            clearTimeout(timer);
            done({ ok: false, status: 0, text: "", data: { valid: false, reason: "gm_error" } });
          },
          ontimeout: () => {
            clearTimeout(timer);
            done({ ok: false, status: 0, text: "", data: { valid: false, reason: "timeout" } });
          }
        };
        const maybePromise = gmReq(reqOpts);
        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then(onLoad).catch(() => {
            clearTimeout(timer);
            done({ ok: false, status: 0, text: "", data: { valid: false, reason: "gm_error" } });
          });
        }
      } catch (e) {
        clearTimeout(timer);
        done({ ok: false, status: 0, text: "", data: { valid: false, reason: "gm_error" } });
      }
    });
  }

  function hasExtensionBridge() {
    try {
      return !!(document.documentElement && document.documentElement.dataset && document.documentElement.dataset.qxExtBridge === "1");
    } catch (e) {
      return false;
    }
  }

  function extBridgePost(path, bodyStr) {
    if (!hasExtensionBridge()) return Promise.resolve(null);
    return new Promise((resolve) => {
      const reqId = "qx_ext_" + Math.random().toString(36).slice(2) + "_" + Date.now();
      let settled = false;
      const done = (res) => {
        if (settled) return;
        settled = true;
        window.removeEventListener("message", onMsg);
        clearTimeout(timer);
        resolve(res);
      };
      const onMsg = (ev) => {
        if (ev.source !== window || !ev.data || ev.data.__qxExtRes !== true || ev.data.id !== reqId) return;
        done(ev.data.result || { ok: false, status: 0, data: { valid: false, reason: "network_error" } });
      };
      const timer = setTimeout(() => {
        done({ ok: false, status: 0, data: { valid: false, reason: "timeout" } });
      }, 15000);
      window.addEventListener("message", onMsg);
      window.postMessage({ __qxExtReq: true, id: reqId, path: path, body: bodyStr }, "*");
    });
  }

  async function apiRequest(endpoint, payload) {
    const bodyStr = JSON.stringify(payload || {});
    const fullUrl = SERVER_URL + endpoint;

    if (hasExtensionBridge()) {
      const extRes = await extBridgePost(endpoint, bodyStr);
      if (extRes && extRes.data && extRes.data.reason !== "ext_unavailable") {
        return extRes.data;
      }
    }

    const directRes = await fetchJson(fullUrl, bodyStr);
    if (directRes && directRes.data && directRes.data.reason !== "network_error" && directRes.data.reason !== "invalid_response") {
      return directRes.data;
    }

    if (getGmRequestFn()) {
      const gmRes = await gmRequest("POST", fullUrl, bodyStr);
      if (gmRes && gmRes.data && gmRes.data.reason !== "no_gm" && gmRes.data.reason !== "gm_blocked" && gmRes.data.reason !== "gm_error" && gmRes.data.reason !== "timeout") {
        return gmRes.data;
      }
    }

    return (directRes && directRes.data) || { valid: false, reason: "network_error" };
  }

  async function fetchTextRemote(url) {
    const resolvedUrl = /^https?:\/\//i.test(url) ? url : SERVER_URL + (url.startsWith("/") ? url : "/" + url);
    try {
      const r = await fetch(resolvedUrl);
      if (r.ok) return await r.text();
    } catch (e) {}
    if (getGmRequestFn()) {
      const g = await gmRequest("GET", resolvedUrl);
      if (g && g.ok && g.text) return g.text;
    }
    throw new Error("Could not download server script from " + resolvedUrl);
  }

  async function activateLicense(licenseKey) {
    const cleanKey = String(licenseKey || "").trim();
    const deviceId = getDeviceId();
    const data = await apiRequest("/api/public/license/activate", {
      license_key: cleanKey,
      device_id: deviceId
    });
    if (data.valid && data.device_token) {
      saveAuth(cleanKey, data.device_token);
    }
    return data;
  }

  async function verifyLicense(licenseKey, deviceToken) {
    const cleanKey = String(licenseKey || "").trim();
    const deviceId = getDeviceId();
    return await apiRequest("/api/public/license/verify", {
      license_key: cleanKey,
      device_id: deviceId,
      device_token: deviceToken
    });
  }

  async function fetchBootstrapPayload(licenseKey, deviceToken) {
    const auth = getStoredAuth();
    return await apiRequest("/api/public/client/bootstrap", {
      license_key: licenseKey || auth.key,
      device_id: auth.deviceId,
      device_token: deviceToken || auth.token
    });
  }

  function decodeBase64Utf8(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  }

  function extractCodeFromNode(node) {
    if (!node || typeof node !== "object") return "";
    const directKeys = ["script", "code", "source", "source_code", "js", "javascript", "bundle", "client_code", "entry_code", "app_code", "runtime_code", "payload_js", "content"];
    for (let i = 0; i < directKeys.length; i++) {
      const val = node[directKeys[i]];
      if (typeof val === "string" && val.trim()) {
        if (node.encoding === "base64") {
          try { return decodeBase64Utf8(val.trim()); } catch (e) {}
        }
        return val;
      }
    }
    const b64Keys = ["script_base64", "code_base64", "source_base64", "content_base64", "bundle_base64"];
    for (let i = 0; i < b64Keys.length; i++) {
      const val = node[b64Keys[i]];
      if (typeof val === "string" && val.trim()) {
        try { return decodeBase64Utf8(val.trim()); } catch (e) {}
      }
    }
    return "";
  }

  async function resolveBootstrapScripts(bootstrap) {
    if (!bootstrap || typeof bootstrap !== "object") return [];
    const scripts = [];
    const containers = [bootstrap, bootstrap.data, bootstrap.release, bootstrap.source, bootstrap.payload, bootstrap.client, bootstrap.app];
    for (let i = 0; i < containers.length; i++) {
      const node = containers[i];
      if (!node || typeof node !== "object") continue;
      const code = extractCodeFromNode(node);
      if (code) scripts.push(code);

      const urlVal = node.script_url || node.bundle_url || node.release_url || node.entry_url || node.download_url || node.url;
      if (typeof urlVal === "string" && urlVal.trim()) {
        const fetched = await fetchTextRemote(urlVal.trim());
        if (fetched && fetched.trim()) scripts.push(fetched);
      }
    }

    const fileList = bootstrap.files || bootstrap.modules || bootstrap.chunks || (bootstrap.release && bootstrap.release.files) || (bootstrap.data && bootstrap.data.files);
    const items = Array.isArray(fileList) ? fileList : (fileList && typeof fileList === "object" ? Object.values(fileList) : []);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (typeof item === "string" && item.trim()) {
        scripts.push(item);
      } else if (item && typeof item === "object") {
        const itemCode = extractCodeFromNode(item);
        if (itemCode) scripts.push(itemCode);
        else if (typeof item.url === "string" && item.url.trim()) {
          const fetched = await fetchTextRemote(item.url.trim());
          if (fetched && fetched.trim()) scripts.push(fetched);
        }
      }
    }
    return scripts;
  }

  function executeServerCode(codeText) {
    if (!codeText || typeof codeText !== "string") return;
    let executed = false;
    try {
      const flag = "__qxServerExecOk_" + Date.now();
      const s = document.createElement("script");
      s.textContent = codeText + "\n;window[" + JSON.stringify(flag) + "]=1;";
      (document.head || document.body || document.documentElement).appendChild(s);
      s.remove();
      if (window[flag]) {
        executed = true;
        try { delete window[flag]; } catch (e) {}
      }
    } catch (e) {}

    if (!executed) {
      const fn = new Function(codeText);
      fn.call(pageWin);
    }
  }

  // 3. Application Launcher (Loads & Runs Server Code Only)
  async function launchApplication(licenseKey, deviceToken) {
    const bootstrap = await fetchBootstrapPayload(licenseKey, deviceToken);
    if (!bootstrap || bootstrap.valid === false) {
      const reason = (bootstrap && bootstrap.reason) || "bootstrap_failed";
      createLicenseModal("Server bootstrap failed: " + String(reason).replace(/_/g, " "));
      return { ok: false, reason };
    }

    pageWin.__QX_BOOTSTRAP__ = bootstrap;
    window.__QX_BOOTSTRAP__ = bootstrap;

    const serverScripts = await resolveBootstrapScripts(bootstrap);
    if (!serverScripts.length) {
      const keys = Object.keys(bootstrap).join(", ");
      const msg = "License active! Connected to Remote Server, but /api/public/client/bootstrap returned no runnable script (keys: " + (keys || "none") + ").";
      console.log("[Quotex Server]", msg, bootstrap);
      if (document.getElementById("remote-license-modal")) {
        updateModalStatus(msg, "#38bdf8");
      } else {
        createLicenseModal(msg);
      }
      return { ok: true, emptyPayload: true };
    }

    const modal = document.getElementById("remote-license-modal");
    if (modal) modal.remove();

    for (let i = 0; i < serverScripts.length; i++) {
      executeServerCode(serverScripts[i]);
    }
    return { ok: true };
  }

  function updateModalStatus(text, color) {
    const msg = document.getElementById("license-status-msg");
    if (msg) {
      msg.style.color = color || "#ef4444";
      msg.textContent = text;
    }
  }

  // 4. Clean Server License UI Popup
  async function createLicenseModal(initialError) {
    if (!document.body) {
      await new Promise((r) => document.addEventListener("DOMContentLoaded", r, { once: true }));
    }

    const existing = document.getElementById("remote-license-modal");
    if (existing) existing.remove();

    const auth = getStoredAuth();
    const overlay = document.createElement("div");
    overlay.id = "remote-license-modal";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(8,6,18,0.82);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:9999999;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";

    overlay.innerHTML = `
      <div style="background:linear-gradient(145deg,#1b0b32,#241042);border:1px solid rgba(248,0,255,0.35);border-radius:14px;padding:20px;width:100%;max-width:360px;box-shadow:0 20px 45px rgba(0,0,0,0.65);color:#f8fafc;text-align:center;">
        <div style="background:rgba(0,0,0,0.55);border:1px solid rgba(248,0,255,0.3);border-radius:8px;padding:8px;margin-bottom:12px;font-size:13px;font-weight:700;color:#fff;">
          Developer: <strong>@tradereyasin7</strong>
        </div>

        <a href="https://t.me/tradereyasin7" target="_blank" style="display:inline-block;margin-bottom:10px;">
          <img src="https://i.postimg.cc/W1xNxw0S/file-00000000acd08230b081904c2c4ce41c.png" alt="Telegram" style="width:36px;height:36px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);" />
        </a>

        <h3 style="margin:0 0 4px;font-size:15px;font-weight:700;color:#fff;">Server License Verification</h3>
        <p style="margin:0 0 14px;font-size:11px;color:#cbd5e1;">Connect to demotoliveadmin.lovable.app</p>

        <input type="text" id="license-input-field" placeholder="RSC-XXXX-XXXX..." value="${auth.key}" style="width:100%;box-sizing:border-box;padding:11px 12px;background:rgba(9,9,11,0.85);border:1px solid rgba(255,255,255,0.22);border-radius:8px;color:#fff;font-family:monospace;font-size:13px;outline:none;margin-bottom:10px;" />

        <div id="license-status-msg" style="font-size:12px;margin-bottom:12px;min-height:18px;color:#f87171;line-height:1.4;">${initialError || ""}</div>

        <button id="license-submit-btn" style="width:100%;padding:11px;background:linear-gradient(135deg,#8333ff,#f900ff);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;text-transform:uppercase;letter-spacing:0.6px;">Verify &amp; Connect</button>

        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px;">
          <button id="license-reset-btn" type="button" style="flex:1;padding:8px;background:rgba(255,255,255,0.08);color:#cbd5e1;border:1px solid rgba(255,255,255,0.15);border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;">Reset Key</button>
          <button id="license-close-btn" type="button" style="flex:1;padding:8px;background:linear-gradient(135deg,#ff3366,#ff5757);color:#fff;border:none;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const btn = document.getElementById("license-submit-btn");
    const input = document.getElementById("license-input-field");
    const resetBtn = document.getElementById("license-reset-btn");
    const closeBtn = document.getElementById("license-close-btn");

    closeBtn?.addEventListener("click", () => overlay.remove());
    resetBtn?.addEventListener("click", () => {
      clearAuth();
      if (input) input.value = "";
      updateModalStatus("Saved license cleared.", "#94a3b8");
    });

    btn?.addEventListener("click", async () => {
      const key = (input?.value || "").trim();
      if (!key) {
        updateModalStatus("Please enter a valid license key.", "#f87171");
        return;
      }
      btn.disabled = true;
      btn.textContent = "Connecting...";
      updateModalStatus("Verifying with server...", "#38bdf8");

      const currentAuth = getStoredAuth();
      let res = null;
      if (currentAuth.key === key && currentAuth.token) {
        res = await verifyLicense(key, currentAuth.token);
      }
      if (!res || (!res.valid && res.reason !== "device_limit_reached" && res.reason !== "device_blocked" && res.reason !== "banned" && res.reason !== "expired" && res.reason !== "wrong_project" && res.reason !== "network_error")) {
        res = await activateLicense(key);
      }

      const finalAuth = getStoredAuth();
      if (res && res.valid && finalAuth.token) {
        updateModalStatus("License active! Loading code from server...", "#22c55e");
        try {
          await launchApplication(key, finalAuth.token);
        } catch (err) {
          updateModalStatus("Failed to execute server script: " + ((err && err.message) || "error"), "#f87171");
        }
      } else {
        const reason = (res && res.reason) || "invalid_license";
        updateModalStatus("Failed: " + String(reason).replace(/_/g, " "), "#f87171");
      }

      btn.disabled = false;
      btn.textContent = "Verify & Connect";
    });
  }

  // Expose bridge for external/console/extension checks
  const bridge = {
    activate: activateLicense,
    verify: verifyLicense,
    bootstrap: fetchBootstrapPayload,
    apiRequest: apiRequest,
    openModal: createLicenseModal
  };
  window.AppLicense = bridge;
  try {
    pageWin.AppLicense = bridge;
    pageWin.__qxServerClientRunning = true;
    pageWin.__qxOpenLicenseModal = createLicenseModal;
  } catch (e) {}

  window.addEventListener("message", (ev) => {
    if (ev.source === window && ev.data && ev.data.__qxOpenPopup === true) {
      createLicenseModal();
    }
  });

  // 5. Initial Auto-Check on Page Load
  async function init() {
    const auth = getStoredAuth();
    if (auth.key && auth.token) {
      const res = await verifyLicense(auth.key, auth.token);
      if (res && res.valid) {
        try {
          await launchApplication(auth.key, auth.token);
          return;
        } catch (err) {
          createLicenseModal("Server script error: " + ((err && err.message) || "error"));
          return;
        }
      }
    }
    createLicenseModal();
  }

  init();
})();
