// ==UserScript==
// @name         Quotex License Client with Popup
// @namespace    https://demotoliveadmin.lovable.app
// @version      2.0.0
// @description  Quotex Demo to Live license system with beautiful popups
// @author       TRADER EYASIN
// @match        *://qxbroker.com/*
// @match        *://*.qxbroker.com/*
// @match        *://quotex.io/*
// @match        *://*.quotex.io/*
// @match        *://quotex-market.com/*
// @match        *://*.quotex-market.com/*
// @match        *://*.quotex.*/*
// @match        *://market-qx.info/*
// @match        *://*.market-qx.info/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      demotoliveadmin.lovable.app
// @connect      cdn.jsdelivr.net
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  // ============================================================
  // কনফিগ
  // ============================================================
  const SERVER_BASE = "https://demotoliveadmin.lovable.app";
  const PROJECT_TYPE = "Quotex";
  const REQUEST_TIMEOUT = 15000;
  const TELEGRAM_URL = "https://t.me/tradereyasin7";
  const TELEGRAM_ICON =
    "https://i.postimg.cc/W1xNxw0S/file-00000000acd08230b081904c2c4ce41c.png";

  // localStorage কী
  const LS_LICENSE_KEY = "appActivation";
  const LS_DEVICE_TOKEN = "appDeviceToken";
  const LS_DEVICE_ID = "customDeviceId";
  const LS_LAST_VERIFIED = "lastVerified";

  // ============================================================
  // Swal লোড (দরকার হলে)
  // ============================================================
  async function ensureSwal() {
    if (typeof Swal !== "undefined") return true;
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  // ============================================================
  // ডিভাইস ID (ফিঙ্গারপ্রিন্ট ভিত্তিক)
  // ============================================================
  function getCanvasFingerprint() {
    try {
      const c = document.createElement("canvas");
      const x = c.getContext("2d");
      c.width = 200;
      c.height = 50;
      x.textBaseline = "top";
      x.font = "14px 'Arial'";
      x.fillStyle = "#f60";
      x.fillRect(125, 1, 62, 20);
      x.fillStyle = "#069";
      x.fillText("Quotex License FP", 2, 15);
      const d = c.toDataURL();
      let h = 0;
      for (let i = 0; i < d.length; i++) {
        h = (h << 5) - h + d.charCodeAt(i);
        h = h & h;
      }
      return Math.abs(h).toString(16);
    } catch {
      return "canvas_error";
    }
  }

  function getWebGLFingerprint() {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) return "webgl_not_supported";
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const src =
        (ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : "Unknown") +
        "|" +
        (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "Unknown");
      let h = 0;
      for (let i = 0; i < src.length; i++) {
        h = (h << 5) - h + src.charCodeAt(i);
        h = h & h;
      }
      return Math.abs(h).toString(16);
    } catch {
      return "webgl_error";
    }
  }

  function getOrCreateDeviceId() {
    let id = localStorage.getItem(LS_DEVICE_ID);
    if (!id) {
      id =
        "qx-" +
        getCanvasFingerprint() +
        "-" +
        getWebGLFingerprint() +
        "-" +
        (navigator.hardwareConcurrency || 0) +
        "-" +
        screen.width +
        "x" +
        screen.height;
      localStorage.setItem(LS_DEVICE_ID, id);
    }
    return id;
  }

  // ============================================================
  // API কল
  // ============================================================
  function apiPost(path, payload) {
    const url = SERVER_BASE + path;
    const bodyStr = JSON.stringify(payload || {});

    return new Promise((resolve, reject) => {
      if (typeof GM !== "undefined" && GM.xmlHttpRequest) {
        GM.xmlHttpRequest({
          method: "POST",
          url,
          headers: { "Content-Type": "application/json" },
          data: bodyStr,
          timeout: REQUEST_TIMEOUT,
        })
          .then((res) => {
            let data;
            try {
              data = JSON.parse(res.responseText);
            } catch {
              return reject(new Error("Invalid response"));
            }
            resolve({ ok: res.status >= 200 && res.status < 300, data });
          })
          .catch(() => reject(new Error("Network error")));
        return;
      }

      if (typeof GM_xmlhttpRequest !== "undefined") {
        GM_xmlhttpRequest({
          method: "POST",
          url,
          headers: { "Content-Type": "application/json" },
          data: bodyStr,
          timeout: REQUEST_TIMEOUT,
          onload: (res) => {
            let data;
            try {
              data = JSON.parse(res.responseText);
            } catch {
              return reject(new Error("Invalid response"));
            }
            resolve({ ok: res.status >= 200 && res.status < 300, data });
          },
          onerror: () => reject(new Error("Network error")),
          ontimeout: () => reject(new Error("Timeout")),
        });
        return;
      }

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
            return reject(new Error("Invalid response"));
          }
          resolve({ ok: res.ok, data });
        })
        .catch(() => reject(new Error("Network error")));
    });
  }

  // ============================================================
  // লাইসেন্স API
  // ============================================================
  async function activateLicense(licenseKey) {
    if (!licenseKey || typeof licenseKey !== "string") {
      return { success: false, reason: "missing_license_key" };
    }
    const key = licenseKey.trim();
    try {
      const res = await apiPost("/api/public/license/activate", {
        license_key: key,
        device_id: getOrCreateDeviceId(),
        project_type: PROJECT_TYPE,
      });

      if (res.ok && res.data && res.data.valid) {
        localStorage.setItem(LS_LICENSE_KEY, key);
        localStorage.setItem(LS_LAST_VERIFIED, String(Date.now()));
        if (res.data.device_token) {
          localStorage.setItem(LS_DEVICE_TOKEN, res.data.device_token);
        }
        return { success: true, expires_at: res.data.expires_at || null };
      }
      return {
        success: false,
        reason: (res.data && res.data.reason) || "activation_failed",
      };
    } catch {
      return { success: false, reason: "network_error" };
    }
  }

  async function verifyLicense() {
    const key = localStorage.getItem(LS_LICENSE_KEY);
    const token = localStorage.getItem(LS_DEVICE_TOKEN) || "";
    if (!key) return { valid: false, reason: "no_license" };
    try {
      const res = await apiPost("/api/public/license/verify", {
        license_key: key,
        device_id: getOrCreateDeviceId(),
        device_token: token,
        project_type: PROJECT_TYPE,
      });
      if (res.ok && res.data && res.data.valid) {
        localStorage.setItem(LS_LAST_VERIFIED, String(Date.now()));
        return { valid: true, expires_at: res.data.expires_at || null };
      }
      const reason = (res.data && res.data.reason) || "invalid";
      if (["banned", "expired", "invalid_license", "wrong_project"].includes(reason)) {
        clearLicenseStorage();
      }
      return { valid: false, reason };
    } catch {
      return { valid: true, offline: true };
    }
  }

  function clearLicenseStorage() {
    try {
      localStorage.removeItem(LS_LICENSE_KEY);
      localStorage.removeItem(LS_DEVICE_TOKEN);
      localStorage.removeItem(LS_LAST_VERIFIED);
    } catch {}
  }

  // ============================================================
  // 🎨 পপআপ UI (দ্বিতীয় কোডের স্টাইল অনুসরণ করে)
  // ============================================================

  // ১) লাইসেন্স ইনপুট পপআপ
  async function showLicenseInputPopup() {
    const ok = await ensureSwal();
    if (!ok) return false;

    const { value } = await Swal.fire({
      title: "",
      html: `
        <div style="font-family:'Roboto',sans-serif;text-align:center;background:linear-gradient(135deg,rgba(30,11,54,0.98),rgba(45,20,70,0.98));padding:20px;border-radius:15px;box-shadow:0 15px 40px rgba(0,0,0,0.5);">
          <div style="background:linear-gradient(135deg,#f900ff 0%,#00d9ff 100%);padding:2px;border-radius:12px;margin-bottom:15px;">
            <div style="background:rgba(30,11,54,0.95);padding:15px;border-radius:10px;">
              <div style="display:flex;align-items:center;justify-content:center;margin-bottom:8px;">
                <div style="width:50px;height:50px;background:linear-gradient(135deg,#f900ff,#00d9ff);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(249,0,255,0.5);">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
              </div>
              <h2 style="color:#fff;margin:0;font-size:16px;font-weight:700;background:linear-gradient(to right,#f900ff,#00d9ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                License Required
              </h2>
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.08);padding:15px;margin:15px 0;border-radius:10px;text-align:left;">
            <p style="margin:0 0 10px;font-size:14px;color:#fff;font-weight:600;">Enter your Quotex license key:</p>
            <input id="swalLicenseInput" type="text" placeholder="XXXX-XXXX-XXXX-XXXX"
                   style="width:100%;padding:12px;border:1.5px solid rgba(249,0,255,0.4);border-radius:8px;background:rgba(0,0,0,0.3);color:#fff;font-size:15px;text-align:center;letter-spacing:2px;box-sizing:border-box;outline:none;">
          </div>
          <div style="background:rgba(249,0,255,0.1);padding:15px;border-radius:10px;">
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;">
              <img src="${TELEGRAM_ICON}" style="width:22px;height:22px;border-radius:50%;">
              <p style="margin:0;font-size:14px;color:#fff;font-weight:600;">Need a license?</p>
            </div>
            <a href="${TELEGRAM_URL}" target="_blank"
               style="display:inline-block;color:#f900ff;font-weight:700;text-decoration:none;font-size:14px;padding:10px 20px;background:rgba(249,0,255,0.2);border-radius:8px;">
              @tradereyasin7
            </a>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Activate",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#f900ff",
      cancelButtonColor: "#764ba2",
      allowOutsideClick: false,
      customClass: { container: "swal-high-zindex", popup: "custom-popup-style" },
      didOpen: () => {
        const style = document.createElement("style");
        style.textContent = `.custom-popup-style{border-radius:20px!important;padding:0!important;}.swal-high-zindex{z-index:999999!important;}`;
        document.head.appendChild(style);
      },
      preConfirm: () => {
        const v = document.getElementById("swalLicenseInput").value.trim();
        if (!v) {
          Swal.showValidationMessage("Please enter a license key");
          return false;
        }
        return v;
      },
    });

    if (!value) return false;

    // ভেরিফাই করা হচ্ছে
    Swal.fire({
      title: "Verifying...",
      html: `<div style="color:rgba(255,255,255,0.8);">Checking your license...</div>`,
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const result = await activateLicense(value);
    Swal.close();

    if (result.success) {
      await showSuccessAlert();
      return true;
    }

    // ব্যর্থ হলে কারণ অনুযায়ী পপআপ
    if (result.reason === "limit" || result.reason === "device_limit_reached") {
      await showDeviceLimitAlert();
    } else if (result.reason === "wrong_project") {
      await showWrongProjectAlert();
    } else if (result.reason === "network_error") {
      await showNetworkErrorAlert();
    } else {
      await showInvalidLicenseAlert(result.reason);
    }
    return false;
  }

  // ২) সফল পপআপ
  function showSuccessAlert() {
    return Swal.fire({
      icon: "success",
      title: "License Verified!",
      text: "Your license has been successfully verified.",
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true,
      customClass: { container: "swal-high-zindex" },
    });
  }

  // ৩) ডিভাইস লিমিট পপআপ
  function showDeviceLimitAlert() {
    return Swal.fire({
      title: "",
      html: `
        <div style="font-family:'Roboto',sans-serif;text-align:center;background:linear-gradient(135deg,rgba(30,11,54,0.98),rgba(45,20,70,0.98));padding:20px;border-radius:15px;">
          <div style="background:linear-gradient(135deg,#ff6b6b,#ee5a6f);padding:2px;border-radius:12px;margin-bottom:15px;">
            <div style="background:rgba(30,11,54,0.95);padding:15px;border-radius:10px;">
              <h2 style="color:#fff;margin:0;font-size:16px;">Device Limit Reached</h2>
            </div>
          </div>
          <div style="background:rgba(255,107,107,0.15);padding:15px;margin:15px 0;border-radius:10px;text-align:left;">
            <p style="margin:0;font-size:14px;color:#fff;line-height:1.5;">
              Your license has reached the maximum device limit.
              If you shared it with someone, please disconnect them first.
            </p>
          </div>
          <div style="background:rgba(249,0,255,0.1);padding:15px;border-radius:10px;">
            <a href="${TELEGRAM_URL}" target="_blank"
               style="display:inline-block;color:#f900ff;font-weight:700;text-decoration:none;font-size:14px;padding:10px 20px;background:rgba(249,0,255,0.2);border-radius:8px;">
              Contact Developer
            </a>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Contact Developer",
      cancelButtonText: "Close",
      confirmButtonColor: "#ff6b6b",
      customClass: { container: "swal-high-zindex" },
    }).then((r) => {
      if (r.isConfirmed) window.open(TELEGRAM_URL, "_blank");
    });
  }

  // ৪) ভুল প্রজেক্ট পপআপ
  function showWrongProjectAlert() {
    return Swal.fire({
      icon: "error",
      title: "Wrong Project License",
      html: `
        <div style="text-align:center;font-family:Arial,sans-serif;">
          <p>This license is not valid for <strong style="color:#d32f2f;">QUOTEX</strong>.</p>
          <p style="margin-top:12px;">Please use a valid Quotex license key.</p>
          <a href="${TELEGRAM_URL}" target="_blank" style="color:#0088cc;font-weight:bold;">Contact Developer</a>
        </div>
      `,
      confirmButtonColor: "#667eea",
      customClass: { container: "swal-high-zindex" },
    });
  }

  // ৫) নেটওয়ার্ক এরর পপআপ
  function showNetworkErrorAlert() {
    return Swal.fire({
      icon: "error",
      title: "Connection Error",
      text: "Could not verify license due to network issues. Please check your internet and try again.",
      confirmButtonText: "Try Again",
      confirmButtonColor: "#f5576c",
      customClass: { container: "swal-high-zindex" },
    });
  }

  // ৬) ইনভ্যালিড লাইসেন্স পপআপ
  function showInvalidLicenseAlert(reason) {
    return Swal.fire({
      title: "",
      html: `
        <div style="font-family:'Roboto',sans-serif;text-align:center;background:linear-gradient(135deg,rgba(30,11,54,0.98),rgba(45,20,70,0.98));padding:20px;border-radius:15px;">
          <div style="background:linear-gradient(135deg,#f900ff,#00d9ff);padding:2px;border-radius:12px;margin-bottom:15px;">
            <div style="background:rgba(30,11,54,0.95);padding:15px;border-radius:10px;">
              <h2 style="color:#fff;margin:0;font-size:16px;">Invalid License Key</h2>
            </div>
          </div>
          <div style="background:rgba(255,51,102,0.15);padding:15px;margin:15px 0;border-radius:10px;text-align:left;">
            <p style="margin:0;font-size:14px;color:#fff;line-height:1.5;">
              <strong style="color:#ff3366;">Invalid License!</strong><br><br>
              ${reason ? "Reason: " + reason : "You have not purchased a valid license yet."}
            </p>
          </div>
          <div style="background:rgba(249,0,255,0.1);padding:15px;border-radius:10px;">
            <a href="${TELEGRAM_URL}" target="_blank"
               style="display:inline-block;color:#f900ff;font-weight:700;text-decoration:none;font-size:14px;padding:10px 20px;background:rgba(249,0,255,0.2);border-radius:8px;">
              Contact Developer
            </a>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Contact Developer",
      cancelButtonText: "Try Again",
      confirmButtonColor: "#667eea",
      customClass: { container: "swal-high-zindex" },
    }).then((r) => {
      if (r.isConfirmed) window.open(TELEGRAM_URL, "_blank");
    });
  }

  // ============================================================
  // 🌐 গ্লোবাল API
  // ============================================================
  window.AppLicense = {
    version: "2.0.0",
    projectType: PROJECT_TYPE,
    activate: activateLicense,
    verify: verifyLicense,
    clear: clearLicenseStorage,
    getDeviceId: getOrCreateDeviceId,
    // UI functions
    showInputPopup: showLicenseInputPopup,
  };

  // ============================================================
  // 🚀 অটো-চেক (পেজ লোডের পর)
  // ============================================================
  (async function autoCheck() {
    // Swal লোড হওয়ার অপেক্ষা
    await ensureSwal();

    const stored = localStorage.getItem(LS_LICENSE_KEY);

    // লাইসেন্স নেই → ইনপুট পপআপ
    if (!stored) {
      await showLicenseInputPopup();
      return;
    }

    // লাইসেন্স আছে → ভেরিফাই
    const result = await verifyLicense();

    if (result.valid) {
      console.log("[AppLicense] ✔ License valid");
      return;
    }

    // লাইসেন্স ইনভ্যালিড → কারণ অনুযায়ী পপআপ
    if (result.reason === "limit") {
      await showDeviceLimitAlert();
    } else if (result.reason === "wrong_project") {
      await showWrongProjectAlert();
    } else if (result.reason === "network_error") {
      await showNetworkErrorAlert();
    } else {
      await showLicenseInputPopup();
    }
  })();

  console.log("[AppLicense] Quotex Edition loaded ✔ v2.0.0");
})();
