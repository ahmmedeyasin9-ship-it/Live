// ==UserScript==
// @name         Demo to Live Client Script
// @namespace    https://demotoliveadmin.lovable.app
// @version      1.0.0
// @description  Connects to Demotoliveadmin license server and unlocks live features
// @match        *://*/*
// @grant        none
// ==/UserScript==

(async function () {
  const SERVER_URL = 'https://demotoliveadmin.lovable.app';

  // ১. ডিভাইস আইডি তৈরি বা রিড করা
  let deviceId = localStorage.getItem('dtl_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem('dtl_device_id', deviceId);
  }

  // ২. লাইসেন্স কি নেওয়া
  let licenseKey = localStorage.getItem('dtl_license_key');
  if (!licenseKey) {
    licenseKey = prompt('Please enter your License Key:');
    if (!licenseKey) return alert('License key is required!');
    localStorage.setItem('dtl_license_key', licenseKey.trim());
  }

  let deviceToken = localStorage.getItem('dtl_device_token');

  // ৩. অ্যাক্টিভেশন এবং ভেরিফিকেশন ফাংশন
  async function checkLicense() {
    const action = deviceToken ? 'verify' : 'activate';
    try {
      const res = await fetch(`${SERVER_URL}/api/public/license/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: licenseKey,
          device_id: deviceId,
          ...(deviceToken ? { device_token: deviceToken } : {}),
          browser: navigator.userAgent.substring(0, 70),
          os: navigator.platform || 'Unknown',
          device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        })
      });

      const data = await res.json();

      if (data.valid) {
        if (data.device_token) {
          localStorage.setItem('dtl_device_token', data.device_token);
          deviceToken = data.device_token;
        }
        console.log('✅ License Verified! Status: Active');
        startDemoToLive();
      } else {
        console.error('❌ License Error:', data.reason);
        localStorage.removeItem('dtl_device_token');
        alert('License verification failed: ' + (data.reason || 'Invalid license'));
      }
    } catch (err) {
      console.error('Server connection error:', err);
    }
  }

  // ৪. লাইসেন্স ভেরিফাইড হলে যা এক্সিকিউট হবে (Demo to Live লজিক)
  function startDemoToLive() {
    console.log('🚀 Demo to Live script is running...');
    
    // আপনার Demo to Live সংক্রান্ত UI বা ব্যালেন্স পরিবর্তন লজিক এখানে যুক্ত করুন
    const badge = document.createElement('div');
    badge.id = 'dtl-status-badge';
    badge.innerHTML = '🟢 VIP Live Connected';
    badge.style = 'position:fixed;bottom:20px;right:20px;background:#10b981;color:#fff;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:bold;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    document.body.appendChild(badge);
  }

  // স্ক্রিপ্ট রান করা
  await checkLicense();
})();
