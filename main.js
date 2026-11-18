// ==UserScript==
// @name         App License Client
// @namespace    https://demotoliveadmin.lovable.app
// @version      1.0.0
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      demotoliveadmin.lovable.app
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

    return new Promise((resolve, reject) => {
      const gmReq = typeof GM_xmlhttpRequest !== "undefined" ? GM_xmlhttpRequest : (typeof GM !== "undefined" && GM.xmlHttpRequest ? GM.xmlHttpRequest : null);

      if (gmReq) {
        gmReq({
          method: "POST",
          url: url,
          headers: { "Content-Type": "application/json" },
          data: bodyStr,
          onload: function(res) {
            try {
              resolve({ ok: res.status >= 200 && res.status < 300, status: res.status, data: JSON.parse(res.responseText) });
            } catch (e) {
              reject(new Error("Invalid server response"));
            }
          },
          onerror: function(err) {
            reject(new Error("Network connection error"));
          }
        });
      } else {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: bodyStr
        })
        .then(async res => ({ ok: res.ok, status: res.status, data: await res.json() }))
        .then(resolve)
        .catch(reject);
      }
    });
  }

  // অ্যাক্টিভেশন
  async function activateLicense(licenseKey) {
    const deviceId = getDeviceId();
    const res = await apiPost("/api/public/license/activate", {
      license_key: licenseKey,
      device_id: deviceId
    });

    if (res.ok && res.data.valid) {
      localStorage.setItem("active_license_key", licenseKey);
      if (res.data.device_token) {
        localStorage.setItem("active_device_token", res.data.device_token);
      }
      return { success: true, expires_at: res.data.expires_at };
    }
    return { success: false, reason: res.data.reason || "Activation failed" };
  }

  // ভেরিফিকেশন
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

    if (res.ok && res.data.valid) {
      return { valid: true, expires_at: res.data.expires_at };
    }
    return { valid: false, reason: res.data.reason };
  }

  window.AppLicense = { activate: activateLicense, verify: verifyLicense };
})();
