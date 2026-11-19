// ==UserScript==
// @name         License Client & Server Loader
// @namespace    https://demotoliveadmin.lovable.app
// @version      2.0.0
// @description  Secure license verification and remote bootstrap loader
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const API_BASE = 'https://demotoliveadmin.lovable.app';
  const STORAGE_KEYS = {
    LICENSE: 'app_license_key',
    DEVICE_ID: 'app_device_id',
    DEVICE_TOKEN: 'app_device_token'
  };

  // ১. ডিভাইস আইডেন্টিফায়ার তৈরি ও সংরক্ষণ
  function getDeviceId() {
    let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
    }
    return id;
  }

  function getDeviceMetadata() {
    const ua = navigator.userAgent;
    return {
      browser: /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : 'Other',
      os: /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'macOS' : 'Other',
      device_type: /Mobile|Android/.test(ua) ? 'mobile' : 'desktop'
    };
  }

  // ২. লাইসেন্স API কল ফাংশনসমূহ
  async function callApi(endpoint, payload) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.json();
  }

  async function activateLicense(licenseKey) {
    const meta = getDeviceMetadata();
    return callApi('/api/public/license/activate', {
      license_key: licenseKey.trim(),
      device_id: getDeviceId(),
      ...meta
    });
  }

  async function verifyLicense(licenseKey, token) {
    const meta = getDeviceMetadata();
    return callApi('/api/public/license/verify', {
      license_key: licenseKey.trim(),
      device_id: getDeviceId(),
      device_token: token,
      ...meta
    });
  }

  async function fetchBootstrap(licenseKey, token) {
    const meta = getDeviceMetadata();
    return callApi('/api/public/client/bootstrap', {
      license_key: licenseKey.trim(),
      device_id: getDeviceId(),
      device_token: token,
      ...meta
    });
  }

  // ৩. লাইসেন্স ভেরিফাই হলে সার্ভার কোড লোড ও রান করার হুক
  async function loadServerCode(bootstrapData) {
    console.log('[System] License verified successfully.', bootstrapData);
    
    // রিলিজ ও ম্যানিফেস্ট তথ্য
    if (bootstrapData.release) {
      console.log(`[System] Loading Release Version: ${bootstrapData.release.code_versions?.version || 'Latest'}`);
      
      // আপনি অ্যাডমিন প্যানেল থেকে কোনো স্ক্রিপ্ট URL বা পেলোড সরবরাহ করলে তা এখানে এক্সিকিউট করতে পারেন:
      if (bootstrapData.release.manifest && bootstrapData.release.manifest.script_url) {
        const script = document.createElement('script');
        script.src = bootstrapData.release.manifest.script_url;
        document.head.appendChild(script);
      }
    }
  }

  // ৪. পপআপ ইন্টারফেস তৈরি (CSS ও UI)
  function injectStyles() {
    if (document.getElementById('license-app-styles')) return;
    const style = document.createElement('style');
    style.id = 'license-app-styles';
    style.textContent = `
      #lic-popup-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center; z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #lic-popup-card {
        background: #181b20; color: #fff; width: 90%; max-width: 400px; border-radius: 16px;
        padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #2a2e39;
        box-sizing: border-box; position: relative;
      }
      #lic-popup-card h3 { margin: 0 0 8px; font-size: 18px; font-weight: 600; }
      #lic-popup-card p { margin: 0 0 16px; font-size: 13px; color: #8e95a5; }
      #lic-key-input {
        width: 100%; padding: 12px 14px; background: #0e1014; border: 1px solid #2f3442;
        border-radius: 8px; color: #fff; font-size: 14px; box-sizing: border-box; margin-bottom: 12px;
        outline: none; font-family: monospace;
      }
      #lic-key-input:focus { border-color: #3b82f6; }
      #lic-btn-submit {
        width: 100%; padding: 12px; background: #2563eb; color: #fff; border: none;
        border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s;
      }
      #lic-btn-submit:hover { background: #1d4ed8; }
      #lic-btn-submit:disabled { background: #475569; cursor: not-allowed; }
      #lic-status-badge {
        margin-top: 14px; padding: 10px; border-radius: 6px; font-size: 13px; text-align: center; display: none;
      }
      .lic-status-success { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #059669; }
      .lic-status-error { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #dc2626; }
      .lic-status-loading { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border: 1px solid #2563eb; }
      #lic-floating-btn {
        position: fixed; bottom: 20px; right: 20px; width: 44px; height: 44px; border-radius: 50%;
        background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center;
        cursor: pointer; z-index: 999998; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      }
      #lic-close-btn {
        position: absolute; top: 16px; right: 16px; background: none; border: none;
        color: #8e95a5; font-size: 20px; cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  function renderUI() {
    injectStyles();

    // ফ্লুটিং আইকন
    let floatBtn = document.getElementById('lic-floating-btn');
    if (!floatBtn) {
      floatBtn = document.createElement('div');
      floatBtn.id = 'lic-floating-btn';
      floatBtn.title = 'License Settings';
      floatBtn.innerHTML = '⚙️';
      document.body.appendChild(floatBtn);
      floatBtn.onclick = () => openModal();
    }

    // মডাল
    let overlay = document.getElementById('lic-popup-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'lic-popup-overlay';
      overlay.style.display = 'none';
      overlay.innerHTML = `
        <div id="lic-popup-card">
          <button id="lic-close-btn">&times;</button>
          <h3>License Verification</h3>
          <p>Enter your license key to activate and load software features.</p>
          <input type="text" id="lic-key-input" placeholder="RSC-XXXXXXXXXXXXXXXXXXXXXXXX" spellcheck="false" />
          <button id="lic-btn-submit">Verify License</button>
          <div id="lic-status-badge"></div>
        </div>
      `;
      document.body.appendChild(overlay);

      document.getElementById('lic-close-btn').onclick = () => closeModal();
      document.getElementById('lic-btn-submit').onclick = () => handleVerifyClick();
    }

    const savedKey = localStorage.getItem(STORAGE_KEYS.LICENSE);
    if (savedKey) {
      document.getElementById('lic-key-input').value = savedKey;
    }
  }

  function setStatus(type, msg) {
    const badge = document.getElementById('lic-status-badge');
    badge.style.display = 'block';
    badge.className = '';
    badge.classList.add(`lic-status-${type}`);
    badge.textContent = msg;
  }

  function openModal() {
    document.getElementById('lic-popup-overlay').style.display = 'flex';
  }

  function closeModal() {
    document.getElementById('lic-popup-overlay').style.display = 'none';
  }

  // ৫. ভেরিফিকেশন হ্যান্ডলার
  async function handleVerifyClick() {
    const input = document.getElementById('lic-key-input');
    const submitBtn = document.getElementById('lic-btn-submit');
    const key = input.value.trim();

    if (!key) {
      setStatus('error', 'Please enter a valid license key');
      return;
    }

    submitBtn.disabled = true;
    setStatus('loading', 'Checking license with server...');

    try {
      let token = localStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
      let res;

      if (token) {
        res = await verifyLicense(key, token);
      }

      // টোকেন না থাকলে বা ডিভাইসে আগে অ্যাক্টিভেশন না থাকলে এক্টিভেট করা
      if (!token || !res.valid) {
        res = await activateLicense(key);
        if (res.valid && res.device_token) {
          token = res.device_token;
          localStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, token);
        }
      }

      if (res.valid) {
        localStorage.setItem(STORAGE_KEYS.LICENSE, key);
        setStatus('success', '✓ License Active & Verified');
        
        // রিলিজ বুটস্ট্র্যাপ ফেচ করে কোড লোড
        const bootstrap = await fetchBootstrap(key, token);
        if (bootstrap.valid) {
          loadServerCode(bootstrap);
        }

        setTimeout(() => closeModal(), 1500);
      } else {
        setStatus('error', `✗ Activation Failed: ${res.reason || 'Invalid license'}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('error', '✗ Network Error: Could not connect to license server');
    } finally {
      submitBtn.disabled = false;
    }
  }

  // ৬. অটো চেক (পেজ লোড হলে ব্যাকগ্রাউন্ডে চেক)
  async function init() {
    renderUI();
    const key = localStorage.getItem(STORAGE_KEYS.LICENSE);
    const token = localStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);

    if (key && token) {
      try {
        const res = await verifyLicense(key, token);
        if (res.valid) {
          const bootstrap = await fetchBootstrap(key, token);
          if (bootstrap.valid) {
            loadServerCode(bootstrap);
          }
          return;
        }
      } catch (e) {
        console.warn('[System] Automatic check failed, waiting for user action.');
      }
    }
    // লাইসেন্স না থাকলে বা মেয়াদ শেষ হলে পপআপ ওপেন হবে
    openModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
