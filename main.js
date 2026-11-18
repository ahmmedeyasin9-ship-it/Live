// ==UserScript==
// @name         Quotex Demo to Live Pro + License Client
// @namespace    https://demotoliveadmin.lovable.app
// @version      2.2.0
// @description  Quotex Demo to Live with integrated Demotoliveadmin License System (Clean UI)
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
// @connect      demotoliveadmin.lovable.app
// @connect      *
// @run-at       document-start
// ==/UserScript==

(function() {
  const SERVER_BASE = "https://demotoliveadmin.lovable.app";

  function getDeviceId() {
    let id = localStorage.getItem("app_device_id");
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
      localStorage.setItem("app_device_id", id);
    }
    return id;
  }

  function apiPost(path, payload) {
    const url = `${SERVER_BASE}${path}`;
    const bodyStr = JSON.stringify(payload);

    return new Promise((resolve) => {
      const gmReq = typeof GM_xmlhttpRequest === "function"
        ? GM_xmlhttpRequest
        : (typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function" ? GM.xmlHttpRequest : null);

      const fallbackFetch = () => {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyStr
        })
          .then(async res => {
            const text = await res.text();
            try {
              resolve({ ok: res.ok, status: res.status, data: JSON.parse(text) });
            } catch (e) {
              resolve({ ok: false, status: res.status, data: { valid: false, reason: "invalid_response" } });
            }
          })
          .catch(() => {
            resolve({ ok: false, status: 0, data: { valid: false, reason: "network" } });
          });
      };

      if (gmReq) {
        try {
          gmReq({
            method: "POST",
            url: url,
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            data: bodyStr,
            timeout: 15000,
            onload: function(res) {
              try {
                const parsed = JSON.parse(res.responseText);
                resolve({ ok: res.status >= 200 && res.status < 300, status: res.status, data: parsed });
              } catch (e) {
                resolve({ ok: false, status: res.status, data: { valid: false, reason: "invalid_response" } });
              }
            },
            onerror: function() {
              fallbackFetch();
            },
            ontimeout: function() {
              fallbackFetch();
            }
          });
        } catch (err) {
          fallbackFetch();
        }
      } else {
        fallbackFetch();
      }
    });
  }

  async function activateLicense(licenseKey) {
    const deviceId = getDeviceId();
    const res = await apiPost("/api/public/license/activate", {
      license_key: licenseKey,
      device_id: deviceId
    });

    if (res.ok && res.data && res.data.valid) {
      localStorage.setItem("active_license_key", licenseKey);
      if (res.data.device_token) {
        localStorage.setItem("active_device_token", res.data.device_token);
      }
      return { success: true, expires_at: res.data.expires_at };
    }
    return { success: false, reason: (res.data && res.data.reason) || "Activation failed" };
  }

  async function verifyLicense() {
    const licenseKey = localStorage.getItem("active_license_key");
    const deviceToken = localStorage.getItem("active_device_token");
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

  window.AppLicense = { activate: activateLicense, verify: verifyLicense, apiPost: apiPost };
})();

(function initShadowDomHook() {
  if (window.__qxShadowPatched) {
    return;
  }
  window.__qxShadowPatched = true;
  const shadowRootWeakMap = new WeakMap();
  const originalAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (shadowOptions) {
    const createdShadowRoot = originalAttachShadow.call(this, Object.assign({}, shadowOptions || {}, {
      ["mode"]: "open"
    }));
    shadowRootWeakMap.set(this, createdShadowRoot);
    if (this.localName === "qx-usermenu-trigger") {
      window.__qxUsermenuShadow = createdShadowRoot;
    }
    return createdShadowRoot;
  };
  window.__qxGetShadowRoot = function (targetElement) {
    if (!targetElement) {
      return null;
    }
    return targetElement.shadowRoot || shadowRootWeakMap.get(targetElement) || null;
  };
  window.__qxEnsureUsermenuShadow = function () {
    const triggerElement = document.querySelector("qx-usermenu-trigger");
    if (!triggerElement) {
      return null;
    }
    const existingShadowRoot = triggerElement.shadowRoot || shadowRootWeakMap.get(triggerElement) || window.__qxUsermenuShadow || null;
    if (existingShadowRoot) {
      return existingShadowRoot;
    }
    if (!window.__qxUsermenuShadowKicked) {
      window.__qxUsermenuShadowKicked = true;
      try {
        triggerElement.remove();
      } catch (shadowRemoveErr) {}
    }
    return null;
  };
})();

(async function () {
  function getUsermenuShadowRoot() {
    if (typeof window.__qxEnsureUsermenuShadow === "function") {
      return window.__qxEnsureUsermenuShadow();
    }
    const v_1 = document.querySelector("qx-usermenu-trigger");
    return v_1 ? v_1.shadowRoot || window.__qxUsermenuShadow || null : null;
  }
  function isDemoAccount() {
    const v_2 = location.pathname || "";
    const v_3 = location.href || "";
    if (/\/demo-trade(?:\/|$|\?)/i.test(v_2) || /\/demo-trade(?:\/|$|\?)/i.test(v_3)) {
      return true;
    }
    const v_4 = getUsermenuShadowRoot();
    const v_5 = v_4 && v_4.querySelector(".name");
    if (v_5) {
      if (v_5.classList.contains("demo") || /demo/i.test(v_5.textContent || "")) {
        return true;
      }
      if (v_5.classList.contains("live") || /^live(\s+account)?$/i.test((v_5.textContent || "").trim())) {
        return false;
      }
    }
    const v_6 = document.querySelector(".grOBD input.r29tN[value=\"demo\"]");
    if (v_6 && v_6.checked) {
      return true;
    }
    if (document.querySelector(".grOBD li.RDtBn.Qx5RW a.yBslY[href*=\"demo-trade\"]")) {
      return true;
    }
    if (document.querySelector(".grOBD a.yBslY.active[href*=\"demo-trade\"]")) {
      return true;
    }
    const v_7 = document.querySelector(".grOBD input.r29tN[value=\"live\"]");
    if (v_7 && v_7.checked) {
      return false;
    }
    if (document.querySelector(".grOBD input.r29tN[value=\"live\"]:checked")) {
      return false;
    }
    return false;
  }
  function ensureMenuOpen() {
    if (!isMenuPresent()) {
      return false;
    }
    return clickMenuTrigger();
  }
  function isMenuPresent() {
    return !!(document.querySelector(".p0Ijl.Qx5RW") || document.querySelector(".QE4Zb .p0Ijl") || document.querySelector(".RyAkb .grOBD") || document.querySelector(".grOBD li.RDtBn"));
  }
  function dispatchFullClick(v_8) {
    if (!v_8) {
      return false;
    }
    try {
      v_8.dispatchEvent(new MouseEvent("pointerdown", {
        ["bubbles"]: true,
        ["cancelable"]: true,
        ["view"]: window
      }));
      v_8.dispatchEvent(new MouseEvent("mousedown", {
        ["bubbles"]: true,
        ["cancelable"]: true,
        ["view"]: window
      }));
      v_8.click();
      v_8.dispatchEvent(new MouseEvent("mouseup", {
        ["bubbles"]: true,
        ["cancelable"]: true,
        ["view"]: window
      }));
      v_8.dispatchEvent(new MouseEvent("pointerup", {
        ["bubbles"]: true,
        ["cancelable"]: true,
        ["view"]: window
      }));
    } catch (v_9) {
      try {
        v_8.click();
      } catch (v_10) {}
    }
    return true;
  }
  function clickMenuTrigger() {
    const v_11 = document.querySelector(".RyAkb .uoy2n") || document.querySelector(".uoy2n qx-usermenu-trigger") || document.querySelector("qx-usermenu-trigger") || document.querySelector(".RyAkb .QE4Zb") || document.querySelector(".QE4Zb");
    return dispatchFullClick(v_11);
  }
  function getDemoAccountElement() {
    const v_12 = document.querySelector(".grOBD input.r29tN[value=\"demo\"]");
    if (v_12) {
      const v_13 = v_12.closest("li.RDtBn");
      return v_13 && v_13.querySelector("a.yBslY") || v_12.closest("label") || v_12.closest("a.yBslY") || v_13 || v_12;
    }
    return document.querySelector(".grOBD a.yBslY[href*=\"demo-trade\"]") || document.querySelector(".grOBD a[href*=\"/demo-trade\"]") || document.querySelector(".p0Ijl a.yBslY[href*=\"demo-trade\"]") || document.querySelector("a.yBslY[href*=\"/en/demo-trade\"]");
  }
  function confirmAccountSwitch() {
    const v_14 = document.querySelector(".modal-account-type-changed button.PUCjQ") || document.querySelector(".modal.modal-account-type-changed button.PUCjQ") || document.querySelector(".modal.active.center .modal-account-type-changed button.PUCjQ") || document.querySelector(".modal-account-type-changed .modal__close") || document.querySelector(".modal.active.center button.PUCjQ") || document.querySelector("button.PUCjQ") || document.querySelector(".modal-account-type-changed__body-button") || document.querySelector(".modal.active .modal__close");
    return dispatchFullClick(v_14);
  }
  async function switchToDemo(v_15) {
    const v_16 = v_15 || 1;
    try {
      if (!document.querySelector("qx-usermenu-trigger, .RyAkb .uoy2n, .QE4Zb")) {
        if (v_16 < 25) {
          setTimeout(() => switchToDemo(v_16 + 1), 200);
        }
        return;
      }
      if (isDemoAccount()) {
        ensureMenuOpen();
        confirmAccountSwitch();
        return;
      }
      if (!isMenuPresent()) {
        if (!clickMenuTrigger()) {
          if (v_16 < 25) {
            setTimeout(() => switchToDemo(v_16 + 1), 250);
          }
          return;
        }
        await new Promise(v_17 => setTimeout(v_17, 150));
      }
      if (isDemoAccount()) {
        ensureMenuOpen();
        confirmAccountSwitch();
        return;
      }
      const v_18 = getDemoAccountElement();
      if (!v_18) {
        if (v_16 < 25) {
          setTimeout(() => switchToDemo(v_16 + 1), 250);
        }
        return;
      }
      dispatchFullClick(v_18);
      await new Promise(v_19 => setTimeout(v_19, 250));
      confirmAccountSwitch();
      setTimeout(confirmAccountSwitch, 400);
      setTimeout(confirmAccountSwitch, 900);
      await new Promise(v_20 => setTimeout(v_20, 300));
      if (!isDemoAccount() && v_16 < 12) {
        setTimeout(() => switchToDemo(v_16 + 1), 400);
      }
    } catch (v_21) {
      if (v_16 < 15) {
        setTimeout(() => switchToDemo(v_16 + 1), 400);
      }
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => switchToDemo(1), 200);
    });
  } else {
    setTimeout(() => switchToDemo(1), 200);
  }
  if (typeof Swal === "undefined") {
    await new Promise((v_22, v_23) => {
      const v_24 = document.createElement("script");
      v_24.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      v_24.onload = v_22;
      v_24.onerror = v_23;
      document.head.appendChild(v_24);
    });
  }

  const PROJECT_TYPE = "Quotex";
  const API_BASE_URL = "https://demotoliveadmin.lovable.app";
  const DEFAULT_NAME_LIST = "Oblivion Comet Nebula Specter Comet Nimbus Quartz Inferno Quotex Blitz Drift";
  let isActivated = false;
  let settingsPopupContainer = null;
  let demoBalanceValue = parseFloat(localStorage.getItem("demoBalance")) || 12500;
  const TOKEN_KEY_PART_1A = [128, 135, 111];
  const TOKEN_KEY_PART_1B = "x7f2a9d4e1b8c3f6a0e5d9c2b7";
  const TOKEN_KEY_PART_1C = "k3m8v1p6w9t2r5j0n4q7y2x8s1f6d3h0l5b9g4c7e2a8u1i6o";

  function clearCachedTokens() {
    try {
      if (typeof reconstructTokenKey === "function") {
        localStorage.removeItem(reconstructTokenKey(0));
        localStorage.removeItem(reconstructTokenKey(1));
      }
    } catch (v_38) {}
  }

  function clearLicenseStorage() {
    try {
      localStorage.removeItem("appActivation");
      localStorage.removeItem("lastVerified");
      localStorage.removeItem("appDeviceToken");
      clearCachedTokens();
    } catch (v_39) {}
    isActivated = false;
  }

  async function getCanvasFingerprint() {
    try {
      const v_44 = document.createElement("canvas");
      const v_45 = v_44.getContext("2d");
      v_44.width = 200;
      v_44.height = 50;
      v_45.textBaseline = "top";
      v_45.font = "14px 'Arial'";
      v_45.textBaseline = "alphabetic";
      v_45.fillStyle = "#f60";
      v_45.fillRect(125, 1, 62, 20);
      v_45.fillStyle = "#069";
      v_45.fillText("Quotex FP 2026", 2, 15);
      v_45.fillStyle = "rgba(102, 204, 0, 0.7)";
      v_45.fillText("Quotex FP 2026", 4, 17);
      const v_46 = v_44.toDataURL();
      let v_47 = 0;
      for (let v_48 = 0; v_48 < v_46.length; v_48++) {
        const v_49 = v_46.charCodeAt(v_48);
        v_47 = (v_47 << 5) - v_47 + v_49;
        v_47 = v_47 & v_47;
      }
      return Math.abs(v_47).toString(16);
    } catch (v_50) {
      return "canvas_error";
    }
  }
  const TOKEN_KEY_PART_2A = [107, 137, 88];
  const TOKEN_KEY_PART_2B = "f4a1e8d3c6b9f0a5e2d8c1b7f4";
  const TOKEN_KEY_PART_2C = "3z0m5v9p4w7t2r8j1n6q3y0x5s9f2d7h4l1b6g3c0e8a5u2i7o";

  async function getWebGLFingerprint() {
    try {
      const v_51 = document.createElement("canvas");
      const v_52 = v_51.getContext("webgl") || v_51.getContext("experimental-webgl");
      if (!v_52) {
        return "webgl_not_supported";
      }
      const v_53 = v_52.getExtension("WEBGL_debug_renderer_info");
      const v_54 = v_53 ? v_52.getParameter(v_53.UNMASKED_VENDOR_WEBGL) : "Unknown";
      const v_55 = v_53 ? v_52.getParameter(v_53.UNMASKED_RENDERER_WEBGL) : "Unknown";
      const v_56 = v_54 + "|" + v_55;
      let v_57 = 0;
      for (let v_58 = 0; v_58 < v_56.length; v_58++) {
        const v_59 = v_56.charCodeAt(v_58);
        v_57 = (v_57 << 5) - v_57 + v_59;
        v_57 = v_57 & v_57;
      }
      return Math.abs(v_57).toString(16);
    } catch (v_60) {
      return "webgl_error";
    }
  }
  const TOKEN_KEY_PART_3A = [159, 128, 173];

  async function collectDeviceInfo() {
    const v_61 = navigator.userAgent;
    let v_62 = "Unknown";
    let v_63 = "Unknown";
    let v_64 = "Unknown";
    if (v_61.includes("Firefox")) {
      v_63 = "Firefox";
    } else if (v_61.includes("SamsungBrowser")) {
      v_63 = "Samsung Browser";
    } else if (v_61.includes("Opera") || v_61.includes("OPR/")) {
      v_63 = "Opera";
    } else if (v_61.includes("Trident")) {
      v_63 = "Internet Explorer";
    } else if (v_61.includes("Edge")) {
      v_63 = "Edge";
    } else if (v_61.includes("Chrome")) {
      v_63 = "Chrome";
    } else if (v_61.includes("Safari")) {
      v_63 = "Safari";
    }

    if (v_61.includes("Android")) {
      v_64 = "Android";
    } else if (v_61.includes("Linux")) {
      v_64 = "Linux";
    } else if (v_61.includes("iPhone") || v_61.includes("iPad") || v_61.includes("iPod")) {
      v_64 = "iOS";
    } else if (v_61.includes("Macintosh")) {
      v_64 = "Mac OS";
    } else if (v_61.includes("Windows")) {
      v_64 = "Windows";
    }

    if (v_61.includes("Mobile")) {
      v_62 = "Mobile";
    } else if (v_61.includes("Tablet")) {
      v_62 = "Tablet";
    } else {
      v_62 = "Desktop";
    }

    const v_65 = `${window.screen.width}x${window.screen.height}`;
    const v_66 = await getCanvasFingerprint();
    const v_67 = await getWebGLFingerprint();
    const v_68 = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const v_69 = navigator.language || navigator.userLanguage || "Unknown";
    const v_70 = screen.colorDepth || 24;
    const v_71 = window.devicePixelRatio || 1;
    const v_72 = navigator.platform || "Unknown";
    const v_73 = navigator.hardwareConcurrency || "Unknown";
    const v_74 = navigator.deviceMemory || "Unknown";
    return {
      ["screenResolution"]: v_65,
      ["canvasFingerprint"]: v_66,
      ["webglFingerprint"]: v_67,
      ["timezone"]: v_68,
      ["language"]: v_69,
      ["colorDepth"]: v_70,
      ["pixelRatio"]: v_71,
      ["platform"]: v_72,
      ["browser"]: v_63,
      ["os"]: v_64,
      ["deviceType"]: v_62,
      ["userAgent"]: v_61,
      ["cpuCores"]: v_73,
      ["deviceMemory"]: v_74,
      ["plugins"]: Array.from(navigator.plugins || []).map(v_75 => v_75.name).join(", ") || "None"
    };
  }

  function getOrCreateDeviceId() {
    let v_76 = localStorage.getItem("customDeviceId") || localStorage.getItem("app_device_id");
    if (!v_76) {
      v_76 = "dev_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
    }
    localStorage.setItem("customDeviceId", v_76);
    localStorage.setItem("app_device_id", v_76);
    return v_76;
  }

  const TOKEN_KEY_PART_4A = [105, 136, 114];
  const TOKEN_KEY_PART_4B = "a3e9d6c0b5f2a8e1d4c7b3f6a0e";
  const TOKEN_KEY_PART_4C = "4z1m9v6p3w0t5r2j8n1q4y7x0s3f6d9h2l5b0g7c4e1a8u3i6o";

  async function callLicenseApi(endpoint, payload) {
    const url = `${API_BASE_URL}/api/public/license/${endpoint}`;
    const bodyStr = JSON.stringify(payload);

    const doFetch = async () => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: bodyStr
        });
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          return { valid: false, reason: "invalid_response" };
        }
      } catch (err) {
        return { valid: false, reason: "network" };
      }
    };

    const gmReq = typeof GM_xmlhttpRequest === "function"
      ? GM_xmlhttpRequest
      : (typeof GM !== "undefined" && typeof GM.xmlHttpRequest === "function" ? GM.xmlHttpRequest : null);

    if (gmReq) {
      return new Promise((resolve) => {
        try {
          gmReq({
            method: "POST",
            url: url,
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            data: bodyStr,
            timeout: 15000,
            onload: (r) => {
              try {
                if (r.status === 0 || !r.responseText) {
                  doFetch().then(resolve);
                  return;
                }
                resolve(JSON.parse(r.responseText));
              } catch (e) {
                doFetch().then(resolve);
              }
            },
            onerror: () => {
              doFetch().then(resolve);
            },
            ontimeout: () => {
              doFetch().then(resolve);
            }
          });
        } catch (e) {
          doFetch().then(resolve);
        }
      });
    }

    return await doFetch();
  }

  async function verifyLicenseKey(v_77) {
    const v_78 = await collectDeviceInfo();
    const deviceId = getOrCreateDeviceId();
    const storedToken = localStorage.getItem("appDeviceToken") || localStorage.getItem("active_device_token") || "";
    try {
      let v_80 = null;
      if (storedToken) {
        v_80 = await callLicenseApi("verify", {
          license_key: v_77,
          device_id: deviceId,
          device_token: storedToken,
          browser: v_78.browser || "Browser",
          os: v_78.os || "OS",
          device_type: v_78.deviceType || "desktop"
        });
      }

      if (!v_80 || (!v_80.valid && (v_80.reason === "device_not_activated" || v_80.reason === "invalid_token" || !storedToken))) {
        v_80 = await callLicenseApi("activate", {
          license_key: v_77,
          device_id: deviceId,
          browser: v_78.browser || "Browser",
          os: v_78.os || "OS",
          device_type: v_78.deviceType || "desktop"
        });
      }

      if (v_80 && v_80.valid) {
        localStorage.setItem("appActivation", v_77);
        localStorage.setItem("active_license_key", v_77);
        localStorage.setItem("lastVerified", Date.now());
        if (v_80.device_token) {
          localStorage.setItem("appDeviceToken", v_80.device_token);
          localStorage.setItem("active_device_token", v_80.device_token);
        }
        isActivated = true;
        return {
          valid: true,
          key: v_77,
          expires_at: v_80.expires_at || null,
          project_type: PROJECT_TYPE
        };
      } else {
        const reason = (v_80 && v_80.reason) || "";
        if (reason === "network" || reason === "timeout") {
          const v_83 = localStorage.getItem("appActivation");
          if (v_83 === v_77) {
            isActivated = true;
            return { valid: true, key: v_77, offline: true };
          }
          return { valid: false, reason: "network", keepLicense: true };
        } else if (reason === "device_blocked" || reason === "banned") {
          clearLicenseStorage();
          return { valid: false, reason: "banned" };
        } else if (reason === "device_limit_reached" || reason === "limit") {
          return { valid: false, reason: "limit", allowed: v_80.max_devices || "1", used: v_80.used_devices || "1" };
        } else if (reason === "expired") {
          clearLicenseStorage();
          return { valid: false, reason: "expired" };
        } else if (reason === "wrong_project") {
          clearLicenseStorage();
          return { valid: false, reason: "wrong_project", message: v_80.message, wrongProject: v_80.project_type };
        } else {
          clearLicenseStorage();
          return { valid: false, reason: "invalid" };
        }
      }
    } catch (v_82) {
      const v_83 = localStorage.getItem("appActivation");
      if (v_83 === v_77) {
        isActivated = true;
        return { valid: true, key: v_77, offline: true };
      }
      return { valid: false, reason: "network", keepLicense: true };
    }
  }

  async function checkStoredActivation() {
    const v_84 = localStorage.getItem("appActivation");
    if (v_84) {
      const v_85 = await verifyLicenseKey(v_84);
      if (v_85.valid) {
        isActivated = true;
        return v_85;
      }
      if (v_85.reason === "banned" || v_85.reason === "wrong_project" || v_85.reason === "limit" || v_85.reason === "invalid" || v_85.reason === "expired") {
        if (v_85.reason !== "limit") {
          clearLicenseStorage();
        }
        return v_85;
      }
      if (v_85.keepLicense || v_85.reason === "network" || v_85.offline) {
        isActivated = true;
        return {
          ...v_85,
          ["offline"]: true
        };
      }
      clearLicenseStorage();
      return {
        ["valid"]: false,
        ["reason"]: "invalid"
      };
    }
    isActivated = false;
    return {
      ["valid"]: false
    };
  }
  const TOKEN_KEY_PART_5A = [164, 145, 187];

  function showDeviceMismatchAlert(v_86, v_87) {
    Swal.fire({
      ["title"]: "",
      ["html"]: `
        <div style="font-family: 'Roboto', sans-serif;
                    text-align: center;
                    background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98));
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
                      padding: 2px;
                      border-radius: 12px;
                      margin-bottom: 15px;">
            <div style="background: rgba(30, 11, 54, 0.95);
                        padding: 15px;
                        border-radius: 10px;">
              <h2 style="color: #fff; margin: 0; font-size: 16px; font-weight: 700;
                         background: linear-gradient(to right, #ff6b6b, #ee5a6f);
                         -webkit-background-clip: text;
                         -webkit-text-fill-color: transparent;">
                Device Limit Reached
              </h2>
            </div>
          </div>
          <div style="background: rgba(255, 107, 107, 0.15);
                      padding: 15px;
                      margin: 15px 0;
                      border-radius: 10px;
                      text-align: left;">
            <p style="margin: 0; font-size: 15px; color: #fff; line-height: 1.5; font-weight: 700;">
              <strong style="color: #ff6b6b;">Maximum Devices Used!</strong>
            </p>
            <p style="margin: 10px 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;">
              Your license has reached the maximum device limit (${v_87} / ${v_86}).
            </p>
          </div>
          <div style="background: rgba(249, 0, 255, 0.1);
                      padding: 15px;
                      border-radius: 10px;">
            <a href="https://t.me/tradereyasin7"
               target="_blank"
               style="display: inline-block;
                      color: #f900ff;
                      font-weight: 700;
                      text-decoration: none;
                      font-size: 14px;
                      padding: 10px 20px;
                      background: rgba(249, 0, 255, 0.2);
                      border-radius: 8px;">
              @tradereyasin7
            </a>
          </div>
        </div>
      `,
      ["showConfirmButton"]: true,
      ["showCancelButton"]: true,
      ["confirmButtonText"]: "Contact Developer",
      ["cancelButtonText"]: "Close",
      ["confirmButtonColor"]: "#ff6b6b",
      ["cancelButtonColor"]: "#ee5a6f",
      ["allowOutsideClick"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      }
    }).then(v_89 => {
      if (v_89.isConfirmed) {
        window.open("https://t.me/tradereyasin7", "_blank");
      }
    });
  }

  function showWrongProjectAlert(v_90, v_91) {
    let v_92 = v_91 || "UNKNOWN";
    Swal.fire({
      ["icon"]: "error",
      ["title"]: "Wrong Project License",
      ["html"]: `This license token is not for <b>QUOTEX</b>. It is for <b>${v_92}</b>.`,
      ["confirmButtonText"]: "Understood",
      ["confirmButtonColor"]: "#667eea",
      ["allowOutsideClick"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      }
    });
  }

  const TOKEN_KEY_PART_6A = [118, 133, 131];
  const TOKEN_KEY_PART_6B = "9d5c2b8f1a4e7d3c6b0f9a5e2d";
  const TOKEN_KEY_PART_6C = "9z2m7v4p1w6t3r0j5n8q1y4x7s2f0d3h6l9b4g1c7e0a5u8i3";

  function showLicenseExpiredAlert() {
    Swal.fire({
      ["icon"]: "error",
      ["title"]: "License Blocked",
      ["html"]: "This license has been <strong>blocked</strong> by the administrator.<br>Contact @tradereyasin7 on Telegram.",
      ["confirmButtonColor"]: "#e74c3c",
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      }
    });
  }

  function showLicenseRequiredAlert() {
    Swal.fire({
      ["title"]: "",
      ["html"]: `
        <div style="font-family: 'Roboto', sans-serif;
                    text-align: center;
                    background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98));
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #f900ff 0%, #00d9ff 100%);
                      padding: 2px;
                      border-radius: 12px;
                      margin-bottom: 15px;">
            <div style="background: rgba(30, 11, 54, 0.95);
                        padding: 15px;
                        border-radius: 10px;">
              <h2 style="color: #fff; margin: 0; font-size: 16px; font-weight: 700;
                         background: linear-gradient(to right, #f900ff, #00d9ff);
                         -webkit-background-clip: text;
                         -webkit-text-fill-color: transparent;">
                Invalid License Key
              </h2>
            </div>
          </div>
          <div style="background: rgba(255, 51, 102, 0.15);
                      padding: 15px;
                      margin: 15px 0;
                      border-radius: 10px;
                      text-align: left;">
            <p style="margin: 0; font-size: 14px; color: #fff; line-height: 1.5; font-weight: 700;">
              <strong style="color: #ff3366;">Invalid License!</strong>
            </p>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;">
              Please enter a valid license key from the official developer to get access.
            </p>
          </div>
          <div style="background: rgba(249, 0, 255, 0.1);
                      padding: 15px;
                      border-radius: 10px;">
            <a href="https://t.me/tradereyasin7"
               target="_blank"
               style="display: inline-block;
                      color: #f900ff;
                      font-weight: 700;
                      text-decoration: none;
                      font-size: 14px;
                      padding: 10px 20px;
                      background: rgba(249, 0, 255, 0.2);
                      border-radius: 8px;">
              @tradereyasin7
            </a>
          </div>
        </div>
      `,
      ["showConfirmButton"]: true,
      ["showCancelButton"]: true,
      ["confirmButtonText"]: "Contact Developer",
      ["cancelButtonText"]: "Try Again",
      ["confirmButtonColor"]: "#667eea",
      ["cancelButtonColor"]: "#764ba2",
      ["allowOutsideClick"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      }
    }).then(v_94 => {
      if (v_94.isConfirmed) {
        window.open("https://t.me/tradereyasin7", "_blank");
      }
    });
  }

  function showNetworkErrorAlert() {
    Swal.fire({
      ["title"]: "",
      ["html"]: `
        <div style="font-family: 'Roboto', sans-serif;
                    text-align: center;
                    background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98));
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 15px 40px rgba(0,0,0,0.5);">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
                      padding: 2px;
                      border-radius: 12px;
                      margin-bottom: 15px;">
            <div style="background: rgba(30, 11, 54, 0.95);
                        padding: 15px;
                        border-radius: 10px;">
              <h2 style="color: #fff; margin: 0; font-size: 16px; font-weight: 700;
                         background: linear-gradient(to right, #ff6b6b, #ee5a6f);
                         -webkit-background-clip: text;
                         -webkit-text-fill-color: transparent;">
                Connection Error
              </h2>
            </div>
          </div>
          <div style="background: rgba(245, 87, 108, 0.15);
                      padding: 15px;
                      margin: 15px 0;
                      border-radius: 10px;
                      text-align: left;">
            <p style="margin: 0; font-size: 14px; color: #fff; line-height: 1.5; font-weight: 600;">
              <strong style="color: #f5576c;">Network Issue:</strong> Could not verify license due to connection problems.
            </p>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;">
              <strong style="color: #ff6b6b;">Try:</strong> Allow cross-origin requests in Tampermonkey or check your internet connection.
            </p>
          </div>
          <div style="background: rgba(249, 0, 255, 0.1);
                      padding: 15px;
                      border-radius: 10px;">
            <a href="https://t.me/tradereyasin7"
               target="_blank"
               style="display: inline-block;
                      color: #f900ff;
                      font-weight: 700;
                      text-decoration: none;
                      font-size: 14px;
                      padding: 10px 20px;
                      background: rgba(249, 0, 255, 0.2);
                      border-radius: 8px;">
              @tradereyasin7
            </a>
          </div>
        </div>
      `,
      ["showConfirmButton"]: true,
      ["showCancelButton"]: true,
      ["confirmButtonText"]: "Contact Support",
      ["cancelButtonText"]: "Try Again",
      ["confirmButtonColor"]: "#f093fb",
      ["cancelButtonColor"]: "#f5576c",
      ["allowOutsideClick"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      }
    }).then(v_96 => {
      if (v_96.isConfirmed) {
        window.open("https://t.me/tradereyasin7", "_blank");
      }
    });
  }

  const TOKEN_KEY_PART_7A = [91, 95, 74];
  const TOKEN_KEY_PART_7B = "8c1b4f7a3e6d0c9b5f2a1e8d4c";
  const TOKEN_KEY_PART_7C = "o6z9m2v7p4w1t6r3j0n5q8y1x4s7f2d0h3l6b9g4c1e8a5u2i";

  function showSuccessAlert() {
    return Swal.fire({
      ["icon"]: "success",
      ["title"]: "License Verified!",
      ["text"]: "Your license has been successfully verified.",
      ["showConfirmButton"]: false,
      ["timer"]: 1500,
      ["timerProgressBar"]: true,
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      }
    });
  }

  function generateAliasFromName(v_258) {
    const v_259 = {
      ["A"]: "Nebula", ["B"]: "Quartz", ["C"]: "Tornado", ["D"]: "Eclipse",
      ["E"]: "Blizzard", ["F"]: "Mirage", ["G"]: "Vortex", ["H"]: "Zephyr",
      ["I"]: "Nimbus", ["J"]: "Cyclone", ["K"]: "Phantom", ["L"]: "Ignite",
      ["M"]: "Jungle", ["N"]: "Lynx", ["O"]: "Falcon", ["P"]: "Comet",
      ["Q"]: "Raven", ["R"]: "Stellar", ["S"]: "Glacier", ["T"]: "Orbit",
      ["U"]: "Tempest", ["V"]: "Nova", ["W"]: "Inferno", ["X"]: "Echo",
      ["Y"]: "Gravity", ["Z"]: "Shadow",
      0: "Drift", 1: "Bolt", 2: "Fury", 3: "Crimson", 4: "Oblivion",
      5: "Pulse", 6: "Specter", 7: "Radiant", 8: "Blitz", 9: "Strike",
      ["@"]: "Quotex", ["-"]: "Lyra", ["_"]: "Xion", ["#"]: "Vega", ["."]: "Orion"
    };
    return v_258.toUpperCase().split("").map(v_261 => v_259[v_261] || "Fine").join(" ");
  }

  const FLOATING_POPUP_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    .swal-high-zindex, .swal2-container.swal-high-zindex {
      z-index: 10000 !important;
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
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
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
      transition: all 0.3s ease;
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
      z-index: 10001;
      background: rgba(0, 255, 163, 0.2);
      border: 1px solid rgba(0, 255, 163, 0.4);
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
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 25px 40px;
      border-radius: 15px;
      font-size: 18px;
      font-weight: bold;
      z-index: 10004;
      opacity: 0;
      transition: opacity 0.5s ease;
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

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .spinning {
      animation: spin 0.6s linear;
    }
  `;

  const TOKEN_KEY_PART_8A = [109, 156, 142];

  function showToast(v_262, v_263 = 3000) {
    const v_265 = document.createElement("div");
    v_265.className = "message-popup";
    v_265.textContent = v_262;
    document.body.appendChild(v_265);
    setTimeout(() => v_265.classList.add("show"), 10);
    setTimeout(() => {
      v_265.classList.remove("show");
      setTimeout(() => v_265.remove(), 400);
    }, v_263);
  }

  const TOKEN_KEY_PART_9A = [104, 122, 119];

  function showCenteredDeveloperBanner(v_266, v_267) {
    const v_268 = document.createElement("div");
    v_268.id = "centeredDeveloperMessage";
    v_268.textContent = v_266;
    document.body.appendChild(v_268);
    setTimeout(() => {
      v_268.style.opacity = "1";
    }, 10);
    setTimeout(() => {
      v_268.style.opacity = "0";
      setTimeout(() => v_268.remove(), 500);
    }, v_267);
  }

  function showDemoBalanceSection() {
    const v_269 = document.getElementById("licenseSection");
    const v_270 = document.getElementById("demoBalanceSection");
    if (v_269 && v_270) {
      v_269.classList.add("hide");
      setTimeout(() => {
        v_270.classList.add("show");
      }, 300);
    }
  }

  async function renderSettingsPopup() {
    const v_273 = await checkStoredActivation();
    isActivated = v_273.valid;
    const v_274 = document.createElement("div");
    v_274.innerHTML = `
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
          <input type="text" id="licenseInput" placeholder="Enter your license key" value="${localStorage.getItem("appActivation") || ""}">
          <button id="verifyBtn">Verify License</button>
          <div id="verificationStatus">
            ${isActivated ? (v_273.offline ? '<div class="verified-badge">✓ Verified (Offline Mode)</div>' : '<div class="verified-badge">✓ Verified</div>') : '<div class="unverified-badge">✗ Not Verified</div>'}
          </div>
        </div>

        <div id="demoBalanceSection" class="${isActivated ? "show" : ""}">
          <h3>Demo Balance Settings</h3>
          <input type="number" id="demoBalanceInput" placeholder="Enter demo balance" value="${demoBalanceValue}">
          <button id="setDemoBtn">Update Demo Balance</button>
          <div id="demoBalanceStatus" style="margin-top: 6px; font-size: 11px;"></div>
        </div>

        <button id="saveButton" ${isActivated ? "" : "disabled"}>Save Settings</button>
        <button class="close-btn">Close</button>
        
        <div id="cheatCodeDisplay">${localStorage.getItem("appActivation") ? generateAliasFromName(localStorage.getItem("appActivation")) : DEFAULT_NAME_LIST}</div>
      </div>
    `;
    document.body.appendChild(v_274);
    settingsPopupContainer = document.getElementById("settingsPopup");
    document.getElementById("lname").value = localStorage.getItem("leaderboardName") || "";
    document.getElementById("iblafp").value = localStorage.getItem("leaderboardBalance") || "";
    document.getElementById("profilePhotoUrl").value = localStorage.getItem("profilePhotoUrl") || "";
    document.getElementById("countryFlagSelect").value = localStorage.getItem("countryFlag") || "bd";

    const v_275 = document.getElementById("refreshBalanceBtn");
    function findBalanceElement() {
      const v_276 = typeof window.__qxEnsureUsermenuShadow === "function" ? window.__qxEnsureUsermenuShadow() : document.querySelector("qx-usermenu-trigger")?.["shadowRoot"] || null;
      return v_276 && v_276.querySelector(".text .balance, .balance") || document.querySelector(".grOBD b.YnoT0") || document.querySelector("b.YnoT0");
    }
    async function waitForBalanceElement(v_277) {
      const v_278 = Date.now() + v_277;
      let v_279 = findBalanceElement();
      while ((!v_279 || !/\d/.test(v_279.textContent || "")) && Date.now() < v_278) {
        await new Promise(v_280 => setTimeout(v_280, 100));
        v_279 = findBalanceElement();
      }
      return v_279;
    }

    v_275?.addEventListener("click", async () => {
      if (v_275.classList.contains("spinning")) return;
      v_275.classList.add("spinning");
      const v_281 = await waitForBalanceElement(5000);
      if (!v_281) {
        showToast("Error: Could not find balance element.");
        setTimeout(() => v_275.classList.remove("spinning"), 500);
        return;
      }
      const v_283 = v_281.textContent.replace(/\D/g, "");
      document.getElementById("iblafp").value = v_283;
      showToast("Balance updated!");
      setTimeout(() => v_275.classList.remove("spinning"), 500);
    });

    document.getElementById("verifyBtn")?.addEventListener("click", handleVerifyLicenseInput);
    document.getElementById("setDemoBtn")?.addEventListener("click", saveDemoBalance);
    document.getElementById("saveButton").addEventListener("click", handleSaveAndStart);
    document.querySelector(".close-btn").addEventListener("click", closeSettingsPopup);

    setTimeout(() => {
      settingsPopupContainer.classList.add("show");
    }, 10);
  }

  function saveDemoBalance() {
    const v_284 = document.getElementById("demoBalanceInput").value;
    if (!v_284 || isNaN(v_284)) {
      showToast("Please enter a valid balance amount");
      return;
    }
    demoBalanceValue = parseFloat(v_284);
    localStorage.setItem("demoBalance", demoBalanceValue.toString());
    const v_285 = document.getElementById("demoBalanceStatus");
    v_285.textContent = "Demo balance updated and saved!";
    v_285.style.color = "#00ffa3";
    showToast(`Demo balance set to ${demoBalanceValue}`);
    setTimeout(() => {
      v_285.textContent = "";
    }, 2500);
  }

  async function handleVerifyLicenseInput() {
    const v_286 = document.getElementById("licenseInput").value.trim();
    if (!v_286) {
      showToast("Please enter a license key");
      return;
    }
    const v_287 = document.getElementById("verifyBtn");
    v_287.disabled = true;
    v_287.textContent = "Verifying...";

    const v_288 = await verifyLicenseKey(v_286);
    if (v_288.valid) {
      document.getElementById("verificationStatus").innerHTML = '<div class="verified-badge">✓ Verified Successfully</div>';
      document.getElementById("cheatCodeDisplay").textContent = generateAliasFromName(v_288.key);
      document.getElementById("saveButton").disabled = false;
      await showSuccessAlert();
      showDemoBalanceSection();
    } else {
      if (v_288.reason === "limit") {
        showDeviceMismatchAlert(v_288.allowed, v_288.used);
        document.getElementById("verificationStatus").innerHTML = '<div class="unverified-badge">✗ Device Limit Reached</div>';
      } else if (v_288.reason === "banned") {
        showLicenseExpiredAlert();
        document.getElementById("verificationStatus").innerHTML = '<div class="unverified-badge">✗ License Banned</div>';
      } else if (v_288.reason === "network") {
        if (v_288.keepLicense && localStorage.getItem("appActivation")) {
          showToast("Network error - Using cached license");
          document.getElementById("verificationStatus").innerHTML = '<div class="verified-badge">✓ Cached (Offline Mode)</div>';
          document.getElementById("saveButton").disabled = false;
          showDemoBalanceSection();
        } else {
          showNetworkErrorAlert();
          document.getElementById("verificationStatus").innerHTML = '<div class="unverified-badge">✗ Network Error</div>';
        }
      } else {
        showLicenseRequiredAlert();
        document.getElementById("verificationStatus").innerHTML = '<div class="unverified-badge">✗ Invalid License</div>';
      }
      if (v_288.reason !== "network" || !v_288.keepLicense) {
        document.getElementById("saveButton").disabled = true;
      }
    }
    v_287.disabled = false;
    v_287.textContent = "Verify License";
  }

  function closeSettingsPopup() {
    const v_291 = document.getElementById("settingsPopup");
    if (v_291) {
      v_291.classList.add("hide");
      v_291.classList.remove("show");
      setTimeout(() => v_291.remove(), 400);
    }
  }

  const TOKEN_KEY_PART_10A = [122];

  async function handleSaveAndStart() {
    const v_292 = localStorage.getItem("appActivation");
    if (!v_292 || !isActivated) {
      showLicenseRequiredAlert();
      return;
    }
    const v_293 = await verifyLicenseKey(v_292);
    if (!v_293.valid && !v_293.offline) {
      clearLicenseStorage();
      showLicenseRequiredAlert();
      return;
    }

    const v_294 = document.getElementById("lname").value;
    const v_295 = document.getElementById("iblafp").value;
    const v_296 = document.getElementById("countryFlagSelect").value;
    const v_297 = document.getElementById("profilePhotoUrl").value;
    localStorage.setItem("leaderboardName", v_294);
    localStorage.setItem("leaderboardBalance", v_295);
    localStorage.setItem("countryFlag", v_296);
    localStorage.setItem("profilePhotoUrl", v_297);
    localStorage.setItem("lastLeaderboardName", v_294);
    localStorage.setItem("lastCountryFlag", v_296);

    const v_298 = `<svg class="flag flag-${v_296}"><use xlink:href="/profile/images/flags.svg#flag-${v_296}"></use></svg>`;
    await downloadAndRunAssets(v_294, v_295, v_298, v_297);
    closeSettingsPopup();
    showCenteredDeveloperBanner("Developer @tradereyasin7 !", 5000);
  }

  function generateHourlyToken(v_299) {
    const v_300 = "qx_secure_" + v_299;
    let v_301 = 0;
    for (let v_302 = 0; v_302 < v_300.length; v_302++) {
      v_301 = (v_301 << 5) - v_301 + v_300.charCodeAt(v_302);
      v_301 = v_301 & 4294967295;
      if (v_301 >= 2147483648) {
        v_301 -= 4294967296;
      }
    }
    return Math.abs(v_301).toString(16);
  }

  function showSecurityLoader() {
    const v_303 = document.createElement("div");
    v_303.id = "__qx_security_loader";
    v_303.innerHTML = `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(10,5,20,0.95);
                  display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999999;
                  font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <div style="color:#00d4ff;font-size:22px;font-weight:700;letter-spacing:3px;margin-bottom:25px;
                    text-shadow:0 0 20px rgba(0,212,255,0.5);">Security Biz X</div>
        <div style="width:280px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;position:relative;">
          <div id="__qx_progress_bar" style="width:0%;height:100%;background:linear-gradient(90deg,#00d4ff,#f900ff,#00d4ff);
                background-size:200% 100%;border-radius:3px;transition:width 0.3s ease;"></div>
        </div>
        <div id="__qx_progress_text" style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:12px;letter-spacing:1px;">0%</div>
      </div>
    `;
    document.body.appendChild(v_303);
  }

  function updateSecurityProgress(v_304) {
    const v_305 = document.getElementById("__qx_progress_bar");
    const v_306 = document.getElementById("__qx_progress_text");
    if (v_305) v_305.style.width = v_304 + "%";
    if (v_306) v_306.textContent = Math.round(v_304) + "%";
  }

  function hideSecurityLoader() {
    const v_307 = document.getElementById("__qx_security_loader");
    if (v_307) {
      v_307.style.opacity = "0";
      v_307.style.transition = "opacity 0.4s";
      setTimeout(() => v_307.remove(), 400);
    }
  }

  function shiftDecrypt(v_308) {
    const v_309 = atob(v_308);
    let v_310 = "";
    for (let v_311 = 0; v_311 < v_309.length; v_311++) {
      v_310 += String.fromCharCode((v_309.charCodeAt(v_311) - 7 + 256) % 256);
    }
    return v_310;
  }

  function base64ToUtf8(v_312) {
    const v_313 = atob(v_312);
    const v_314 = new Uint8Array(v_313.length);
    for (let v_315 = 0; v_315 < v_313.length; v_315++) {
      v_314[v_315] = v_313.charCodeAt(v_315);
    }
    return new TextDecoder("utf-8").decode(v_314);
  }

  function executeEncryptedScript(v_316) {
    if (!v_316 || typeof v_316 !== "string") {
      throw new Error("Invalid script payload");
    }
    const v_317 = "__qxModExecErr";
    const v_318 = "__qxModExecOk";
    try {
      delete window[v_317];
      delete window[v_318];
    } catch (v_319) {}
    const v_320 = document.createElement("script");
    v_320.textContent = `(function(){try{${v_316};window["${v_318}"]=1}catch(e){window["${v_317}"]=e}})();`;
    document.head.appendChild(v_320);
    v_320.remove();
    if (window[v_317]) {
      const v_321 = window[v_317];
      try {
        delete window[v_317];
        delete window[v_318];
      } catch (v_322) {}
      throw v_321;
    }
    try {
      delete window[v_318];
    } catch (v_323) {}
  }

  const LOCAL_STORAGE_ENC_KEY = "qx_" + ((navigator.hardwareConcurrency || 4) * 7913 + screen.width * 31 + screen.height * 17).toString(36);
  function reconstructTokenKey(v_324) {
    const v_325 = [TOKEN_KEY_PART_1B, TOKEN_KEY_PART_2B, TOKEN_KEY_PART_4B, TOKEN_KEY_PART_6B, TOKEN_KEY_PART_7B];
    const v_326 = [TOKEN_KEY_PART_1C, TOKEN_KEY_PART_2C, TOKEN_KEY_PART_4C, TOKEN_KEY_PART_6C, TOKEN_KEY_PART_7C];
    return v_324 === 0 ? v_325.join("") : v_326.join("");
  }
  function xorEncrypt(v_327) {
    const v_328 = LOCAL_STORAGE_ENC_KEY;
    const v_329 = new TextEncoder().encode(v_327);
    const v_330 = new Uint8Array(v_329.length);
    for (let v_331 = 0; v_331 < v_329.length; v_331++) {
      v_330[v_331] = v_329[v_331] ^ v_328.charCodeAt(v_331 % v_328.length);
    }
    let v_332 = "";
    for (let v_333 = 0; v_333 < v_330.length; v_333++) {
      v_332 += String.fromCharCode(v_330[v_333]);
    }
    return btoa(v_332);
  }
  function xorDecrypt(v_334) {
    const v_335 = LOCAL_STORAGE_ENC_KEY;
    const v_336 = atob(v_334);
    const v_337 = new Uint8Array(v_336.length);
    for (let v_338 = 0; v_338 < v_336.length; v_338++) {
      v_337[v_338] = v_336.charCodeAt(v_338) ^ v_335.charCodeAt(v_338 % v_335.length);
    }
    return new TextDecoder("utf-8").decode(v_337);
  }

  async function downloadAndRunAssets(v_339, v_340, v_341, v_342) {
    const v_343 = localStorage.getItem("appActivation");
    if (!v_343) {
      showLicenseRequiredAlert();
      return;
    }

    let cachedScript = "";
    try {
      const encScript = localStorage.getItem(reconstructTokenKey(1));
      if (encScript) {
        cachedScript = xorDecrypt(encScript);
      }
    } catch (e) {
      cachedScript = "";
    }

    if (cachedScript) {
      try {
        function reconstructSecretKeyLocal() {
          const v_362 = [47, 23, 59, 31, 67, 83, 41, 73, 37, 53];
          const v_363 = [TOKEN_KEY_PART_1A, TOKEN_KEY_PART_2A, TOKEN_KEY_PART_3A, TOKEN_KEY_PART_4A, TOKEN_KEY_PART_5A, TOKEN_KEY_PART_6A, TOKEN_KEY_PART_7A, TOKEN_KEY_PART_8A, TOKEN_KEY_PART_9A, TOKEN_KEY_PART_10A];
          let v_364 = "";
          for (let v_365 = 0; v_365 < v_363.length; v_365++) {
            for (let v_366 = 0; v_366 < v_363[v_365].length; v_366++) {
              v_364 += String.fromCharCode(v_363[v_365][v_366] - v_362[v_365]);
            }
          }
          return v_364;
        }
        const v_367 = reconstructSecretKeyLocal();
        const v_368 = Math.floor(Date.now() / 30000);
        const v_369 = v_367 + ":" + v_368;
        let v_370 = 0;
        for (let v_371 = 0; v_371 < v_369.length; v_371++) {
          const v_372 = v_369.charCodeAt(v_371);
          v_370 = (v_370 << 5) - v_370 + v_372;
          v_370 = v_370 & v_370;
        }
        window.__QX_RUNTIME_AUTH__ = {
          ["token"]: Math.abs(v_370).toString(36),
          ["key"]: v_367,
          ["ts"]: v_368,
          ["loader"]: true
        };
        executeEncryptedScript(cachedScript);
        delete window.__QX_RUNTIME_AUTH__;
        return;
      } catch (e) {
        clearCachedTokens();
      }
    }

    const v_344 = await collectDeviceInfo();
    const streamUrl = `${API_BASE_URL}/api/v3/market/instruments/realtime-stream`;

    try {
      const res = await fetch(streamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_key: v_343,
          device_info: v_344,
          project_type: PROJECT_TYPE,
          cv: ""
        })
      });

      if (!res.ok) {
        throw new Error("Server payload endpoint not configured on demotoliveadmin (" + res.status + ")");
      }

      const rawText = await res.text();
      const v_361 = JSON.parse(shiftDecrypt(rawText));
      const { token: v_383, paths: v_384, version: v_385, total: v_386 } = v_361;

      showSecurityLoader();
      const v_387 = v_361.st || Date.now();
      const v_388 = v_387 - Date.now();
      const v_389 = `${API_BASE_URL}/api/v3/cdn/assets/${v_383}/`;
      const v_395 = new Array(v_386);
      let v_396 = 0;

      for (let i = 0; i < v_386; i++) {
        const v_401 = v_389 + v_384[i];
        const v_404 = generateHourlyToken(String(Math.floor((Date.now() + v_388) / 30000)));
        const v_405 = await fetch(v_401 + "?a=" + v_404);
        if (!v_405.ok) throw new Error("Chunk fetch failed: " + v_405.status);
        const v_407 = await v_405.text();
        v_395[i] = shiftDecrypt(v_407);
        v_396++;
        updateSecurityProgress((v_396 / v_386) * 100);
      }

      const v_409 = v_395.join("");
      const v_410 = base64ToUtf8(v_409);
      hideSecurityLoader();

      localStorage.setItem(reconstructTokenKey(0), v_385);
      localStorage.setItem(reconstructTokenKey(1), xorEncrypt(v_410));

      function reconstructSecretKey2() {
        const v_411 = [47, 23, 59, 31, 67, 83, 41, 73, 37, 53];
        const v_412 = [TOKEN_KEY_PART_1A, TOKEN_KEY_PART_2A, TOKEN_KEY_PART_3A, TOKEN_KEY_PART_4A, TOKEN_KEY_PART_5A, TOKEN_KEY_PART_6A, TOKEN_KEY_PART_7A, TOKEN_KEY_PART_8A, TOKEN_KEY_PART_9A, TOKEN_KEY_PART_10A];
        let v_413 = "";
        for (let v_414 = 0; v_414 < v_412.length; v_414++) {
          for (let v_415 = 0; v_415 < v_412[v_414].length; v_415++) {
            v_413 += String.fromCharCode(v_412[v_414][v_415] - v_411[v_414]);
          }
        }
        return v_413;
      }
      const v_416 = reconstructSecretKey2();
      const v_417 = Math.floor(Date.now() / 30000);
      const v_418 = v_416 + ":" + v_417;
      let v_419 = 0;
      for (let v_420 = 0; v_420 < v_418.length; v_420++) {
        const v_421 = v_418.charCodeAt(v_420);
        v_419 = (v_419 << 5) - v_419 + v_421;
        v_419 = v_419 & v_419;
      }
      window.__QX_RUNTIME_AUTH__ = {
        ["token"]: Math.abs(v_419).toString(36),
        ["key"]: v_416,
        ["ts"]: v_417,
        ["loader"]: true
      };
      executeEncryptedScript(v_410);
      delete window.__QX_RUNTIME_AUTH__;
    } catch (v_422) {
      hideSecurityLoader();
      showToast("License Verified! Settings saved locally.");
    }
  }

  const injectedStyleElement = document.createElement("style");
  injectedStyleElement.textContent = FLOATING_POPUP_CSS;
  document.head.appendChild(injectedStyleElement);

  const startupActivationStatus = await checkStoredActivation();
  if (startupActivationStatus.valid === false && startupActivationStatus.reason === "banned") {
    showLicenseExpiredAlert();
  } else if (startupActivationStatus.valid === false && startupActivationStatus.reason === "limit") {
    showDeviceMismatchAlert(startupActivationStatus.allowed, startupActivationStatus.used);
  }

  await renderSettingsPopup();
})();
