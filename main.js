// ==UserScript==
// @name         App License Client (Quotex Edition)
// @namespace    https://demotoliveadmin.lovable.app
// @version      2.0.0
// @description  License client for Quotex broker sites with fingerprint device ID
// @match        *://qxbroker.com/*
// @match        *://*.qxbroker.com/*
// @match        *://quotex.io/*
// @match        *://*.quotex.io/*
// @match        *://quotex-market.com/*
// @match        *://*.quotex-market.com/*
// @match        *://*.quotex.*/*
// @match        *://market-qx.info/*
// @match        *://*.market-qx.info/*
// @match        *://*.market-qx.trade/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      demotoliveadmin.lovable.app
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  const SERVER_BASE = "https://demotoliveadmin.lovable.app";
  const PROJECT_TYPE = "Quotex";
  const REQUEST_TIMEOUT = 15000;

  // Quotex দ্বিতীয় স্ক্রিপ্টের সাথে সামঞ্জস্যপূর্ণ স্টোরেজ কী
  const LS_LICENSE_KEY = "appActivation";
  const LS_DEVICE_TOKEN = "appDeviceToken";
  const LS_DEVICE_ID = "customDeviceId";
  const LS_LAST_VERIFIED = "lastVerified";

  // ============================================================
  // ডিভাইস ফিঙ্গারপ্রিন্ট (Quotex স্টাইলে)
  // ============================================================
  function getCanvasFingerprint() {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Quotex License FP", 2, 15);
      const data = canvas.toDataURL();
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        hash = (hash << 5) - hash + data.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    } catch (e) {
      return "canvas_error";
    }
  }

  function getWebGLFingerprint() {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) return "webgl_not_supported";
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const vendor = ext
        ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)
        : "Unknown";
      const renderer = ext
        ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
        : "Unknown";
      const src = vendor + "|" + renderer;
      let hash = 0;
      for (let i = 0; i < src.length; i++) {
        hash = (hash << 5) - hash + src.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    } catch (e) {
      return "webgl_error";
    }
  }

  function getOrCreateDeviceId() {
    let id = localStorage.getItem(LS_DEVICE_ID);
    if (!id) {
      const canvasFP = getCanvasFingerprint();
      const webglFP = getWebGLFingerprint();
      const cores = navigator.hardwareConcurrency || "0";
      const screenW = screen.width || 0;
      const screenH = screen.height || 0;
      // ফিঙ্গারপ্রিন্ট ভিত্তিক স্টেবল আইডি
      id =
        "qx-" +
        canvasFP +
        "-" +
        webglFP +
        "-" +
        cores +
        "-" +
        screenW +
        "x" +
        screenH;
      localStorage.setItem(LS_DEVICE_ID, id);
    }
    return id;
  }

  // ============================================================
  // API কল (GM4/GM3/fetch fallback সহ)
  // ============================================================
  function apiPost(path, payload) {
    const url = SERVER_BASE + path;
    const bodyStr = JSON.stringify(payload || {});

    return new Promise((resolve, reject) => {
      // GM4 (Promise-based)
      if (typeof GM !== "undefined" && GM.xmlHttpRequest) {
        GM.xmlHttpRequest({
          method: "POST",
          url: url,
          headers: { "Content-Type": "application/json" },
          data: bodyStr,
          timeout: REQUEST_TIMEOUT,
        })
          .then((res) => {
            let data;
            try {
              data = JSON.parse(res.responseText);
            } catch {
              return reject(new Error("Invalid server response"));
            }
            resolve({
              ok: res.status >= 200 && res.status < 300,
              status: res.status,
              data,
            });
          })
          .catch(() => reject(new Error("Network connection error")));
        return;
      }

      // GM3 (callback-based)
      if (typeof GM_xmlhttpRequest !== "undefined") {
        GM_xmlhttpRequest({
          method: "POST",
          url: url,
          headers: { "Content-Type": "application/json" },
          data: bodyStr,
          timeout: REQUEST_TIMEOUT,
          onload: (res) => {
            let data;
            try {
              data = JSON.parse(res.responseText);
            } catch {
              return reject(new Error("Invalid server response"));
            }
            resolve({
              ok: res.status >= 200 && res.status < 300,
              status: res.status,
              data,
            });
          },
          onerror: () => reject(new Error("Network connection error")),
          ontimeout: () => reject(new Error("Request timeout")),
        });
        return;
      }

      // Fetch fallback
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyStr,
      })
        .then(async (res) => {
          let data;
          try {
            data = await res.json();
          } catch {
            return reject(new Error("Invalid server response"));
          }
          resolve({ ok: res.ok, status: res.status, data });
        })
        .catch(() => reject(new Error("Network connection error")));
    });
  }

  // ============================================================
  // অ্যাক্টিভেশন
  // ============================================================
  async function activateLicense(licenseKey) {
    if (!licenseKey || typeof licenseKey !== "string") {
      return { success: false, reason: "missing_license_key" };
    }

    const key = licenseKey.trim();
    const deviceId = getOrCreateDeviceId();

    try {
      const res = await apiPost("/api/public/license/activate", {
        license_key: key,
        device_id: deviceId,
        project_type: PROJECT_TYPE,
        browser: navigator.userAgent,
        os: navigator.platform || "Unknown",
        device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
          ? "mobile"
          : "desktop",
      });

      if (res.ok && res.data && res.data.valid) {
        localStorage.setItem(LS_LICENSE_KEY, key);
        localStorage.setItem(LS_LAST_VERIFIED, String(Date.now()));
        if (res.data.device_token) {
          localStorage.setItem(LS_DEVICE_TOKEN, res.data.device_token);
        }
        return {
          success: true,
          expires_at: res.data.expires_at || null,
          license_key: key,
        };
      }

      // সার্ভার থেকে বিশেষ রিজন হ্যান্ডল
      const reason = (res.data && res.data.reason) || "activation_failed";
      if (reason === "wrong_project") {
        return { success: false, reason: "wrong_project" };
      }
      if (reason === "device_limit_reached") {
        return { success: false, reason: "limit" };
      }
      if (reason === "expired") {
        return { success: false, reason: "expired" };
      }
      return { success: false, reason };
    } catch (e) {
      return { success: false, reason: "network_error" };
    }
  }

  // ============================================================
  // ভেরিফিকেশন
  // ============================================================
  async function verifyLicense() {
    const licenseKey = localStorage.getItem(LS_LICENSE_KEY);
    const deviceToken = localStorage.getItem(LS_DEVICE_TOKEN) || "";
    const deviceId = getOrCreateDeviceId();

    if (!licenseKey) {
      return { valid: false, reason: "no_license" };
    }

    try {
      const res = await apiPost("/api/public/license/verify", {
        license_key: licenseKey,
        device_id: deviceId,
        device_token: deviceToken,
        project_type: PROJECT_TYPE,
      });

      if (res.ok && res.data && res.data.valid) {
        localStorage.setItem(LS_LAST_VERIFIED, String(Date.now()));
        return {
          valid: true,
          expires_at: res.data.expires_at || null,
          license_key: licenseKey,
        };
      }

      const reason = (res.data && res.data.reason) || "invalid";

      // গুরুতর রিজনে লাইসেন্স ক্লিয়ার (banned/expired/invalid)
      if (
        reason === "banned" ||
        reason === "expired" ||
        reason === "invalid_license" ||
        reason === "wrong_project"
      ) {
        clearLicenseStorage();
      }

      return { valid: false, reason };
    } catch (e) {
      // নেটওয়ার্ক সমস্যা → পুরনো লাইসেন্স থাকলে অফলাইন মোড
      const prevKey = localStorage.getItem(LS_LICENSE_KEY);
      if (prevKey === licenseKey) {
        return {
          valid: true,
          offline: true,
          license_key: licenseKey,
        };
      }
      return { valid: false, reason: "network_error" };
    }
  }

  // ============================================================
  // হেল্পার ফাংশন
  // ============================================================
  function clearLicenseStorage() {
    try {
      localStorage.removeItem(LS_LICENSE_KEY);
      localStorage.removeItem(LS_DEVICE_TOKEN);
      localStorage.removeItem(LS_LAST_VERIFIED);
    } catch (e) {}
  }

  function getCurrentLicense() {
    return {
      license_key: localStorage.getItem(LS_LICENSE_KEY) || null,
      device_token: localStorage.getItem(LS_DEVICE_TOKEN) || null,
      device_id: getOrCreateDeviceId(),
      last_verified: Number(localStorage.getItem(LS_LAST_VERIFIED) || 0),
    };
  }

  // ============================================================
  // Quotex ডোমেইন চেক (শুধুমাত্র Quotex সাইটে API এক্সপোজ)
  // ============================================================
  function isQuotexDomain() {
    const host = location.hostname.toLowerCase();
    return (
      /(^|\.)qxbroker\.com$/.test(host) ||
      /(^|\.)quotex\.io$/.test(host) ||
      /(^|\.)quotex-market\.com$/.test(host) ||
      /(^|\.)quotex\./.test(host) ||
      /(^|\.)market-qx\.info$/.test(host) ||
      /(^|\.)market-qx\.trade$/.test(host)
    );
  }

  // ============================================================
  // গ্লোবাল API এক্সপোর্ট
  // ============================================================
  if (isQuotexDomain()) {
    window.AppLicense = {
      version: "2.0.0",
      projectType: PROJECT_TYPE,
      activate: activateLicense,
      verify: verifyLicense,
      clear: clearLicenseStorage,
      getDeviceId: getOrCreateDeviceId,
      getCurrentLicense: getCurrentLicense,
    };

    console.log("[AppLicense] Quotex Edition loaded ✔ v2.0.0");
  }
})();
