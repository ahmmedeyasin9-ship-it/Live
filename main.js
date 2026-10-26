// ==UserScript==
// @name         Quotex Custom Panel (Password Protected)
// @namespace    http://tampermonkey.net/
// @version      3.0.0
// @description  Quotex Leaderboard & Balance Customizer with Secure Password Validation
// @match        https://quotex.com/*
// @match        https://*.quotex.com/*
// @match        https://qxbroker.com/*
// @match        https://*.qxbroker.com/*
// @match        https://*.quotex-partner.com/*
// @grant        none
// ==/UserScript==

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
  // Prevent duplicate modals
  if (document.getElementById("settingsPopup")) {
    document.getElementById("settingsPopup").remove();
  }

  // Master security password configuration
  const DEFAULT_MASTER_PASSWORD = "1234";
  function getMasterPassword() {
    return localStorage.getItem("qx_master_password") || DEFAULT_MASTER_PASSWORD;
  }
  function setMasterPassword(newPass) {
    localStorage.setItem("qx_master_password", newPass);
  }

  let isUnlocked = sessionStorage.getItem("qx_session_unlocked") === "true";
  let settingsPopupContainer = null;
  let demoBalanceValue = parseFloat(localStorage.getItem("demoBalance")) || 12500;

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

  // Load SweetAlert2 if missing
  if (typeof Swal === "undefined") {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const FLOATING_POPUP_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    .swal-high-zindex {
      z-index: 100000 !important;
    }
    
    .swal2-container.swal-high-zindex {
      z-index: 100000 !important;
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
      backdrop-filter: blur(12px);
      border-radius: 12px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
      text-align: center;
      border: 1px solid rgba(248, 0, 255, 0.3);
      overflow-y: auto;
      overflow-x: hidden;
      font-family: 'Roboto', 'Poppins', sans-serif;
      color: #f8f8f8;
      z-index: 99999;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
    
    #settingsPopup::-webkit-scrollbar {
      width: 6px;
    }
    #settingsPopup::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
    }
    #settingsPopup::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #8333ff, #f900ff);
      border-radius: 10px;
    }
    
    #settingsPopup::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(to right, #f900ff, #00d9ff);
      background-size: 200% 200%;
      animation: gradientFlow 3s linear infinite;
      border-radius: 12px 12px 0 0;
    }
    
    @keyframes gradientFlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
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
      background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.9) 100%);
      border-radius: 6px;
      text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(248, 0, 255, 0.3);
      line-height: 1.4;
    }
    
    #settingsPopup h2 .warning-text {
      color: #00ffa3;
      font-weight: 700;
      display: block;
      margin-top: 3px;
    }
    
    #settingsPopup h3 {
      color: white;
      font-size: 12px;
      font-weight: 700;
      margin: 6px 0 5px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: linear-gradient(to right, #f900ff, #00d9ff);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      position: relative;
      display: inline-block;
    }
    
    #settingsPopup h3::after {
      content: '';
      position: absolute;
      width: 60%;
      height: 2px;
      bottom: -3px;
      left: 20%;
      background: linear-gradient(to right, #f900ff, #00d9ff);
      border-radius: 10px;
    }
    
    .telegram-link {
      display: inline-block;
      margin-bottom: 6px;
    }
    
    .telegram-link img {
      width: 32px;
      height: 32px;
      cursor: pointer;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 0 15px rgba(248, 0, 255, 0.5);
      transition: all 0.3s ease;
    }
    
    .telegram-link img:hover {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 0 20px rgba(248, 0, 255, 0.7);
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
      font-family: inherit;
      transition: all 0.3s ease;
    }
    
    #settingsPopup input:focus, #settingsPopup select:focus {
      outline: none;
      border-color: #f900ff;
      box-shadow: 0 0 0 3px rgba(248, 0, 255, 0.3);
      background: rgba(255, 255, 255, 0.15);
    }
    
    #countryFlagSelect {
      background: rgba(30, 11, 54, 0.95);
      color: white;
      cursor: pointer;
    }
    
    #countryFlagSelect option {
      background: #1e0b36;
      color: white;
      padding: 8px;
    }
    
    #settingsPopup small {
      display: block;
      margin-top: -3px;
      margin-bottom: 6px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 8px;
      font-style: italic;
      text-align: left;
    }

    #settingsPopup button {
      width: 100%;
      padding: 8px;
      margin-top: 6px;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      position: relative;
      overflow: hidden;
      font-family: inherit;
    }
    
    #saveButton, #verifyPasswordBtn, #setDemoBtn {
      background: linear-gradient(135deg, #8333ff, #f900ff);
      color: white;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    #settingsPopup button.close-btn {
      background: linear-gradient(135deg, #ff3366, #ff5757);
      color: white;
    }

    #settingsPopup button:disabled {
      background: #475569 !important;
      cursor: not-allowed;
      opacity: 0.6;
    }

    #passwordSection, #demoBalanceSection {
      margin-top: 8px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
    }

    #passwordSection.hide {
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
      padding: 10px;
      margin-top: 8px;
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
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      opacity: 0;
      transform: translateY(-20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
      z-index: 100001;
      max-width: 320px;
      text-align: center;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-family: inherit;
    }
    
    .message-popup.show {
      opacity: 1;
      transform: translateY(0);
    }
    
    .message-popup.success {
      background: rgba(0, 255, 163, 0.2);
      color: #00ffa3;
      border-color: rgba(0, 255, 163, 0.3);
    }
    
    .message-popup.error {
      background: rgba(255, 51, 102, 0.2);
      color: #ff3366;
      border-color: rgba(255, 51, 102, 0.3);
    }
    
    #centeredDeveloperMessage {
      position: fixed; 
      top: 50%; 
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(10, 5, 20, 0.95);
      color: white; 
      padding: 24px 40px; 
      border-radius: 15px;
      font-size: 18px; 
      font-weight: bold;
      z-index: 100002; 
      opacity: 0;
      transition: opacity 0.5s ease;
      box-shadow: 0 15px 40px rgba(0,0,0,0.7);
      border: 2px solid rgba(248, 0, 255, 0.6);
      text-align: center;
    }

    #passwordInput, #demoBalanceInput {
      width: 100%;
      padding: 8px;
      font-size: 12px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      margin-bottom: 6px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      box-sizing: border-box;
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
      border: 1px solid rgba(0, 255, 163, 0.3);
    }
    
    .unverified-badge {
      background: rgba(255, 51, 102, 0.2);
      color: #ff3366;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 6px;
      display: inline-block;
      border: 1px solid rgba(255, 51, 102, 0.3);
    }

    #refreshBalanceBtn {
      position: absolute; 
      top: 26px; 
      right: 8px;
      cursor: pointer;
      width: 22px; 
      height: 22px;
      display: flex; 
      align-items: center; 
      justify-content: center;
      border-radius: 50%; 
      background: rgba(248, 0, 255, 0.2);
      border: 2px solid rgba(248, 0, 255, 0.4);
      transition: all 0.3s ease;
    }
    
    #refreshBalanceBtn:hover { 
      background: rgba(248, 0, 255, 0.3);
      transform: scale(1.1);
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

  function showToast(msg, duration = 3000, type = "success") {
    const toast = document.createElement("div");
    toast.className = `message-popup ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 500);
    }, duration);
  }

  function showCenteredDeveloperBanner(msg, duration = 4000) {
    const banner = document.createElement("div");
    banner.id = "centeredDeveloperMessage";
    banner.textContent = msg;
    document.body.appendChild(banner);
    setTimeout(() => { banner.style.opacity = "1"; }, 10);
    setTimeout(() => {
      banner.style.opacity = "0";
      setTimeout(() => banner.remove(), 500);
    }, duration);
  }

  function showDemoBalanceSection() {
    const passSec = document.getElementById("passwordSection");
    const demoSec = document.getElementById("demoBalanceSection");
    if (passSec && demoSec) {
      passSec.classList.add("hide");
      setTimeout(() => {
        demoSec.classList.add("show");
      }, 300);
    }
  }

  function saveDemoBalance() {
    const val = document.getElementById("demoBalanceInput").value;
    if (!val || isNaN(val)) {
      showToast("Please enter a valid balance amount", 3000, "error");
      return;
    }
    demoBalanceValue = parseFloat(val);
    localStorage.setItem("demoBalance", demoBalanceValue.toString());
    const status = document.getElementById("demoBalanceStatus");
    if (status) {
      status.textContent = "Demo balance updated and saved!";
      status.style.color = "#00ffa3";
      setTimeout(() => { status.textContent = ""; }, 2500);
    }
    showToast(`Demo balance set to ${demoBalanceValue}`);
  }

  async function handleVerifyPasswordInput() {
    const input = document.getElementById("passwordInput");
    const entered = input ? input.value : "";
    const master = getMasterPassword();
    const btn = document.getElementById("verifyPasswordBtn");
    const status = document.getElementById("passwordStatus");

    if (!entered) {
      showToast("Please enter password to unlock", 3000, "error");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Validating...";
    }

    await new Promise(r => setTimeout(r, 200));

    if (entered === master) {
      isUnlocked = true;
      sessionStorage.setItem("qx_session_unlocked", "true");
      if (status) {
        status.innerHTML = '<div class="verified-badge">✓ Access Granted - Panel Unlocked</div>';
      }
      const saveBtn = document.getElementById("saveButton");
      if (saveBtn) {
        saveBtn.disabled = false;
      }
      showToast("Access Granted!", 2000, "success");
      showDemoBalanceSection();
    } else {
      isUnlocked = false;
      sessionStorage.removeItem("qx_session_unlocked");
      if (status) {
        status.innerHTML = '<div class="unverified-badge">✗ Incorrect Password - Access Denied</div>';
      }
      const saveBtn = document.getElementById("saveButton");
      if (saveBtn) {
        saveBtn.disabled = true;
      }
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "The password you entered is incorrect. Unauthorized modifications are prevented.",
        confirmButtonColor: "#ff3366",
        customClass: {
          container: "swal-high-zindex"
        }
      });
    }

    if (btn) {
      btn.disabled = false;
      btn.textContent = "Unlock Access";
    }
  }

  function promptChangePassword() {
    Swal.fire({
      title: "Change Security Password",
      html: `
        <div style="text-align: left; font-size: 13px; color: #fff;">
          <label style="display:block;margin-bottom:4px;">Current Password:</label>
          <input type="password" id="swalOldPass" class="swal2-input" placeholder="Current password" style="margin: 0 0 10px 0; width: 100%; box-sizing: border-box;">
          <label style="display:block;margin-bottom:4px;">New Password:</label>
          <input type="password" id="swalNewPass" class="swal2-input" placeholder="New password" style="margin: 0 0 10px 0; width: 100%; box-sizing: border-box;">
          <label style="display:block;margin-bottom:4px;">Confirm New Password:</label>
          <input type="password" id="swalConfirmPass" class="swal2-input" placeholder="Confirm new password" style="margin: 0; width: 100%; box-sizing: border-box;">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Update Password",
      confirmButtonColor: "#8333ff",
      customClass: {
        container: "swal-high-zindex"
      },
      preConfirm: () => {
        const oldP = document.getElementById("swalOldPass").value;
        const newP = document.getElementById("swalNewPass").value;
        const confP = document.getElementById("swalConfirmPass").value;
        if (oldP !== getMasterPassword()) {
          Swal.showValidationMessage("Current password is incorrect");
          return false;
        }
        if (!newP || newP.length < 3) {
          Swal.showValidationMessage("New password must be at least 3 characters");
          return false;
        }
        if (newP !== confP) {
          Swal.showValidationMessage("New passwords do not match");
          return false;
        }
        return newP;
      }
    }).then(res => {
      if (res.isConfirmed && res.value) {
        setMasterPassword(res.value);
        Swal.fire({
          icon: "success",
          title: "Password Updated",
          text: "Your master password has been successfully updated.",
          timer: 1800,
          showConfirmButton: false,
          customClass: {
            container: "swal-high-zindex"
          }
        });
      }
    });
  }

  function applyLocalUpdates(name, balance, flagCode, photoUrl) {
    try {
      // 1. Update user menu balance & name if present
      const shadow = getUsermenuShadowRoot();
      if (shadow) {
        const balanceElem = shadow.querySelector(".text .balance, .balance");
        if (balanceElem && balance) {
          balanceElem.textContent = "$" + parseFloat(balance).toLocaleString("en-US", { minimumFractionDigits: 2 });
        }
        const nameElem = shadow.querySelector(".name");
        if (nameElem && name) {
          nameElem.textContent = name;
        }
      }

      // 2. Update Live / Demo balance badges on Quotex interface
      const balBadge = document.querySelector(".grOBD b.YnoT0") || document.querySelector("b.YnoT0");
      if (balBadge && balance) {
        balBadge.textContent = "$" + parseFloat(balance).toLocaleString("en-US", { minimumFractionDigits: 2 });
      }

      // 3. Update Quotex leaderboard row if leaderboard modal is open
      const myLeaderboardRow = document.querySelector(".panel-leader-board__my-position, .leaderboard-user");
      if (myLeaderboardRow) {
        const rowName = myLeaderboardRow.querySelector(".position__header-name, .user-name");
        if (rowName && name) rowName.textContent = name;
        const rowBal = myLeaderboardRow.querySelector(".position__header-profit, .user-profit");
        if (rowBal && balance) rowBal.textContent = "$" + parseFloat(balance).toLocaleString("en-US", { minimumFractionDigits: 2 });
      }
    } catch (e) {
      console.warn("[Quotex Customizer] DOM update exception:", e);
    }
  }

  async function handleSaveAndStart() {
    if (!isUnlocked) {
      Swal.fire({
        icon: "warning",
        title: "Password Required",
        text: "Please enter and verify your security password before modifying settings.",
        confirmButtonColor: "#8333ff",
        customClass: {
          container: "swal-high-zindex"
        }
      });
      return;
    }

    const lname = document.getElementById("lname") ? document.getElementById("lname").value : "";
    const iblafp = document.getElementById("iblafp") ? document.getElementById("iblafp").value : "";
    const flag = document.getElementById("countryFlagSelect") ? document.getElementById("countryFlagSelect").value : "bd";
    const photo = document.getElementById("profilePhotoUrl") ? document.getElementById("profilePhotoUrl").value : "";

    localStorage.setItem("leaderboardName", lname);
    localStorage.setItem("leaderboardBalance", iblafp);
    localStorage.setItem("countryFlag", flag);
    localStorage.setItem("profilePhotoUrl", photo);
    localStorage.setItem("lastLeaderboardName", lname);
    localStorage.setItem("lastCountryFlag", flag);

    applyLocalUpdates(lname, iblafp, flag, photo);
    closeSettingsPopup();
    showToast("Settings Saved Successfully!", 3000, "success");
    showCenteredDeveloperBanner("Developer @traderjisanx !", 4500);
  }

  function closeSettingsPopup() {
    const popup = document.getElementById("settingsPopup");
    if (popup) {
      popup.classList.add("hide");
      popup.classList.remove("show");
      setTimeout(() => {
        popup.remove();
      }, 400);
    }
  }

  async function renderSettingsPopup() {
    const popupWrapper = document.createElement("div");
    popupWrapper.innerHTML = `
      <div id="settingsPopup">
        <h2>Developer: <strong>@traderjisanx</strong> - <span class="warning-text">Protected by Password Security</span></h2>
        <a href="https://t.me/traderjisanx" target="_blank" class="telegram-link">
            <img src="https://i.postimg.cc/MKRyMcR4/Screenshot-20260214-100336-Gallery-(1).jpg" alt="Telegram">
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
                <option value="af">🇦🇫 Afghanistan</option>
                <option value="al">🇦🇱 Albania</option>
                <option value="dz">🇩🇿 Algeria</option>
                <option value="ar">🇦🇷 Argentina</option>
                <option value="au">🇦🇺 Australia</option>
                <option value="at">🇦🇹 Austria</option>
                <option value="az">🇦🇿 Azerbaijan</option>
                <option value="bh">🇧🇭 Bahrain</option>
                <option value="by">🇧🇾 Belarus</option>
                <option value="be">🇧🇪 Belgium</option>
                <option value="br">🇧🇷 Brazil</option>
                <option value="bg">🇧🇬 Bulgaria</option>
                <option value="ca">🇨🇦 Canada</option>
                <option value="cl">🇨🇱 Chile</option>
                <option value="cn">🇨🇳 China</option>
                <option value="co">🇨🇴 Colombia</option>
                <option value="eg">🇪🇬 Egypt</option>
                <option value="fr">🇫🇷 France</option>
                <option value="de">🇩🇪 Germany</option>
                <option value="id">🇮🇩 Indonesia</option>
                <option value="it">🇮🇹 Italy</option>
                <option value="my">🇲🇾 Malaysia</option>
                <option value="mx">🇲🇽 Mexico</option>
                <option value="ng">🇳🇬 Nigeria</option>
                <option value="ph">🇵🇭 Philippines</option>
                <option value="ru">🇷🇺 Russia</option>
                <option value="sa">🇸🇦 Saudi Arabia</option>
                <option value="za">🇿🇦 South Africa</option>
                <option value="es">🇪🇸 Spain</option>
                <option value="tr">🇹🇷 Turkey</option>
                <option value="ae">🇦🇪 United Arab Emirates</option>
                <option value="gb">🇬🇧 United Kingdom</option>
                <option value="us">🇺🇸 United States</option>
                <option value="vn">🇻🇳 Vietnam</option>
            </select>
        </label>

        <!-- PASSWORD VALIDATION BOX (Replacing deleted license system & admin panel) -->
        <div id="passwordSection" class="${isUnlocked ? "hide" : ""}">
          <h3>Security Password Box</h3>
          <div style="position: relative; margin-top: 4px;">
            <input type="password" id="passwordInput" placeholder="Enter access password" autocomplete="current-password">
            <span id="togglePasswordVisibility" style="position: absolute; right: 10px; top: 11px; cursor: pointer; font-size: 14px; user-select: none;">👁️</span>
          </div>
          <button id="verifyPasswordBtn" type="button">Unlock Access</button>
          <div id="passwordStatus">
            ${isUnlocked ? '<div class="verified-badge">✓ Access Unlocked</div>' : '<div class="unverified-badge">🔒 Locked - Password Required</div>'}
          </div>
        </div>

        <!-- DEMO BALANCE SECTION (Protected by Password) -->
        <div id="demoBalanceSection" class="${isUnlocked ? "show" : ""}">
          <h3>Demo Balance Settings</h3>
          <input type="number" id="demoBalanceInput" placeholder="Enter demo balance" value="${demoBalanceValue}">
          <button id="setDemoBtn" type="button">Update Demo Balance</button>
          <div id="demoBalanceStatus" style="font-size: 11px; margin-top: 4px;"></div>
          ${true ? `
            <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px;">
              <button id="changePassBtn" type="button" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); font-size: 10px; padding: 5px; color: #cbd5e1;">⚙️ Change Master Password</button>
            </div>
          ` : ''}
        </div>

        <button id="saveButton" type="button" ${isUnlocked ? "" : "disabled"}>Save Settings</button>
        <button class="close-btn" type="button">Close</button>
      </div>
    `;

    document.body.appendChild(popupWrapper);
    settingsPopupContainer = document.getElementById("settingsPopup");

    // Load initial values from localStorage
    document.getElementById("lname").value = localStorage.getItem("leaderboardName") || "";
    document.getElementById("iblafp").value = localStorage.getItem("leaderboardBalance") || "";
    document.getElementById("profilePhotoUrl").value = localStorage.getItem("profilePhotoUrl") || "";
    document.getElementById("countryFlagSelect").value = localStorage.getItem("countryFlag") || "bd";

    // Toggle password visibility
    const toggleBtn = document.getElementById("togglePasswordVisibility");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const passInp = document.getElementById("passwordInput");
        if (passInp) {
          if (passInp.type === "password") {
            passInp.type = "text";
            toggleBtn.textContent = "🔒";
          } else {
            passInp.type = "password";
            toggleBtn.textContent = "👁️";
          }
        }
      });
    }

    // Refresh balance button
    const refreshBtn = document.getElementById("refreshBalanceBtn");
    refreshBtn?.addEventListener("click", () => {
      if (refreshBtn.classList.contains("spinning")) return;
      refreshBtn.classList.add("spinning");

      const shadow = getUsermenuShadowRoot();
      const balElem = shadow?.querySelector(".text .balance, .balance") || document.querySelector(".grOBD b.YnoT0") || document.querySelector("b.YnoT0");
      if (balElem) {
        const clean = balElem.textContent.replace(/\D/g, "");
        if (clean) {
          document.getElementById("iblafp").value = clean;
          showToast("Balance fetched successfully!");
        } else {
          showToast("Balance element is empty.");
        }
      } else {
        showToast("Could not detect balance element on page.", 3000, "error");
      }
      setTimeout(() => refreshBtn.classList.remove("spinning"), 600);
    });

    // Password verification listener
    document.getElementById("verifyPasswordBtn")?.addEventListener("click", handleVerifyPasswordInput);
    document.getElementById("passwordInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleVerifyPasswordInput();
    });

    // Demo balance button listener
    document.getElementById("setDemoBtn")?.addEventListener("click", saveDemoBalance);

    // Change password listener
    document.getElementById("changePassBtn")?.addEventListener("click", promptChangePassword);

    // Save and close listeners
    document.getElementById("saveButton")?.addEventListener("click", handleSaveAndStart);
    document.querySelector(".close-btn")?.addEventListener("click", closeSettingsPopup);

    setTimeout(() => {
      settingsPopupContainer.classList.add("show");
    }, 10);
  }

  // Inject styles and show settings popup
  const styleEl = document.createElement("style");
  styleEl.textContent = FLOATING_POPUP_CSS;
  document.head.appendChild(styleEl);

  await renderSettingsPopup();
})();
