// ==UserScript==
// @name         Quotex Demo to Live Pro + License Client
// @namespace    https://demotoliveadmin.lovable.app
// @version      2.3.1
// @description  Quotex Demo to Live with fixed Demotoliveadmin License Sync & Multi-Transport API Client
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
// @connect      *.run.app
// @run-at       document-start
// ==/UserScript==

(function() {
  const PRIMARY_SERVER_BASE = "https://demotoliveadmin.lovable.app";
  const CORS_PROXY_BASE = "https://ais-dev-ga2sdbiyy4mi4lhjhm5mwj-878201435123.asia-southeast1.run.app";
  const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

  function hasValidProxyBase() {
    return /^https?:\/\//i.test(CORS_PROXY_BASE) && !CORS_PROXY_BASE.includes("__PROXY_" + "BASE_URL__");
  }

  function isPrivateAiStudioDevProxy() {
    return /\/\/ais-dev-[^/]+\.run\.app/i.test(CORS_PROXY_BASE);
  }

  function getDeviceId() {
    let id = localStorage.getItem("customDeviceId") || localStorage.getItem("app_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
    }
    localStorage.setItem("customDeviceId", id);
    localStorage.setItem("app_device_id", id);
    return id;
  }

  function parseJsonSafe(text) {
    if (!text || typeof text !== "string") return null;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && ("valid" in parsed || "reason" in parsed || "error" in parsed)) {
        return parsed;
      }
      return null;
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
          const looksLikeHtml = /^\s*</.test(text) || /__cookie_check|302 Found|<!doctype/i.test(text);
          return {
            ok: false,
            status: res.status,
            data: {
              valid: false,
              reason: looksLikeHtml ? "proxy_auth_required" : "invalid_response",
              detail: looksLikeHtml ? "Proxy returned HTML login/redirect instead of JSON" : "Non-JSON response"
            }
          };
        }
        return { ok: res.ok && !!parsed.valid, status: res.status, data: parsed };
      })
      .catch((err) => ({
        ok: false,
        status: 0,
        data: {
          valid: false,
          reason: "network",
          detail: err && err.message ? err.message : "CORS or network error"
        }
      }));
  }

  function getGmRequestFn() {
    if (typeof GM_xmlhttpRequest === "function") return GM_xmlhttpRequest;
    if (typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function") return GM.xmlHttpRequest;
    return null;
  }

  function gmPost(url, bodyStr) {
    const gmReq = getGmRequestFn();
    if (!gmReq) {
      return Promise.resolve({
        ok: false,
        status: 0,
        data: { valid: false, reason: "no_gm", detail: "GM_xmlhttpRequest not available in this browser/injector" }
      });
    }

    return new Promise((resolve) => {
      let settled = false;
      const done = (result) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      const timer = setTimeout(() => {
        done({
          ok: false,
          status: 0,
          data: { valid: false, reason: "timeout", detail: "GM_xmlhttpRequest timed out" }
        });
      }, 15000);

      const handleResponse = (res) => {
        clearTimeout(timer);
        if (!res || res.status === 0) {
          done({
            ok: false,
            status: 0,
            data: {
              valid: false,
              reason: "gm_blocked",
              detail: "Cross-origin request blocked or failed (status 0). Allow domain in Tampermonkey."
            }
          });
          return;
        }
        const parsed = parseJsonSafe(res.responseText);
        if (!parsed) {
          done({
            ok: false,
            status: res.status,
            data: {
              valid: false,
              reason: "invalid_response",
              detail: "Server returned HTTP " + res.status + " non-JSON response"
            }
          });
          return;
        }
        done({
          ok: res.status >= 200 && res.status < 300 && !!parsed.valid,
          status: res.status,
          data: parsed
        });
      };

      try {
        const maybePromise = gmReq({
          method: "POST",
          url: url,
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          data: bodyStr,
          anonymous: true,
          timeout: 14000,
          onload: handleResponse,
          onerror: function(err) {
            clearTimeout(timer);
            done({
              ok: false,
              status: (err && err.status) || 0,
              data: {
                valid: false,
                reason: "gm_error",
                detail: (err && (err.error || err.statusText)) || "GM_xmlhttpRequest error (check Tampermonkey @connect permission)"
              }
            });
          },
          ontimeout: function() {
            clearTimeout(timer);
            done({
              ok: false,
              status: 0,
              data: { valid: false, reason: "timeout", detail: "GM_xmlhttpRequest timed out" }
            });
          }
        });

        // Support Promise-based GM.xmlHttpRequest (Greasemonkey 4 / Violentmonkey)
        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then(handleResponse).catch((err) => {
            clearTimeout(timer);
            done({
              ok: false,
              status: 0,
              data: {
                valid: false,
                reason: "gm_error",
                detail: (err && err.message) || "GM.xmlHttpRequest rejected"
              }
            });
          });
        }
      } catch (err) {
        clearTimeout(timer);
        done({
          ok: false,
          status: 0,
          data: {
            valid: false,
            reason: "gm_error",
            detail: (err && err.message) || "GM_xmlhttpRequest threw exception"
          }
        });
      }
    });
  }

  async function apiPost(path, payload) {
    const bodyStr = JSON.stringify(payload);
    const primaryUrl = PRIMARY_SERVER_BASE + path;
    const hasGm = !!getGmRequestFn();

    // 1) If running inside Tampermonkey/Violentmonkey, try GM_xmlhttpRequest first
    let gmRes = null;
    if (hasGm) {
      gmRes = await gmPost(primaryUrl, bodyStr);
      const gmReason = gmRes && gmRes.data && gmRes.data.reason;
      if (gmRes && gmRes.data && gmReason !== "no_gm" && gmReason !== "gm_blocked" && gmReason !== "gm_error" && gmReason !== "timeout" && gmReason !== "invalid_response") {
        return gmRes;
      }
    }

    // 2) Try CORS-enabled bridge proxy (works in Bookmarklets when public proxy URL is configured)
    if (hasValidProxyBase() && !isPrivateAiStudioDevProxy()) {
      const proxyRes = await fetchJson(CORS_PROXY_BASE.replace(/\/+$/, "") + path, bodyStr);
      if (proxyRes && proxyRes.data && proxyRes.data.reason !== "network" && proxyRes.data.reason !== "proxy_auth_required") {
        return proxyRes;
      }
    }

    // 3) Direct fetch (works in Bookmarklets as soon as demotoliveadmin.lovable.app sends CORS headers)
    const directRes = await fetchJson(primaryUrl, bodyStr);
    if (directRes && directRes.data && directRes.data.reason !== "network" && directRes.data.reason !== "invalid_response") {
      return directRes;
    }

    if (!hasGm) {
      return {
        ok: false,
        status: 0,
        data: {
          valid: false,
          reason: "network",
          transport_error: "bookmarklet_cors_blocked",
          detail: "Bookmarklet fetch() was blocked by CORS on demotoliveadmin.lovable.app (and no public CORS proxy URL is active)."
        }
      };
    }

    const gmReason = gmRes && gmRes.data && gmRes.data.reason;
    if (gmReason === "gm_blocked" || gmReason === "gm_error") {
      return {
        ok: false,
        status: 0,
        data: {
          valid: false,
          reason: "network",
          transport_error: gmReason,
          detail: gmRes.data.detail
        }
      };
    }

    return directRes;
  }

  async function activateLicense(licenseKey) {
    const cleanKey = String(licenseKey || "").trim();
    const deviceId = getDeviceId();
    const res = await apiPost("/api/public/license/activate", {
      license_key: cleanKey,
      device_id: deviceId
    });

    if (res.ok && res.data && res.data.valid) {
      localStorage.setItem("appActivation", cleanKey);
      localStorage.setItem("active_license_key", cleanKey);
      if (res.data.device_token) {
        localStorage.setItem("appDeviceToken", res.data.device_token);
        localStorage.setItem("active_device_token", res.data.device_token);
      }
      return { success: true, expires_at: res.data.expires_at };
    }
    return { success: false, reason: (res.data && res.data.reason) || "Activation failed" };
  }

  async function verifyLicense() {
    const licenseKey = (localStorage.getItem("appActivation") || localStorage.getItem("active_license_key") || "").trim();
    const deviceToken = localStorage.getItem("appDeviceToken") || localStorage.getItem("active_device_token") || "";
    const deviceId = getDeviceId();

    if (!licenseKey) return { valid: false, reason: "no_license" };

    const res = await apiPost("/api/public/license/verify", {
      license_key: licenseKey,
      device_id: deviceId,
      device_token: deviceToken
    });

    if (res.ok && res.data && res.data.valid) {
      return { valid: true, expires_at: res.data.expires_at };
    }
    return { valid: false, reason: (res.data && res.data.reason) || "network" };
  }

  const licenseBridge = { activate: activateLicense, verify: verifyLicense, apiPost: apiPost };
  window.AppLicense = licenseBridge;
  try {
    pageWin.AppLicense = licenseBridge;
  } catch (e) {}
})();

(function initShadowDomHook() {
  const pageWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  if (pageWin.__qxShadowPatched) {
    return;
  }
  pageWin.__qxShadowPatched = true;
  const shadowRootWeakMap = new WeakMap();
  const originalAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (shadowOptions) {
    const createdShadowRoot = originalAttachShadow.call(this, Object.assign({}, shadowOptions || {}, {
      mode: "open"
    }));
    shadowRootWeakMap.set(this, createdShadowRoot);
    if (this.localName === "qx-usermenu-trigger") {
      pageWin.__qxUsermenuShadow = createdShadowRoot;
      window.__qxUsermenuShadow = createdShadowRoot;
    }
    return createdShadowRoot;
  };
  const getShadow = function (targetElement) {
    if (!targetElement) return null;
    return targetElement.shadowRoot || shadowRootWeakMap.get(targetElement) || null;
  };
  const ensureShadow = function () {
    const triggerElement = document.querySelector("qx-usermenu-trigger");
    if (!triggerElement) return null;
    const existingShadowRoot = triggerElement.shadowRoot || shadowRootWeakMap.get(triggerElement) || pageWin.__qxUsermenuShadow || window.__qxUsermenuShadow || null;
    if (existingShadowRoot) return existingShadowRoot;
    if (!pageWin.__qxUsermenuShadowKicked) {
      pageWin.__qxUsermenuShadowKicked = true;
      try {
        triggerElement.remove();
      } catch (e) {}
    }
    return null;
  };
  window.__qxGetShadowRoot = getShadow;
  window.__qxEnsureUsermenuShadow = ensureShadow;
  try {
    pageWin.__qxGetShadowRoot = getShadow;
    pageWin.__qxEnsureUsermenuShadow = ensureShadow;
  } catch (e) {}
})();

(async function () {
  function getUsermenuShadowRoot() {
    if (typeof window.__qxEnsureUsermenuShadow === "function") {
      return window.__qxEnsureUsermenuShadow();
    }
    const trigger = document.querySelector("qx-usermenu-trigger");
    return trigger ? trigger.shadowRoot || window.__qxUsermenuShadow || null : null;
  }

  function isDemoAccount() {
    const pathname = location.pathname || "";
    const href = location.href || "";
    if (/\/demo-trade(?:\/|$|\?)/i.test(pathname) || /\/demo-trade(?:\/|$|\?)/i.test(href)) {
      return true;
    }
    const shadow = getUsermenuShadowRoot();
    const nameEl = shadow && shadow.querySelector(".name");
    if (nameEl) {
      if (nameEl.classList.contains("demo") || /demo/i.test(nameEl.textContent || "")) {
        return true;
      }
      if (nameEl.classList.contains("live") || /^live(\s+account)?$/i.test((nameEl.textContent || "").trim())) {
        return false;
      }
    }
    const demoRadio = document.querySelector('.grOBD input.r29tN[value="demo"]');
    if (demoRadio && demoRadio.checked) return true;
    if (document.querySelector('.grOBD li.RDtBn.Qx5RW a.yBslY[href*="demo-trade"]')) return true;
    if (document.querySelector('.grOBD a.yBslY.active[href*="demo-trade"]')) return true;
    const liveRadio = document.querySelector('.grOBD input.r29tN[value="live"]');
    if (liveRadio && liveRadio.checked) return false;
    return false;
  }

  function isMenuPresent() {
    return !!(
      document.querySelector(".p0Ijl.Qx5RW") ||
      document.querySelector(".QE4Zb .p0Ijl") ||
      document.querySelector(".RyAkb .grOBD") ||
      document.querySelector(".grOBD li.RDtBn")
    );
  }

  function dispatchFullClick(el) {
    if (!el) return false;
    try {
      el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
      el.click();
      el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
      el.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, cancelable: true, view: window }));
    } catch (e) {
      try {
        el.click();
      } catch (err) {}
    }
    return true;
  }

  function clickMenuTrigger() {
    const trigger =
      document.querySelector(".RyAkb .uoy2n") ||
      document.querySelector(".uoy2n qx-usermenu-trigger") ||
      document.querySelector("qx-usermenu-trigger") ||
      document.querySelector(".RyAkb .QE4Zb") ||
      document.querySelector(".QE4Zb");
    return dispatchFullClick(trigger);
  }

  function ensureMenuOpen() {
    if (!isMenuPresent()) return false;
    return clickMenuTrigger();
  }

  function getDemoAccountElement() {
    const demoInput = document.querySelector('.grOBD input.r29tN[value="demo"]');
    if (demoInput) {
      const li = demoInput.closest("li.RDtBn");
      return (li && li.querySelector("a.yBslY")) || demoInput.closest("label") || demoInput.closest("a.yBslY") || li || demoInput;
    }
    return (
      document.querySelector('.grOBD a.yBslY[href*="demo-trade"]') ||
      document.querySelector('.grOBD a[href*="/demo-trade"]') ||
      document.querySelector('.p0Ijl a.yBslY[href*="demo-trade"]') ||
      document.querySelector('a.yBslY[href*="/en/demo-trade"]')
    );
  }

  function confirmAccountSwitch() {
    const btn =
      document.querySelector(".modal-account-type-changed button.PUCjQ") ||
      document.querySelector(".modal.modal-account-type-changed button.PUCjQ") ||
      document.querySelector(".modal.active.center .modal-account-type-changed button.PUCjQ") ||
      document.querySelector(".modal-account-type-changed .modal__close") ||
      document.querySelector(".modal.active.center button.PUCjQ") ||
      document.querySelector("button.PUCjQ") ||
      document.querySelector(".modal-account-type-changed__body-button") ||
      document.querySelector(".modal.active .modal__close");
    return dispatchFullClick(btn);
  }

  async function switchToDemo(attempt) {
    const count = attempt || 1;
    try {
      if (!document.querySelector("qx-usermenu-trigger, .RyAkb .uoy2n, .QE4Zb")) {
        if (count < 25) setTimeout(() => switchToDemo(count + 1), 200);
        return;
      }
      if (isDemoAccount()) {
        ensureMenuOpen();
        confirmAccountSwitch();
        return;
      }
      if (!isMenuPresent()) {
        if (!clickMenuTrigger()) {
          if (count < 25) setTimeout(() => switchToDemo(count + 1), 250);
          return;
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      if (isDemoAccount()) {
        ensureMenuOpen();
        confirmAccountSwitch();
        return;
      }
      const demoEl = getDemoAccountElement();
      if (!demoEl) {
        if (count < 25) setTimeout(() => switchToDemo(count + 1), 250);
        return;
      }
      dispatchFullClick(demoEl);
      await new Promise((r) => setTimeout(r, 250));
      confirmAccountSwitch();
      setTimeout(confirmAccountSwitch, 400);
      setTimeout(confirmAccountSwitch, 900);
      await new Promise((r) => setTimeout(r, 300));
      if (!isDemoAccount() && count < 12) {
        setTimeout(() => switchToDemo(count + 1), 400);
      }
    } catch (e) {
      if (count < 15) setTimeout(() => switchToDemo(count + 1), 400);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => switchToDemo(1), 200);
    });
  } else {
    setTimeout(() => switchToDemo(1), 200);
  }

  if (typeof Swal === "undefined" && !document.getElementById("qxSwalCdnScript")) {
    try {
      const script = document.createElement("script");
      script.id = "qxSwalCdnScript";
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      script.async = true;
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {}
  }

  const PROJECT_TYPE = "Quotex";
  const DEFAULT_NAME_LIST = "Oblivion Comet Nebula Specter Comet Nimbus Quartz Inferno Quotex Blitz Drift";
  let isActivated = false;
  let settingsPopupContainer = null;
  let demoBalanceValue = parseFloat(localStorage.getItem("demoBalance")) || 12500;
  let liveEngineObserver = null;
  let liveEngineStarted = false;

  function safeAlert(opts) {
    if (typeof Swal !== "undefined" && typeof Swal.fire === "function") {
      return Swal.fire(opts);
    }
    showToast(opts.title || opts.text || "Notice", 4000);
    return Promise.resolve({ isConfirmed: false });
  }

  function clearLicenseStorage() {
    try {
      localStorage.removeItem("appActivation");
      localStorage.removeItem("active_license_key");
      localStorage.removeItem("lastVerified");
      localStorage.removeItem("appDeviceToken");
      localStorage.removeItem("active_device_token");
    } catch (e) {}
    isActivated = false;
  }

  function collectDeviceInfo() {
    const ua = navigator.userAgent || "";
    let deviceType = "Desktop";
    let browser = "Unknown";
    let os = "Unknown";

    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
    else if (ua.includes("Opera") || ua.includes("OPR/")) browser = "Opera";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Macintosh")) os = "Mac OS";
    else if (ua.includes("Windows")) os = "Windows";

    if (ua.includes("Mobile")) deviceType = "Mobile";
    else if (ua.includes("Tablet")) deviceType = "Tablet";

    return { browser, os, deviceType };
  }

  function getOrCreateDeviceId() {
    let id = localStorage.getItem("customDeviceId") || localStorage.getItem("app_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
    }
    localStorage.setItem("customDeviceId", id);
    localStorage.setItem("app_device_id", id);
    return id;
  }

  async function callLicenseApi(endpoint, payload) {
    if (window.AppLicense && typeof window.AppLicense.apiPost === "function") {
      const res = await window.AppLicense.apiPost("/api/public/license/" + endpoint, payload);
      return res && res.data ? res.data : { valid: false, reason: "network" };
    }
    return { valid: false, reason: "network", detail: "AppLicense bridge missing" };
  }

  async function verifyLicenseKey(rawKey, options) {
    const key = String(rawKey || "").trim();
    if (!key) return { valid: false, reason: "invalid" };

    const deviceInfo = collectDeviceInfo();
    const deviceId = getOrCreateDeviceId();
    const storedKey = (localStorage.getItem("appActivation") || localStorage.getItem("active_license_key") || "").trim();
    const storedToken = localStorage.getItem("appDeviceToken") || localStorage.getItem("active_device_token") || "";
    const forceActivate = !!(options && options.forceActivate);

    try {
      let result = null;
      const shouldTryVerifyFirst = !forceActivate && storedToken && storedKey === key;

      if (shouldTryVerifyFirst) {
        result = await callLicenseApi("verify", {
          license_key: key,
          device_id: deviceId,
          device_token: storedToken,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          device_type: deviceInfo.deviceType
        });
      }

      const verifyReason = (result && result.reason) || "";
      const needsActivation =
        !result ||
        (!result.valid && (
          !shouldTryVerifyFirst ||
          verifyReason === "device_not_activated" ||
          verifyReason === "invalid_token" ||
          verifyReason === "invalid_request" ||
          verifyReason === "device_not_found" ||
          verifyReason === "unauthorized" ||
          verifyReason === "token_expired"
        ));

      if (needsActivation) {
        result = await callLicenseApi("activate", {
          license_key: key,
          device_id: deviceId,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          device_type: deviceInfo.deviceType
        });
      }

      if (result && result.valid) {
        localStorage.setItem("appActivation", key);
        localStorage.setItem("active_license_key", key);
        localStorage.setItem("lastVerified", String(Date.now()));
        if (result.device_token) {
          localStorage.setItem("appDeviceToken", result.device_token);
          localStorage.setItem("active_device_token", result.device_token);
        }
        isActivated = true;
        return {
          valid: true,
          key: key,
          expires_at: result.expires_at || null,
          project_type: PROJECT_TYPE
        };
      }

      const reason = String((result && result.reason) || "").toLowerCase();

      if (reason === "network" || reason === "timeout" || reason === "invalid_response" || reason === "proxy_auth_required") {
        if (storedKey === key && storedToken) {
          isActivated = true;
          return { valid: true, key: key, offline: true };
        }
        return {
          valid: false,
          reason: "network",
          transportError: result && result.transport_error,
          detail: result && result.detail,
          keepLicense: storedKey === key
        };
      }

      if (reason === "device_blocked" || reason === "banned" || reason === "license_banned" || reason === "blocked" || reason === "revoked") {
        clearLicenseStorage();
        return { valid: false, reason: "banned" };
      }

      if (reason === "device_limit_reached" || reason === "limit" || reason === "max_devices_reached") {
        return {
          valid: false,
          reason: "limit",
          allowed: (result && result.max_devices) || "1",
          used: (result && result.used_devices) || "1"
        };
      }

      if (reason === "expired" || reason === "license_expired") {
        clearLicenseStorage();
        return { valid: false, reason: "expired" };
      }

      if (reason === "wrong_project") {
        clearLicenseStorage();
        return { valid: false, reason: "wrong_project", message: result && result.message, wrongProject: result && result.project_type };
      }

      if (reason === "invalid_request") {
        return { valid: false, reason: "invalid_request", message: (result && result.message) || "Invalid license payload" };
      }

      if (storedKey === key) {
        clearLicenseStorage();
      }
      return { valid: false, reason: "invalid" };
    } catch (err) {
      if (storedKey === key && storedToken) {
        isActivated = true;
        return { valid: true, key: key, offline: true };
      }
      return { valid: false, reason: "network", keepLicense: storedKey === key };
    }
  }

  async function checkStoredActivation() {
    const savedKey = (localStorage.getItem("appActivation") || localStorage.getItem("active_license_key") || "").trim();
    if (!savedKey) {
      isActivated = false;
      return { valid: false };
    }

    const res = await verifyLicenseKey(savedKey, { forceActivate: false });
    if (res.valid) {
      isActivated = true;
      return res;
    }
    if (res.reason === "banned" || res.reason === "wrong_project" || res.reason === "limit" || res.reason === "invalid" || res.reason === "expired") {
      if (res.reason !== "limit") {
        clearLicenseStorage();
      }
      return res;
    }
    if (res.keepLicense || res.reason === "network" || res.offline) {
      isActivated = true;
      return { ...res, offline: true };
    }
    return { valid: false, reason: res.reason || "invalid" };
  }

  function showDeviceMismatchAlert(allowed, used) {
    safeAlert({
      title: "",
      html: `
        <div style="font-family: 'Roboto', sans-serif; text-align: center; background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98)); padding: 20px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 2px; border-radius: 12px; margin-bottom: 15px;">
            <div style="background: rgba(30, 11, 54, 0.95); padding: 15px; border-radius: 10px;">
              <h2 style="color: #fff; margin: 0; font-size: 16px; font-weight: 700;">Device Limit Reached</h2>
            </div>
          </div>
          <div style="background: rgba(255, 107, 107, 0.15); padding: 15px; margin: 15px 0; border-radius: 10px; text-align: left;">
            <p style="margin: 0; font-size: 15px; color: #ff6b6b; font-weight: 700;">Maximum Devices Used!</p>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;">
              Your license has reached the maximum device limit (${used} / ${allowed}). Reset devices in demotoliveadmin.lovable.app or generate a new key.
            </p>
          </div>
          <div style="background: rgba(249, 0, 255, 0.1); padding: 12px; border-radius: 10px;">
            <a href="https://t.me/tradereyasin7" target="_blank" style="display: inline-block; color: #f900ff; font-weight: 700; text-decoration: none; font-size: 14px; padding: 8px 18px; background: rgba(249, 0, 255, 0.2); border-radius: 8px;">@tradereyasin7</a>
          </div>
        </div>
      `,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: "Contact Developer",
      cancelButtonText: "Close",
      confirmButtonColor: "#ff6b6b",
      cancelButtonColor: "#ee5a6f",
      allowOutsideClick: false,
      customClass: { container: "swal-high-zindex" }
    }).then((res) => {
      if (res && res.isConfirmed) {
        window.open("https://t.me/tradereyasin7", "_blank");
      }
    });
  }

  function showWrongProjectAlert(msg, wrongProj) {
    safeAlert({
      icon: "error",
      title: "Wrong Project License",
      html: `This license token is not for <b>QUOTEX</b>. It is for <b>${wrongProj || "UNKNOWN"}</b>.`,
      confirmButtonText: "Understood",
      confirmButtonColor: "#667eea",
      allowOutsideClick: false,
      customClass: { container: "swal-high-zindex" }
    });
  }

  function showLicenseExpiredAlert() {
    safeAlert({
      icon: "error",
      title: "License Blocked",
      html: "This license has been <strong>blocked</strong> by the administrator.<br>Contact @tradereyasin7 on Telegram.",
      confirmButtonColor: "#e74c3c",
      customClass: { container: "swal-high-zindex" }
    });
  }

  function showLicenseTimeExpiredAlert() {
    safeAlert({
      icon: "warning",
      title: "License Expired",
      html: "This license key has <strong>expired</strong>.<br>Please renew or generate a new key in your dashboard.",
      confirmButtonColor: "#f59e0b",
      customClass: { container: "swal-high-zindex" }
    });
  }

  function showLicenseRequiredAlert() {
    safeAlert({
      title: "",
      html: `
        <div style="font-family: 'Roboto', sans-serif; text-align: center; background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98)); padding: 20px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #f900ff 0%, #00d9ff 100%); padding: 2px; border-radius: 12px; margin-bottom: 15px;">
            <div style="background: rgba(30, 11, 54, 0.95); padding: 15px; border-radius: 10px;">
              <h2 style="color: #fff; margin: 0; font-size: 16px; font-weight: 700;">Invalid License Key</h2>
            </div>
          </div>
          <div style="background: rgba(255, 51, 102, 0.15); padding: 15px; margin: 15px 0; border-radius: 10px; text-align: left;">
            <p style="margin: 0; font-size: 14px; color: #ff3366; font-weight: 700;">Invalid License!</p>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;">
              Please check that your license key is copied accurately and active in your admin panel.
            </p>
          </div>
          <div style="background: rgba(249, 0, 255, 0.1); padding: 12px; border-radius: 10px;">
            <a href="https://t.me/tradereyasin7" target="_blank" style="display: inline-block; color: #f900ff; font-weight: 700; text-decoration: none; font-size: 14px; padding: 8px 18px; background: rgba(249, 0, 255, 0.2); border-radius: 8px;">@tradereyasin7</a>
          </div>
        </div>
      `,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: "Contact Developer",
      cancelButtonText: "Try Again",
      confirmButtonColor: "#667eea",
      cancelButtonColor: "#764ba2",
      allowOutsideClick: false,
      customClass: { container: "swal-high-zindex" }
    }).then((res) => {
      if (res && res.isConfirmed) {
        window.open("https://t.me/tradereyasin7", "_blank");
      }
    });
  }

  function showNetworkErrorAlert(detailMsg, transportError) {
    let hintText = "Allow cross-origin requests in Tampermonkey for demotoliveadmin.lovable.app or check your internet.";
    if (transportError === "bookmarklet_cors_blocked" || transportError === "no_gm") {
      hintText = "In Bookmarklet mode, your browser blocks direct requests to demotoliveadmin.lovable.app unless CORS is enabled there OR you embed a deployed public Proxy URL in the bookmarklet.";
    } else if (transportError === "gm_blocked" || transportError === "gm_error") {
      hintText = "Tampermonkey blocked the cross-origin request to demotoliveadmin.lovable.app. Open Tampermonkey -> Script Settings -> XHR Security and allow demotoliveadmin.lovable.app.";
    }

    safeAlert({
      title: "",
      html: `
        <div style="font-family: 'Roboto', sans-serif; text-align: center; background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98)); padding: 20px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 2px; border-radius: 12px; margin-bottom: 15px;">
            <div style="background: rgba(30, 11, 54, 0.95); padding: 15px; border-radius: 10px;">
              <h2 style="color: #fff; margin: 0; font-size: 16px; font-weight: 700;">Connection Error</h2>
            </div>
          </div>
          <div style="background: rgba(245, 87, 108, 0.15); padding: 15px; margin: 15px 0; border-radius: 10px; text-align: left;">
            <p style="margin: 0; font-size: 13px; color: #fff; line-height: 1.5; font-weight: 600;">
              <strong style="color: #f5576c;">Cause:</strong> ${detailMsg || "Could not reach the license server."}
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.9); line-height: 1.5;">
              <strong style="color: #ff6b6b;">How to fix:</strong> ${hintText}
            </p>
          </div>
        </div>
      `,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: "Contact Support",
      cancelButtonText: "Try Again",
      confirmButtonColor: "#f093fb",
      cancelButtonColor: "#f5576c",
      allowOutsideClick: false,
      customClass: { container: "swal-high-zindex" }
    }).then((res) => {
      if (res && res.isConfirmed) {
        window.open("https://t.me/tradereyasin7", "_blank");
      }
    });
  }

  function showSuccessAlert() {
    return safeAlert({
      icon: "success",
      title: "License Verified!",
      text: "Your license has been successfully verified.",
      showConfirmButton: false,
      timer: 1400,
      timerProgressBar: true,
      customClass: { container: "swal-high-zindex" }
    });
  }

  function generateAliasFromName(key) {
    const map = {
      A: "Nebula", B: "Quartz", C: "Tornado", D: "Eclipse",
      E: "Blizzard", F: "Mirage", G: "Vortex", H: "Zephyr",
      I: "Nimbus", J: "Cyclone", K: "Phantom", L: "Ignite",
      M: "Jungle", N: "Lynx", O: "Falcon", P: "Comet",
      Q: "Raven", R: "Stellar", S: "Glacier", T: "Orbit",
      U: "Tempest", V: "Nova", W: "Inferno", X: "Echo",
      Y: "Gravity", Z: "Shadow",
      "0": "Drift", "1": "Bolt", "2": "Fury", "3": "Crimson", "4": "Oblivion",
      "5": "Pulse", "6": "Specter", "7": "Radiant", "8": "Blitz", "9": "Strike",
      "@": "Quotex", "-": "Lyra", "_": "Xion", "#": "Vega", ".": "Orion"
    };
    return String(key || "").toUpperCase().split("").map((ch) => map[ch] || "Fine").join(" ");
  }

  const FLOATING_POPUP_CSS = `
    .swal-high-zindex, .swal2-container.swal-high-zindex {
      z-index: 10005 !important;
    }

    #settingsPopup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.8);
      width: calc(100% - 20px);
      max-width: 360px;
      max-height: calc(100vh - 20px);
      height: auto;
      padding: 12px 14px;
      background: rgba(30, 11, 54, 0.98);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45);
      text-align: center;
      border: 1px solid rgba(248, 0, 255, 0.25);
      overflow-y: auto;
      overflow-x: hidden;
      font-family: 'Roboto', sans-serif;
      color: #f8f8f8;
      z-index: 9999;
      opacity: 0;
      transition: all 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    #settingsPopup.show {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    #settingsPopup.hide {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.8);
    }

    #settingsPopup h2 {
      color: white;
      font-size: 12px;
      font-weight: 600;
      margin: 0 0 8px 0;
      padding: 8px;
      background: rgba(0,0,0,0.85);
      border-radius: 6px;
      border: 1px solid rgba(248, 0, 255, 0.3);
      line-height: 1.4;
    }

    #settingsPopup h2 .warning-text {
      color: #ff3366;
      font-weight: 700;
      display: block;
      margin-top: 3px;
    }

    #settingsPopup h3 {
      color: white;
      font-size: 12px;
      font-weight: 700;
      margin: 6px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: linear-gradient(to right, #f900ff, #00d9ff);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
    }

    .telegram-link {
      display: inline-block;
      margin-bottom: 6px;
    }

    .telegram-link img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    #settingsPopup label {
      display: block;
      margin-bottom: 6px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 11px;
      font-weight: 500;
      text-align: left;
    }

    #settingsPopup input, #settingsPopup select {
      width: 100%;
      padding: 7px;
      margin-top: 2px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 13px;
      box-sizing: border-box;
    }

    #countryFlagSelect {
      background: rgba(30, 11, 54, 0.95);
    }

    #countryFlagSelect option {
      background: #1e0b36;
      color: white;
    }

    #settingsPopup small {
      display: block;
      margin-top: 2px;
      margin-bottom: 6px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 8px;
      text-align: left;
    }

    #settingsPopup button {
      width: 100%;
      padding: 8px;
      margin-top: 6px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    #saveButton, #verifyBtn, #setDemoBtn {
      background: linear-gradient(135deg, #8333ff, #f900ff);
      color: white;
    }

    #settingsPopup button.close-btn {
      background: linear-gradient(135deg, #ff3366, #ff5757);
      color: white;
    }

    #settingsPopup button:disabled {
      background: #6c757d;
      cursor: not-allowed;
      opacity: 0.6;
    }

    #licenseSection, #demoBalanceSection {
      margin-top: 8px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }

    #licenseSection.hide {
      opacity: 0;
      max-height: 0;
      padding: 0;
      margin: 0;
      overflow: hidden;
      border: none;
    }

    #demoBalanceSection {
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      padding: 0;
      margin: 0;
      border: none;
    }

    #demoBalanceSection.show {
      opacity: 1;
      max-height: 500px;
      padding: 12px;
      margin-top: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .message-popup {
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 12px 18px;
      color: white;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      opacity: 0;
      transform: translateY(-20px);
      transition: opacity 0.4s ease, transform 0.4s ease;
      z-index: 10006;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(0, 255, 163, 0.5);
    }

    .message-popup.show {
      opacity: 1;
      transform: translateY(0);
    }

    #centeredDeveloperMessage {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.92);
      color: white;
      padding: 20px 32px;
      border-radius: 14px;
      font-size: 16px;
      font-weight: bold;
      z-index: 10004;
      opacity: 0;
      transition: opacity 0.4s ease;
      border: 2px solid rgba(248, 0, 255, 0.5);
    }

    #cheatCodeDisplay {
      font-size: 8px;
      padding: 6px;
      margin-top: 6px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.7);
    }

    .verified-badge {
      background: rgba(0, 255, 163, 0.2);
      color: #00ffa3;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 6px;
      display: inline-block;
    }

    .unverified-badge {
      background: rgba(255, 51, 102, 0.2);
      color: #ff3366;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 8px;
      display: inline-block;
    }

    #refreshBalanceBtn {
      position: absolute;
      top: 24px;
      right: 8px;
      cursor: pointer;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(248, 0, 255, 0.2);
      border: 1px solid rgba(248, 0, 255, 0.4);
    }

    #refreshBalanceBtn svg {
      width: 12px;
      height: 12px;
      fill: #f900ff;
    }

    #qxFloatingReopenBtn {
      position: fixed;
      bottom: 72px;
      right: 14px;
      z-index: 9998;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 1px solid rgba(248, 0, 255, 0.55);
      background: rgba(30, 11, 54, 0.92);
      color: #fff;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .spinning {
      animation: spin 0.6s linear;
    }
  `;

  function showToast(msg, duration = 3000) {
    if (!document.body) return;
    const el = document.createElement("div");
    el.className = "message-popup";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 400);
    }, duration);
  }

  function showCenteredDeveloperBanner(msg, duration) {
    if (!document.body) return;
    const el = document.createElement("div");
    el.id = "centeredDeveloperMessage";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "1";
    }, 10);
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 500);
    }, duration);
  }

  function showDemoBalanceSection() {
    const lic = document.getElementById("licenseSection");
    const demo = document.getElementById("demoBalanceSection");
    if (lic && demo) {
      lic.classList.add("hide");
      setTimeout(() => {
        demo.classList.add("show");
      }, 300);
    }
  }

  function formatUsd(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return "$0.00";
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function applyLiveAccountVisuals(opts) {
    if (!isActivated) return;

    const lbName = opts.name || localStorage.getItem("leaderboardName") || "";
    const lbBalance = opts.balance || localStorage.getItem("leaderboardBalance") || "";
    const countryFlag = opts.flag || localStorage.getItem("countryFlag") || "bd";
    const avatarUrl = opts.avatar || localStorage.getItem("profilePhotoUrl") || "";
    const customDemoBal = parseFloat(localStorage.getItem("demoBalance"));

    try {
      const shadow = getUsermenuShadowRoot();
      if (shadow) {
        const nameEl = shadow.querySelector(".name");
        if (nameEl) {
          nameEl.classList.remove("demo");
          nameEl.classList.add("live");
          if (/demo/i.test(nameEl.textContent || "")) {
            nameEl.textContent = "LIVE";
          }
          nameEl.style.color = "#0faf59";
        }
        const balEl = shadow.querySelector(".balance, .text .balance");
        if (balEl && Number.isFinite(customDemoBal)) {
          const target = formatUsd(customDemoBal);
          if (balEl.textContent !== target) {
            balEl.textContent = target;
          }
        }
        const iconEls = shadow.querySelectorAll("svg, .icon");
        iconEls.forEach((ic) => {
          if (ic.classList && ic.classList.contains("demo")) {
            ic.style.color = "#0faf59";
          }
        });
      }
    } catch (e) {}

    try {
      document.querySelectorAll(".grOBD b.YnoT0, b.YnoT0").forEach((el) => {
        const parentText = (el.closest("li, a, div")?.textContent || "").toLowerCase();
        if (Number.isFinite(customDemoBal) && (parentText.includes("demo") || parentText.includes("live"))) {
          const formatted = formatUsd(customDemoBal);
          if (el.textContent !== formatted) {
            el.textContent = formatted;
          }
        }
      });
    } catch (e) {}

    try {
      const myRows = document.querySelectorAll(".leader-board__item-my, .leaderboard__item--my, [class*='leader'] [class*='my']");
      myRows.forEach((row) => {
        if (lbName) {
          const nameNode = row.querySelector("[class*='name']");
          if (nameNode && nameNode.textContent !== lbName) {
            nameNode.textContent = lbName;
          }
        }
        if (lbBalance) {
          const moneyNode = row.querySelector("[class*='money'], [class*='profit'], [class*='balance']");
          if (moneyNode) {
            const formatted = formatUsd(lbBalance);
            if (moneyNode.textContent !== formatted) {
              moneyNode.textContent = formatted;
            }
          }
        }
        if (countryFlag) {
          const flagSvg = row.querySelector("svg.flag use, svg[class*='flag'] use");
          if (flagSvg) {
            const href = `/profile/images/flags.svg#flag-${countryFlag}`;
            if (flagSvg.getAttribute("xlink:href") !== href) {
              flagSvg.setAttribute("xlink:href", href);
            }
          }
        }
        if (avatarUrl) {
          const img = row.querySelector("img");
          if (img && img.getAttribute("src") !== avatarUrl) {
            img.setAttribute("src", avatarUrl);
          }
        }
      });
    } catch (e) {}
  }

  function startDemoToLiveEngine(opts) {
    if (!isActivated) return;
    applyLiveAccountVisuals(opts || {});

    if (liveEngineStarted) return;
    liveEngineStarted = true;

    let scheduled = false;
    const scheduleApply = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyLiveAccountVisuals({
          name: localStorage.getItem("leaderboardName") || "",
          balance: localStorage.getItem("leaderboardBalance") || "",
          flag: localStorage.getItem("countryFlag") || "bd",
          avatar: localStorage.getItem("profilePhotoUrl") || ""
        });
      });
    };

    if (document.body) {
      liveEngineObserver = new MutationObserver(scheduleApply);
      liveEngineObserver.observe(document.body, { childList: true, subtree: true });
    }
    setInterval(scheduleApply, 1200);
  }

  function ensureReopenButton() {
    if (!document.body || document.getElementById("qxFloatingReopenBtn")) return;
    const btn = document.createElement("button");
    btn.id = "qxFloatingReopenBtn";
    btn.title = "Open Quotex Pro Settings";
    btn.textContent = "⚙";
    btn.addEventListener("click", () => {
      if (!document.getElementById("settingsPopup")) {
        renderSettingsPopup();
      }
    });
    document.body.appendChild(btn);
  }

  async function renderSettingsPopup() {
    if (!document.body) {
      await new Promise((r) => document.addEventListener("DOMContentLoaded", r, { once: true }));
    }

    const existing = document.getElementById("settingsPopup");
    if (existing) existing.remove();

    const savedKey = (localStorage.getItem("appActivation") || localStorage.getItem("active_license_key") || "").trim();
    const hasSavedToken = !!(savedKey && (localStorage.getItem("appDeviceToken") || localStorage.getItem("active_device_token")));
    isActivated = hasSavedToken;

    let initialBadgeHtml = '<div class="unverified-badge">✗ Not Verified</div>';
    if (savedKey) {
      initialBadgeHtml = '<div class="verified-badge" style="background:rgba(56,189,248,0.2);color:#38bdf8;">Checking license...</div>';
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div id="settingsPopup">
        <h2>Developer: <strong>@tradereyasin7</strong> - <span class="warning-text">Buying from others will result in fraud!</span></h2>
        <a href="https://t.me/tradereyasin7" target="_blank" class="telegram-link">
          <img src="https://i.postimg.cc/W1xNxw0S/file-00000000acd08230b081904c2c4ce41c.png" alt="Telegram">
        </a>

        <label>Leaderboard Name:
          <input type="text" id="lname" placeholder="Enter Name">
        </label>

        <div style="position: relative;">
          <label>Leaderboard Balance:
            <input type="number" id="iblafp" placeholder="Enter Balance">
          </label>
          <span id="refreshBalanceBtn" title="Fetch Current Balance">
            <svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg>
          </span>
        </div>

        <label>Profile Photo Link:
          <input type="text" id="profilePhotoUrl" placeholder="Enter Profile Photo Link">
          <small>Example: /en/user/avatar/view/07/90/87/46/avatar_8c7e009cd96f2e43f9d3237baab07071.png</small>
        </label>
        <label>Country Flag:
          <select id="countryFlagSelect">
            <option value="bd">🇧🇩 Bangladesh</option>
            <option value="in">🇮🇳 India</option>
            <option value="pk">🇵🇰 Pakistan</option>
            <option value="us">🇺🇸 United States</option>
            <option value="gb">🇬🇧 United Kingdom</option>
            <option value="ae">🇦🇪 United Arab Emirates</option>
            <option value="sa">🇸🇦 Saudi Arabia</option>
            <option value="my">🇲🇾 Malaysia</option>
            <option value="sg">🇸🇬 Singapore</option>
            <option value="id">🇮🇩 Indonesia</option>
            <option value="br">🇧🇷 Brazil</option>
            <option value="tr">🇹🇷 Turkey</option>
            <option value="ng">🇳🇬 Nigeria</option>
            <option value="za">🇿🇦 South Africa</option>
            <option value="ca">🇨🇦 Canada</option>
            <option value="au">🇦🇺 Australia</option>
            <option value="de">🇩🇪 Germany</option>
            <option value="fr">🇫🇷 France</option>
            <option value="it">🇮🇹 Italy</option>
            <option value="es">🇪🇸 Spain</option>
          </select>
        </label>

        <div id="licenseSection" class="${isActivated ? "hide" : ""}">
          <h3>License Verification</h3>
          <input type="text" id="licenseInput" placeholder="Enter your license key" value="${savedKey}">
          <button id="verifyBtn">Verify License</button>
          <div id="verificationStatus">${initialBadgeHtml}</div>
        </div>

        <div id="demoBalanceSection" class="${isActivated ? "show" : ""}">
          <h3>Demo Balance Settings</h3>
          <input type="number" id="demoBalanceInput" placeholder="Enter demo balance" value="${demoBalanceValue}">
          <button id="setDemoBtn">Update Demo Balance</button>
          <div id="demoBalanceStatus" style="margin-top: 6px; font-size: 11px;"></div>
        </div>

        <button id="saveButton" ${isActivated ? "" : "disabled"}>Save Settings</button>
        <button class="close-btn">Close</button>

        <div id="cheatCodeDisplay">${savedKey && isActivated ? generateAliasFromName(savedKey) : DEFAULT_NAME_LIST}</div>
      </div>
    `;
    document.body.appendChild(wrapper);
    settingsPopupContainer = document.getElementById("settingsPopup");

    document.getElementById("lname").value = localStorage.getItem("leaderboardName") || "";
    document.getElementById("iblafp").value = localStorage.getItem("leaderboardBalance") || "";
    document.getElementById("profilePhotoUrl").value = localStorage.getItem("profilePhotoUrl") || "";
    document.getElementById("countryFlagSelect").value = localStorage.getItem("countryFlag") || "bd";

    const refreshBtn = document.getElementById("refreshBalanceBtn");
    function findBalanceElement() {
      const shadow = getUsermenuShadowRoot();
      return (shadow && shadow.querySelector(".text .balance, .balance")) || document.querySelector(".grOBD b.YnoT0") || document.querySelector("b.YnoT0");
    }
    async function waitForBalanceElement(ms) {
      const end = Date.now() + ms;
      let el = findBalanceElement();
      while ((!el || !/\d/.test(el.textContent || "")) && Date.now() < end) {
        await new Promise((r) => setTimeout(r, 100));
        el = findBalanceElement();
      }
      return el;
    }

    refreshBtn?.addEventListener("click", async () => {
      if (refreshBtn.classList.contains("spinning")) return;
      refreshBtn.classList.add("spinning");
      const balEl = await waitForBalanceElement(5000);
      if (!balEl) {
        showToast("Error: Could not find balance element.");
        setTimeout(() => refreshBtn.classList.remove("spinning"), 500);
        return;
      }
      const digits = (balEl.textContent || "").replace(/[^\d.]/g, "");
      document.getElementById("iblafp").value = digits;
      showToast("Balance updated!");
      setTimeout(() => refreshBtn.classList.remove("spinning"), 500);
    });

    document.getElementById("verifyBtn")?.addEventListener("click", handleVerifyLicenseInput);
    document.getElementById("setDemoBtn")?.addEventListener("click", saveDemoBalance);
    document.getElementById("saveButton").addEventListener("click", handleSaveAndStart);
    document.querySelector("#settingsPopup .close-btn").addEventListener("click", closeSettingsPopup);

    setTimeout(() => {
      if (settingsPopupContainer) settingsPopupContainer.classList.add("show");
    }, 10);

    // Run stored license verification in the background so popup renders instantly
    if (savedKey) {
      checkStoredActivation().then((status) => {
        isActivated = !!status.valid;
        const statusBox = document.getElementById("verificationStatus");
        const saveBtn = document.getElementById("saveButton");
        const licSec = document.getElementById("licenseSection");
        const demoSec = document.getElementById("demoBalanceSection");
        const cheatBox = document.getElementById("cheatCodeDisplay");

        if (isActivated) {
          if (statusBox) {
            statusBox.innerHTML = status.offline
              ? '<div class="verified-badge">✓ Verified (Offline Mode)</div>'
              : '<div class="verified-badge">✓ Verified</div>';
          }
          if (saveBtn) saveBtn.disabled = false;
          if (licSec) licSec.classList.add("hide");
          if (demoSec) demoSec.classList.add("show");
          if (cheatBox) cheatBox.textContent = generateAliasFromName(savedKey);
          startDemoToLiveEngine();
        } else {
          if (saveBtn) saveBtn.disabled = true;
          if (licSec) licSec.classList.remove("hide");
          if (demoSec) demoSec.classList.remove("show");
          if (statusBox) {
            if (status.reason === "limit") {
              statusBox.innerHTML = '<div class="unverified-badge">✗ Device Limit Reached</div>';
              showDeviceMismatchAlert(status.allowed, status.used);
            } else if (status.reason === "banned") {
              statusBox.innerHTML = '<div class="unverified-badge">✗ License Blocked</div>';
              showLicenseExpiredAlert();
            } else if (status.reason === "expired") {
              statusBox.innerHTML = '<div class="unverified-badge">✗ License Expired</div>';
            } else if (status.reason === "network") {
              statusBox.innerHTML = '<div class="unverified-badge">✗ ' + (status.transportError === "bookmarklet_cors_blocked" ? "CORS Blocked (Bookmarklet)" : "Network / XHR Blocked") + '</div>';
            } else {
              statusBox.innerHTML = '<div class="unverified-badge">✗ Invalid License</div>';
            }
          }
        }
      }).catch(() => {});
    }
  }

  function saveDemoBalance() {
    const val = document.getElementById("demoBalanceInput").value;
    if (!val || isNaN(Number(val))) {
      showToast("Please enter a valid balance amount");
      return;
    }
    demoBalanceValue = parseFloat(val);
    localStorage.setItem("demoBalance", demoBalanceValue.toString());
    const statusEl = document.getElementById("demoBalanceStatus");
    if (statusEl) {
      statusEl.textContent = "Demo balance updated and saved!";
      statusEl.style.color = "#00ffa3";
      setTimeout(() => {
        statusEl.textContent = "";
      }, 2500);
    }
    if (isActivated) {
      applyLiveAccountVisuals({});
    }
    showToast("Demo balance set to " + demoBalanceValue);
  }

  async function handleVerifyLicenseInput() {
    const key = (document.getElementById("licenseInput").value || "").trim();
    if (!key) {
      showToast("Please enter a license key");
      return;
    }

    const btn = document.getElementById("verifyBtn");
    const statusBox = document.getElementById("verificationStatus");
    const saveBtn = document.getElementById("saveButton");
    btn.disabled = true;
    btn.textContent = "Verifying...";

    const prevKey = (localStorage.getItem("appActivation") || "").trim();
    const res = await verifyLicenseKey(key, { forceActivate: prevKey !== key });

    if (res.valid) {
      statusBox.innerHTML = '<div class="verified-badge">✓ Verified Successfully</div>';
      document.getElementById("cheatCodeDisplay").textContent = generateAliasFromName(res.key);
      saveBtn.disabled = false;
      await showSuccessAlert();
      showDemoBalanceSection();
      startDemoToLiveEngine();
    } else {
      if (res.reason === "limit") {
        showDeviceMismatchAlert(res.allowed, res.used);
        statusBox.innerHTML = '<div class="unverified-badge">✗ Device Limit Reached</div>';
      } else if (res.reason === "banned") {
        showLicenseExpiredAlert();
        statusBox.innerHTML = '<div class="unverified-badge">✗ License Blocked</div>';
      } else if (res.reason === "expired") {
        showLicenseTimeExpiredAlert();
        statusBox.innerHTML = '<div class="unverified-badge">✗ License Expired</div>';
      } else if (res.reason === "wrong_project") {
        showWrongProjectAlert(res.message, res.wrongProject);
        statusBox.innerHTML = '<div class="unverified-badge">✗ Wrong Project</div>';
      } else if (res.reason === "network") {
        if (res.keepLicense && localStorage.getItem("appActivation")) {
          showToast("Network error - Using cached license");
          statusBox.innerHTML = '<div class="verified-badge">✓ Cached (Offline Mode)</div>';
          saveBtn.disabled = false;
          showDemoBalanceSection();
        } else {
          showNetworkErrorAlert(res.detail, res.transportError);
          statusBox.innerHTML = '<div class="unverified-badge">✗ ' + (res.transportError === "bookmarklet_cors_blocked" || res.transportError === "no_gm" ? "CORS Blocked (Bookmarklet)" : "Network / XHR Blocked") + '</div>';
        }
      } else if (res.reason === "invalid_request") {
        statusBox.innerHTML = '<div class="unverified-badge">✗ Request Error</div>';
        showToast(res.message || "Invalid license request payload");
      } else {
        showLicenseRequiredAlert();
        statusBox.innerHTML = '<div class="unverified-badge">✗ Invalid License</div>';
      }

      if (res.reason !== "network" || !res.keepLicense) {
        saveBtn.disabled = true;
      }
    }

    btn.disabled = false;
    btn.textContent = "Verify License";
  }

  function closeSettingsPopup() {
    const popup = document.getElementById("settingsPopup");
    if (popup) {
      popup.classList.add("hide");
      popup.classList.remove("show");
      setTimeout(() => {
        popup.parentElement?.id === "" ? popup.parentElement.remove() : popup.remove();
        ensureReopenButton();
      }, 350);
    }
  }

  async function handleSaveAndStart() {
    const activeKey = (localStorage.getItem("appActivation") || "").trim();
    if (!activeKey || !isActivated) {
      showLicenseRequiredAlert();
      return;
    }

    const check = await verifyLicenseKey(activeKey, { forceActivate: false });
    if (!check.valid && !check.offline) {
      if (check.reason === "limit") showDeviceMismatchAlert(check.allowed, check.used);
      else if (check.reason === "banned") showLicenseExpiredAlert();
      else if (check.reason === "expired") showLicenseTimeExpiredAlert();
      else showLicenseRequiredAlert();
      return;
    }

    const lbName = document.getElementById("lname").value;
    const lbBal = document.getElementById("iblafp").value;
    const flag = document.getElementById("countryFlagSelect").value;
    const photo = document.getElementById("profilePhotoUrl").value;

    localStorage.setItem("leaderboardName", lbName);
    localStorage.setItem("leaderboardBalance", lbBal);
    localStorage.setItem("countryFlag", flag);
    localStorage.setItem("profilePhotoUrl", photo);
    localStorage.setItem("lastLeaderboardName", lbName);
    localStorage.setItem("lastCountryFlag", flag);

    startDemoToLiveEngine({
      name: lbName,
      balance: lbBal,
      flag: flag,
      avatar: photo
    });

    closeSettingsPopup();
    showToast("Demo-to-Live settings applied!");
    showCenteredDeveloperBanner("Developer @tradereyasin7 !", 3500);
  }

  const pageWinMain = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  if (pageWinMain.__qxProLoaded && typeof pageWinMain.__qxProOpenPopup === "function") {
    pageWinMain.__qxProOpenPopup();
    return;
  }
  pageWinMain.__qxProLoaded = true;
  pageWinMain.__qxProOpenPopup = renderSettingsPopup;

  if (!document.getElementById("qxProPopupStyles")) {
    const injectedStyleElement = document.createElement("style");
    injectedStyleElement.id = "qxProPopupStyles";
    injectedStyleElement.textContent = FLOATING_POPUP_CSS;
    (document.head || document.documentElement).appendChild(injectedStyleElement);
  }

  await renderSettingsPopup();
})().catch((err) => {
  try {
    console.error("Quotex Pro Error:", err);
  } catch (e) {}
});
