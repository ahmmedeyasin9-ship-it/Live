(function () {
  const SERVER_URL = 'https://demotoliveadmin.lovable.app';

  // 1. Storage Helpers
  function getDeviceId() {
    let id = localStorage.getItem('app_device_id');
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : 'dev_' + Math.random().toString(36).substring(2) + Date.now());
      localStorage.setItem('app_device_id', id);
    }
    return id;
  }

  function getStoredAuth() {
    return {
      key: localStorage.getItem('app_license_key') || '',
      token: localStorage.getItem('app_device_token') || '',
      deviceId: getDeviceId()
    };
  }

  function saveAuth(key, token) {
    if (key) localStorage.setItem('app_license_key', key);
    if (token) localStorage.setItem('app_device_token', token);
  }

  // 2. API Communication
  async function apiRequest(endpoint, payload) {
    try {
      const res = await fetch(`${SERVER_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      return { valid: false, reason: 'network_error' };
    }
  }

  async function activateLicense(licenseKey) {
    const deviceId = getDeviceId();
    const data = await apiRequest('/api/public/license/activate', {
      license_key: licenseKey,
      device_id: deviceId
    });
    if (data.valid && data.device_token) {
      saveAuth(licenseKey, data.device_token);
    }
    return data;
  }

  async function verifyLicense(licenseKey, deviceToken) {
    const deviceId = getDeviceId();
    return await apiRequest('/api/public/license/verify', {
      license_key: licenseKey,
      device_id: deviceId,
      device_token: deviceToken
    });
  }

  async function fetchBootstrapPayload(licenseKey, deviceToken) {
    const deviceId = getDeviceId();
    return await apiRequest('/api/public/client/bootstrap', {
      license_key: licenseKey,
      device_id: deviceId,
      device_token: deviceToken
    });
  }

  // 3. Application Launcher (Secure Code Execution)
  async function launchApplication(licenseKey, deviceToken) {
    // পপআপ রিমুভ করা
    const modal = document.getElementById('remote-license-modal');
    if (modal) modal.remove();

    console.log('[System] License active! Fetching secure bootstrap...');
    const bootstrap = await fetchBootstrapPayload(licenseKey, deviceToken);

    // লাইসেন্স ভ্যালিড হলে আপনার মূল অ্যাপ্লিকেশন লজিক এখানে শুরু হবে
    startMainApplication(bootstrap);
  }

  function startMainApplication(bootstrapData) {
    console.log('[System] Application loaded successfully.', bootstrapData);
    // TODO: আপনার মূল অ্যাপের প্রয়োজনীয় ফাংশনগুলো এখানে রান করুন
  }

  // 4. License UI Popup
  function createLicenseModal(initialError = '') {
    if (document.getElementById('remote-license-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'remote-license-modal';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px);
      display: flex; align-items: center; justify-content: center; z-index: 9999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 24px; width: 90%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); color: #f4f4f5;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
          <div style="background: #2563eb; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">🔑</div>
          <div>
            <h3 style="margin: 0; font-size: 17px; font-weight: 600;">License Verification</h3>
            <p style="margin: 2px 0 0; font-size: 12px; color: #a1a1aa;">Enter your license key to activate</p>
          </div>
        </div>

        <input type="text" id="license-input-field" placeholder="RSC-XXXX-XXXX..." value="${getStoredAuth().key}" style="
          width: 100%; box-sizing: border-box; padding: 12px; background: #09090b; border: 1px solid #3f3f46;
          border-radius: 8px; color: #fff; font-family: monospace; font-size: 14px; outline: none; margin-bottom: 12px;
        " />

        <div id="license-status-msg" style="font-size: 13px; margin-bottom: 14px; min-height: 18px; color: #ef4444;">
          ${initialError}
        </div>

        <button id="license-submit-btn" style="
          width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px;
          font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s;
        ">Verify & Start</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const btn = document.getElementById('license-submit-btn');
    const input = document.getElementById('license-input-field');
    const msg = document.getElementById('license-status-msg');

    btn.addEventListener('click', async () => {
      const key = input.value.trim();
      if (!key) {
        msg.textContent = 'Please enter a valid license key.';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      msg.style.color = '#38bdf8';
      msg.textContent = 'Connecting to server...';

      const res = await activateLicense(key);
      if (res.valid && res.device_token) {
        msg.style.color = '#22c55e';
        msg.textContent = 'License activated successfully!';
        setTimeout(() => launchApplication(key, res.device_token), 600);
      } else {
        btn.disabled = false;
        btn.textContent = 'Verify & Start';
        msg.style.color = '#ef4444';
        msg.textContent = 'Activation failed: ' + (res.reason || 'Invalid license').replace(/_/g, ' ');
      }
    });
  }

  // 5. Initial Auto-check on Page Load
  async function init() {
    const auth = getStoredAuth();
    if (auth.key && auth.token) {
      const res = await verifyLicense(auth.key, auth.token);
      if (res.valid) {
        launchApplication(auth.key, auth.token);
        return;
      }
    }
    createLicenseModal();
  }

  init();
})();
