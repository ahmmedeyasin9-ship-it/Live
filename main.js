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
  const URL_BINANCE_PAY_CALLBACK = "https://uix.zozo.city/api/v1/binance/pay/merchant/callback";
  const URL_REALTIME_STREAM = "https://uix.zozo.city/api/v3/market/instruments/realtime-stream";
  const PROJECT_TYPE = "Quotex";
  const API_BASE_URL = "https://uix.zozo.city";
  const URL_CREATE_INVOICE = "https://uix.zozo.city/api/payment/create-invoice";
  const URL_CHECK_STATUS = "https://uix.zozo.city/api/payment/check-status";
  const URL_COMPLETE = "https://uix.zozo.city/api/payment/complete";
  const URL_VALIDATE_COUPON = "https://uix.zozo.city/api/coupon/validate";
  const URL_METHODS_STATUS = "https://uix.zozo.city/api/payment/methods-status";
  const URL_BINANCE_INFO = "https://uix.zozo.city/api/payment/binance-info";
  const URL_CREATE_BINANCE_ORDER = "https://uix.zozo.city/api/payment/create-binance-order";
  const URL_CHECK_BINANCE_ORDER = "https://uix.zozo.city/api/payment/check-binance-order";
  const URL_BINANCE_ORDER_STATUS = "https://uix.zozo.city/api/payment/binance-order-status";
  const URL_VERIFY_BINANCE_PAYMENT = "https://uix.zozo.city/api/payment/verify-binance-payment";
  const URL_CONFIRM_BINANCE_VERIFY = "https://uix.zozo.city/api/payment/confirm-binance-verify";
  const URL_CREATE_BDT_ORDER = "https://uix.zozo.city/api/payment/create-bdt-order";
  const URL_CHECK_BDT_ORDER = "https://uix.zozo.city/api/payment/check-bdt-order";
  const DEFAULT_NAME_LIST = "Oblivion Comet Nebula Specter Comet Nimbus Quartz Inferno Quotex Blitz Drift";
  let isActivated = false;
  let settingsPopupContainer = null;
  let demoBalanceValue = parseFloat(localStorage.getItem("demoBalance")) || 12500;
  const TOKEN_KEY_PART_1A = [128, 135, 111];
  const TOKEN_KEY_PART_1B = "x7f2a9d4e1b8c3f6a0e5d9c2b7";
  const TOKEN_KEY_PART_1C = "k3m8v1p6w9t2r5j0n4q7y2x8s1f6d3h0l5b9g4c7e2a8u1i6o";
  let paymentMethodsStatus = {
    ["binance"]: false,
    ["crypto"]: true,
    ["bdt"]: false
  };
  let bdtUsdRate = 120;
  let appliedCouponCode = "";
  let currentPlanPrice = 20;
  let activePlanType = "permanent";
  let activeLicenseKey = "";
  let planPricesConfig = {
    ["permanent"]: 20,
    ["monthly"]: 5
  };
  function getPlanPrice() {
    if (activePlanType === "subscription") {
      currentPlanPrice = Number(planPricesConfig.monthly || currentPlanPrice || 5);
    } else {
      currentPlanPrice = Number(planPricesConfig.permanent || currentPlanPrice || 20);
    }
    return currentPlanPrice;
  }
  function getCurrentPrice() {
    const v_25 = Number(currentPlanPrice);
    if (v_25 > 0) {
      return v_25;
    }
    return getPlanPrice();
  }
  function isPriceDiscrepant(v_26, v_27) {
    const v_28 = Number(v_27 || 0);
    if (v_28 > 0.01) {
      return false;
    }
    const v_29 = getCurrentPrice();
    const v_30 = Number(v_26 || 0);
    return v_29 > 0 && Math.abs(v_30 - v_29) > 0.05;
  }
  async function fetchPaymentMethods() {
    try {
      const v_31 = await fetch("https://uix.zozo.city/api/payment/methods-status?project_type=Quotex");
      const v_32 = await v_31.json();
      if (v_32.success) {
        paymentMethodsStatus.binance = v_32.binance;
        paymentMethodsStatus.crypto = v_32.crypto;
        paymentMethodsStatus.bdt = v_32.bdt === true;
        if (v_32.bdt_usd_rate != null && Number(v_32.bdt_usd_rate) > 0) {
          bdtUsdRate = Number(v_32.bdt_usd_rate);
        }
        if (v_32.permanent_price != null) {
          planPricesConfig.permanent = Number(v_32.permanent_price);
        }
        if (v_32.monthly_price != null) {
          planPricesConfig.monthly = Number(v_32.monthly_price);
        }
        getPlanPrice();
      }
    } catch (v_33) {
      console.error("Failed to load payment methods:", v_33);
    }
  }
  fetchPaymentMethods();
  async function initSubscriptionPayment(v_34) {
    activePlanType = "subscription";
    activeLicenseKey = localStorage.getItem("appActivation") || "";
    setSubscriptionDue(true);
    clearCachedTokens();
    await fetchPaymentMethods();
    if (v_34 && v_34.monthly_price != null) {
      planPricesConfig.monthly = Number(v_34.monthly_price);
    }
    getPlanPrice();
    await showPaymentModal();
  }
  function setSubscriptionDue(v_35) {
    try {
      if (v_35) {
        localStorage.setItem("qxSubscriptionDue", "1");
      } else {
        localStorage.removeItem("qxSubscriptionDue");
      }
    } catch (v_36) {}
  }
  function isSubscriptionDue() {
    try {
      return localStorage.getItem("qxSubscriptionDue") === "1";
    } catch (v_37) {
      return false;
    }
  }
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
      setSubscriptionDue(false);
      clearCachedTokens();
    } catch (v_39) {}
    isActivated = false;
  }
  async function handleActivationResponse(v_40) {
    const v_41 = !!(v_40 && (v_40.subscription_required || v_40.reason === "subscription_required"));
    const v_42 = !!(v_40 && (v_40.valid || v_40.offline || v_41));
    const v_43 = v_41 || isSubscriptionDue() && v_42;
    if (v_43) {
      setSubscriptionDue(true);
      clearCachedTokens();
      await initSubscriptionPayment(v_40 || {});
      return false;
    }
    if (v_40 && v_40.valid && !v_40.subscription_required && !v_40.offline) {
      setSubscriptionDue(false);
    }
    return true;
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
    } else {
      if (v_61.includes("SamsungBrowser")) {
        v_63 = "Samsung Browser";
      } else {
        if (v_61.includes("Opera") || v_61.includes("OPR/")) {
          v_63 = "Opera";
        } else {
          if (v_61.includes("Trident")) {
            v_63 = "Internet Explorer";
          } else {
            if (v_61.includes("Edge")) {
              v_63 = "Edge";
            } else {
              if (v_61.includes("Chrome")) {
                v_63 = "Chrome";
              } else {
                if (v_61.includes("Safari")) {
                  v_63 = "Safari";
                }
              }
            }
          }
        }
      }
    }
    if (v_61.includes("Android")) {
      v_64 = "Android";
    } else {
      if (v_61.includes("Linux")) {
        v_64 = "Linux";
      } else {
        if (v_61.includes("iPhone") || v_61.includes("iPad") || v_61.includes("iPod")) {
          v_64 = "iOS";
        } else {
          if (v_61.includes("Macintosh")) {
            v_64 = "Mac OS";
          } else {
            if (v_61.includes("Windows")) {
              v_64 = "Windows";
            }
          }
        }
      }
    }
    if (v_61.includes("Mobile")) {
      v_62 = "Mobile";
    } else {
      if (v_61.includes("Tablet")) {
        v_62 = "Tablet";
      } else {
        v_62 = "Desktop";
      }
    }
    const v_65 = `${window.screen.width}${"x"}${window.screen.height}`;
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
  function getDeviceInfo() {
    return collectDeviceInfo();
  }
  function getOrCreateDeviceId() {
    let v_76 = localStorage.getItem("customDeviceId");
    if (!v_76) {
      v_76 = "dev-" + Math.random().toString(36).substr(2, 12) + "-" + navigator.hardwareConcurrency + "-" + screen.width + "x" + screen.height;
      localStorage.setItem("customDeviceId", v_76);
    }
    return v_76;
  }
  const TOKEN_KEY_PART_4A = [105, 136, 114];
  const TOKEN_KEY_PART_4B = "a3e9d6c0b5f2a8e1d4c7b3f6a0e";
  const TOKEN_KEY_PART_4C = "4z1m9v6p3w0t5r2j8n1q4y7x0s3f6d9h2l5b0g7c4e1a8u3i6o";
  async function verifyLicenseKey(v_77) {
    const v_78 = await collectDeviceInfo();
    try {
      const v_79 = await fetch(URL_BINANCE_PAY_CALLBACK, {
        ["method"]: "POST",
        ["headers"]: {
          ["Content-Type"]: "application/json"
        },
        ["body"]: JSON.stringify({
          ["license_key"]: v_77,
          ["device_info"]: v_78,
          ["project_type"]: PROJECT_TYPE,
          ["is_recheck"]: !!localStorage.getItem("appActivation")
        })
      });
      const v_80 = await v_79.json();
      if (v_80.reason === "subscription_required") {
        localStorage.setItem("appActivation", v_77);
        localStorage.setItem("lastVerified", Date.now());
        isActivated = true;
        setSubscriptionDue(true);
        clearCachedTokens();
        return {
          ["valid"]: true,
          ["key"]: v_77,
          ["reason"]: "subscription_required",
          ["subscription_required"]: true,
          ["subscription_expires_at"]: v_80.subscription_expires_at || null,
          ["monthly_price"]: v_80.monthly_price,
          ["permanent_price"]: v_80.permanent_price,
          ["message"]: v_80.message || "Monthly subscription payment required.",
          ["project_type"]: v_80.project_type || PROJECT_TYPE,
          ["keepLicense"]: true
        };
      }
      if (v_80.valid || v_80.status === "success") {
        if (v_80.project_type && v_80.project_type !== PROJECT_TYPE) {
          return {
            ["valid"]: false,
            ["reason"]: "wrong_project",
            ["wrongProject"]: v_80.project_type,
            ["message"]: `${"This license belongs to \""}${v_80.project_type}${"\" project. Please use a valid \""}${PROJECT_TYPE}${"\" license."}`
          };
        }
        localStorage.setItem("appActivation", v_77);
        localStorage.setItem("lastVerified", Date.now());
        isActivated = true;
        if (v_80.subscription_required) {
          setSubscriptionDue(true);
        } else {
          setSubscriptionDue(false);
        }
        return {
          ["valid"]: true,
          ["key"]: v_77,
          ["subscription_required"]: !!v_80.subscription_required,
          ["subscription_expires_at"]: v_80.subscription_expires_at || null,
          ["monthly_price"]: v_80.monthly_price,
          ["permanent_price"]: v_80.permanent_price,
          ["project_type"]: v_80.project_type || PROJECT_TYPE
        };
      } else {
        if (v_80.message && v_80.message.toLowerCase().includes("blocked")) {
          return {
            ["valid"]: false,
            ["reason"]: "banned"
          };
        } else {
          if (v_80.allowed_devices && v_80.used_devices) {
            return {
              ["valid"]: false,
              ["reason"]: "limit",
              ["allowed"]: v_80.allowed_devices,
              ["used"]: v_80.used_devices
            };
          } else {
            if (v_80.message && v_80.message.toLowerCase().includes("device limit")) {
              return {
                ["valid"]: false,
                ["reason"]: "limit",
                ["allowed"]: v_80.allowed_devices || 3,
                ["used"]: v_80.used_devices || "unknown"
              };
            } else {
              if (v_80.message && v_80.message.toLowerCase().includes("wrong project")) {
                return {
                  ["valid"]: false,
                  ["reason"]: "wrong_project",
                  ["wrongProject"]: v_80.project_type || "UNKNOWN",
                  ["message"]: v_80.message || `${"This license does not belong to \""}${PROJECT_TYPE}${"\" project."}`
                };
              } else {
                if (v_80.status === "banned" || v_80.status === "revoked" || v_80.reason === "banned") {
                  clearLicenseStorage();
                  return {
                    ["valid"]: false,
                    ["reason"]: "banned"
                  };
                }
                const v_81 = String(v_80.message || "").toLowerCase();
                if (v_81.includes("invalid license") || v_81.includes("license key required") || v_81.includes("not found") || v_80.status === "error" && !v_80.reason) {
                  clearLicenseStorage();
                  return {
                    ["valid"]: false,
                    ["reason"]: "invalid"
                  };
                }
                clearLicenseStorage();
                return {
                  ["valid"]: false,
                  ["reason"]: "invalid"
                };
              }
            }
          }
        }
      }
    } catch (v_82) {
      const v_83 = localStorage.getItem("appActivation");
      if (v_83 === v_77) {
        isActivated = true;
        return {
          ["valid"]: true,
          ["key"]: v_77,
          ["offline"]: true
        };
      }
      return {
        ["valid"]: false,
        ["reason"]: "network",
        ["keepLicense"]: true
      };
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
      if (v_85.reason === "subscription_required" || v_85.subscription_required) {
        isActivated = true;
        setSubscriptionDue(true);
        return v_85;
      }
      if (v_85.reason === "banned") {
        clearLicenseStorage();
        return v_85;
      }
      if (v_85.reason === "wrong_project") {
        clearLicenseStorage();
        return v_85;
      }
      if (v_85.reason === "limit") {
        clearLicenseStorage();
        return v_85;
      }
      if (v_85.reason === "invalid") {
        clearLicenseStorage();
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
      ["html"]: `${"\n        <div style=\"font-family: 'Roboto', sans-serif;\n                    text-align: center;\n                    background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98));\n                    padding: 20px;\n                    border-radius: 15px;\n                    box-shadow: 0 15px 40px rgba(0,0,0,0.5);\">\n          \n          <div style=\"background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);\n                      padding: 2px;\n                      border-radius: 12px;\n                      margin-bottom: 15px;\">\n            <div style=\"background: rgba(30, 11, 54, 0.95);\n                        padding: 15px;\n                        border-radius: 10px;\">\n              <div style=\"display: flex; align-items: center; justify-content: center; margin-bottom: 8px;\">\n                <div style=\"width: 50px; height: 50px;\n                            background: linear-gradient(135deg, #ff6b6b, #ee5a6f);\n                            border-radius: 50%;\n                            display: flex;\n                            align-items: center;\n                            justify-content: center;\n                            box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);\">\n                  <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"white\">\n                    <path d=\"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z\"/>\n                  </svg>\n                </div>\n              </div>\n              <h2 style=\"color: #fff; margin: 0; font-size: 16px; font-weight: 700;\n                         background: linear-gradient(to right, #ff6b6b, #ee5a6f);\n                         -webkit-background-clip: text;\n                         -webkit-text-fill-color: transparent;\">\n                Device Limit Reached\n              </h2>\n            </div>\n          </div>\n          \n          <div style=\"background: rgba(255, 107, 107, 0.15);\n                      padding: 15px;\n                      margin: 15px 0;\n                      border-radius: 10px;\n                      text-align: left;\n                      backdrop-filter: blur(10px);\">\n            <p style=\"margin: 0; font-size: 15px; color: #fff; line-height: 1.5; font-weight: 700;\">\n              <strong style=\"color: #ff6b6b;\">Maximum Devices Used!</strong>\n            </p>\n            <p style=\"margin: 10px 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;\">\n              Your license has reached the maximum device limit.\n            </p>\n            <div style=\"background: rgba(255, 107, 107, 0.2);\n                        padding: 12px;\n                        border-radius: 8px;\n                        margin: 12px 0;\">\n              <p style=\"margin: 0; font-size: 14px; color: #fff; font-weight: 700;\">\n                Used: <span style=\"color: #ff6b6b;\">"}${v_87}${"</span> / <span style=\"color: #ee5a6f;\">"}${v_86}${"</span> Devices\n              </p>\n            </div>\n            <p style=\"margin: 8px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;\">\n              <strong style=\"color: #00d9ff;\">Solution:</strong> If you have shared your license with another person, please stop them from using it first. Sharing licenses is strictly prohibited - this license is for your personal use only. Once the other device is disconnected, you will be able to use it properly.\n            </p>\n          </div>\n          \n          <div style=\"background: rgba(249, 0, 255, 0.1);\n                      padding: 15px;\n                      border-radius: 10px;\n                      margin-bottom: 8px;\">\n            <div style=\"display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;\">\n              <img src=\"https://i.postimg.cc/MKRyMcR4/Screenshot-20260214-100336-Gallery-(1).jpg\"\n                   style=\"width: 22px; height: 22px; border-radius: 50%; object-fit: cover;\"\n                   alt=\"Telegram\">\n              <p style=\"margin: 0; font-size: 15px; color: #fff; font-weight: 600;\">\n                Contact for Upgrade\n              </p>\n            </div>\n            <a href=\"https://t.me/traderjisanx\"\n               target=\"_blank\"\n               style=\"display: inline-block;\n                      color: #f900ff;\n                      font-weight: 700;\n                      text-decoration: none;\n                      font-size: 14px;\n                      padding: 10px 20px;\n                      background: rgba(249, 0, 255, 0.2);\n                      border-radius: 8px;\n                      transition: all 0.3s ease;\">\n              @traderjisanx\n            </a>\n          </div>\n        </div>\n      "}`,
      ["showConfirmButton"]: true,
      ["showCancelButton"]: true,
      ["confirmButtonText"]: "Contact Developer",
      ["cancelButtonText"]: "Close",
      ["confirmButtonColor"]: "#ff6b6b",
      ["cancelButtonColor"]: "#ee5a6f",
      ["allowOutsideClick"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex",
        ["popup"]: "custom-popup-style",
        ["confirmButton"]: "custom-button-style",
        ["cancelButton"]: "custom-button-style"
      },
      ["didOpen"]: () => {
        const v_88 = document.createElement("style");
        v_88.textContent = `${"\n          .custom-popup-style {\n            border-radius: 20px !important;\n            padding: 0 !important;\n          }\n          .custom-button-style {\n            font-family: 'Roboto', sans-serif !important;\n            font-weight: 600 !important;\n            padding: 12px 30px !important;\n            border-radius: 10px !important;\n            font-size: 15px !important;\n            transition: all 0.3s ease !important;\n            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;\n          }\n          .custom-button-style:hover {\n            transform: translateY(-2px) !important;\n            box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important;\n          }\n        "}`;
        document.head.appendChild(v_88);
      }
    }).then(v_89 => {
      if (v_89.isConfirmed) {
        window.open("https://t.me/traderjisanx", "_blank");
      }
    });
  }
  function showWrongProjectAlert(v_90, v_91) {
    let v_92 = v_91 || "UNKNOWN";
    Swal.fire({
      ["icon"]: "error",
      ["title"]: "🚫 Wrong Project License",
      ["html"]: `${"<div style=\"text-align: center; font-family: Arial, sans-serif;\">\n               <div style=\"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); \n                           padding: 20px; \n                           border-radius: 12px; \n                           margin-bottom: 20px;\n                           box-shadow: 0 4px 15px rgba(0,0,0,0.2);\">\n                 <h2 style=\"color: #fff; margin: 0; font-size: 22px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);\">\n                   ⚠️ License Mismatch Detected\n                 </h2>\n               </div>\n               \n               <div style=\"background: #fff3cd; \n                           border-left: 5px solid #ffc107; \n                           padding: 15px; \n                           margin: 20px 0; \n                           border-radius: 8px;\n                           text-align: left;\">\n                 <p style=\"margin: 0; font-size: 15px; color: #856404;\">\n                   <strong>📌 Issue:</strong> This license token is not for <span style=\"color: #d32f2f; font-weight: bold; font-size: 17px;\">QUOTEX</span>\n                 </p>\n                 <p style=\"margin: 10px 0 0 0; font-size: 15px; color: #856404;\">\n                   <strong>🔑 This is for:</strong> <span style=\"color: #1976d2; font-weight: bold; font-size: 17px; text-transform: uppercase;\">"}${v_92}${"</span>\n                 </p>\n               </div>\n               \n               <div style=\"background: #e8f5e9; \n                           border-left: 5px solid #4caf50; \n                           padding: 15px; \n                           margin: 20px 0; \n                           border-radius: 8px;\n                           text-align: left;\">\n                 <p style=\"margin: 0; font-size: 15px; color: #2e7d32;\">\n                   <strong>✅ Solution:</strong> Please use a valid <span style=\"color: #d32f2f; font-weight: bold;\">QUOTEX</span> license key.\n                 </p>\n               </div>\n               \n               <div style=\"margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;\">\n                 <p style=\"margin: 0; font-size: 14px; color: #555;\">\n                   Need help? Contact: \n                   <a href=\"https://t.me/traderjisanx\" \n                      target=\"_blank\" \n                      style=\"color: #0088cc; \n                             font-weight: bold; \n                             text-decoration: none;\n                             font-size: 14px;\">\n                     📱 @traderjisanx\n                   </a>\n                 </p>\n               </div>\n             </div>"}`,
      ["confirmButtonText"]: "✓ Understood",
      ["confirmButtonColor"]: "#667eea",
      ["allowOutsideClick"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex",
        ["popup"]: "animated-popup",
        ["confirmButton"]: "animated-button"
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
      ["html"]: "This license has been <strong>blocked</strong> by the administrator.<br>It will not work until the admin Activates it manually.<br>Contact the developer on Telegram.",
      ["confirmButtonColor"]: "#e74c3c",
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      }
    });
  }
  function showLicenseRequiredAlert() {
    Swal.fire({
      ["title"]: "",
      ["html"]: `${"\n        <div style=\"font-family: 'Roboto', sans-serif; \n                    text-align: center;\n                    background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98));\n                    padding: 20px;\n                    border-radius: 15px;\n                    box-shadow: 0 15px 40px rgba(0,0,0,0.5);\">\n          \n          <div style=\"background: linear-gradient(135deg, #f900ff 0%, #00d9ff 100%);\n                      padding: 2px;\n                      border-radius: 12px;\n                      margin-bottom: 15px;\">\n            <div style=\"background: rgba(30, 11, 54, 0.95);\n                        padding: 15px;\n                        border-radius: 10px;\">\n              <div style=\"display: flex; align-items: center; justify-content: center; margin-bottom: 8px;\">\n                <div style=\"width: 50px; height: 50px;\n                            background: linear-gradient(135deg, #f900ff, #00d9ff);\n                            border-radius: 50%;\n                            display: flex;\n                            align-items: center;\n                            justify-content: center;\n                            box-shadow: 0 0 20px rgba(249, 0, 255, 0.5);\">\n                  <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"white\">\n                    <path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z\"/>\n                  </svg>\n                </div>\n              </div>\n              <h2 style=\"color: #fff; margin: 0; font-size: 16px; font-weight: 700; \n                         background: linear-gradient(to right, #f900ff, #00d9ff);\n                         -webkit-background-clip: text;\n                         -webkit-text-fill-color: transparent;\n                         text-shadow: none;\">\n                Invalid License Key\n              </h2>\n            </div>\n          </div>\n          \n          <div style=\"background: rgba(255, 51, 102, 0.15);\n                      padding: 15px;\n                      margin: 15px 0;\n                      border-radius: 10px;\n                      text-align: left;\n                      backdrop-filter: blur(10px);\">\n            <p style=\"margin: 0; font-size: 15px; color: #fff; line-height: 1.5; font-weight: 700;\">\n              <strong style=\"color: #ff3366;\">Invalid License!</strong>\n            </p>\n            <p style=\"margin: 10px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;\">\n              You have not purchased a valid license yet. Without purchasing a license, you cannot use this service. Please buy an official license from the developer to get access.\n            </p>\n            <p style=\"margin: 8px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.85); line-height: 1.5;\">\n              <strong style=\"color: #ff3366;\">Important:</strong> Purchase only from the official developer to avoid scams.\n            </p>\n          </div>\n          \n          <div style=\"background: rgba(249, 0, 255, 0.1);\n                      padding: 15px;\n                      border-radius: 10px;\n                      margin-bottom: 8px;\">\n            <div style=\"display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;\">\n              <img src=\"https://i.postimg.cc/MKRyMcR4/Screenshot-20260214-100336-Gallery-(1).jpg\" \n                   style=\"width: 22px; height: 22px; border-radius: 50%; object-fit: cover;\" \n                   alt=\"Telegram\">\n              <p style=\"margin: 0; font-size: 15px; color: #fff; font-weight: 600;\">\n                Developer Contact\n              </p>\n            </div>\n            <a href=\"https://t.me/traderjisanx\" \n               target=\"_blank\" \n               style=\"display: inline-block;\n                      color: #f900ff;\n                      font-weight: 700;\n                      text-decoration: none;\n                      font-size: 14px;\n                      padding: 10px 20px;\n                      background: rgba(249, 0, 255, 0.2);\n                      border-radius: 8px;\n                      transition: all 0.3s ease;\">\n              @traderjisanx\n            </a>\n          </div>\n        </div>\n      "}`,
      ["showConfirmButton"]: true,
      ["showCancelButton"]: true,
      ["confirmButtonText"]: "Contact Developer",
      ["cancelButtonText"]: "Try Again",
      ["confirmButtonColor"]: "#667eea",
      ["cancelButtonColor"]: "#764ba2",
      ["allowOutsideClick"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex",
        ["popup"]: "custom-popup-style",
        ["confirmButton"]: "custom-button-style",
        ["cancelButton"]: "custom-button-style"
      },
      ["didOpen"]: () => {
        const v_93 = document.createElement("style");
        v_93.textContent = `${"\n          .custom-popup-style {\n            border-radius: 20px !important;\n            padding: 0 !important;\n          }\n          .custom-button-style {\n            font-family: 'Roboto', sans-serif !important;\n            font-weight: 600 !important;\n            padding: 12px 30px !important;\n            border-radius: 10px !important;\n            font-size: 15px !important;\n            transition: all 0.3s ease !important;\n            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;\n          }\n          .custom-button-style:hover {\n            transform: translateY(-2px) !important;\n            box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important;\n          }\n        "}`;
        document.head.appendChild(v_93);
      }
    }).then(v_94 => {
      if (v_94.isConfirmed) {
        window.open("https://t.me/traderjisanx", "_blank");
      }
    });
  }
  function showNetworkErrorAlert() {
    Swal.fire({
      ["title"]: "",
      ["html"]: `${"\n        <div style=\"font-family: 'Roboto', sans-serif;\n                    text-align: center;\n                    background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98));\n                    padding: 20px;\n                    border-radius: 15px;\n                    box-shadow: 0 15px 40px rgba(0,0,0,0.5);\">\n          \n          <div style=\"background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);\n                      padding: 2px;\n                      border-radius: 12px;\n                      margin-bottom: 15px;\">\n            <div style=\"background: rgba(30, 11, 54, 0.95);\n                        padding: 15px;\n                        border-radius: 10px;\">\n              <div style=\"display: flex; align-items: center; justify-content: center; margin-bottom: 8px;\">\n                <div style=\"width: 50px; height: 50px;\n                            background: linear-gradient(135deg, #ff6b6b, #ee5a6f);\n                            border-radius: 50%;\n                            display: flex;\n                            align-items: center;\n                            justify-content: center;\n                            box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);\">\n                  <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"white\">\n                    <path d=\"M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z\"/>\n                  </svg>\n                </div>\n              </div>\n              <h2 style=\"color: #fff; margin: 0; font-size: 16px; font-weight: 700;\n                         background: linear-gradient(to right, #ff6b6b, #ee5a6f);\n                         -webkit-background-clip: text;\n                         -webkit-text-fill-color: transparent;\">\n                Connection Error\n              </h2>\n            </div>\n          </div>\n          \n          <div style=\"background: rgba(245, 87, 108, 0.15);\n                      padding: 15px;\n                      margin: 15px 0;\n                      border-radius: 10px;\n                      text-align: left;\n                      backdrop-filter: blur(10px);\">\n            <p style=\"margin: 0; font-size: 14px; color: #fff; line-height: 1.5; font-weight: 600;\">\n              <strong style=\"color: #f5576c;\">Network Issue:</strong> Could not verify license due to connection problems.\n            </p>\n            <p style=\"margin: 10px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;\">\n              <strong style=\"color: #ff6b6b;\">Try:</strong> Check your internet connection and try again. If the problem persists, contact support.\n            </p>\n          </div>\n          \n          <div style=\"background: rgba(249, 0, 255, 0.1);\n                      padding: 15px;\n                      border-radius: 10px;\n                      margin-bottom: 8px;\">\n            <div style=\"display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;\">\n              <img src=\"https://i.postimg.cc/MKRyMcR4/Screenshot-20260214-100336-Gallery-(1).jpg\"\n                   style=\"width: 22px; height: 22px; border-radius: 50%; object-fit: cover;\"\n                   alt=\"Telegram\">\n              <p style=\"margin: 0; font-size: 15px; color: #fff; font-weight: 600;\">\n                Need Help?\n              </p>\n            </div>\n            <a href=\"https://t.me/traderjisanx\"\n               target=\"_blank\"\n               style=\"display: inline-block;\n                      color: #f900ff;\n                      font-weight: 700;\n                      text-decoration: none;\n                      font-size: 14px;\n                      padding: 10px 20px;\n                      background: rgba(249, 0, 255, 0.2);\n                      border-radius: 8px;\n                      transition: all 0.3s ease;\">\n              @traderjisanx\n            </a>\n          </div>\n        </div>\n      "}`,
      ["showConfirmButton"]: true,
      ["showCancelButton"]: true,
      ["confirmButtonText"]: "📞 Contact Support",
      ["cancelButtonText"]: "🔄 Try Again",
      ["confirmButtonColor"]: "#f093fb",
      ["cancelButtonColor"]: "#f5576c",
      ["allowOutsideClick"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex",
        ["popup"]: "custom-popup-style",
        ["confirmButton"]: "custom-button-style",
        ["cancelButton"]: "custom-button-style"
      },
      ["didOpen"]: () => {
        const v_95 = document.createElement("style");
        v_95.textContent = `${"\n          .custom-popup-style {\n            border-radius: 20px !important;\n            padding: 0 !important;\n          }\n          .custom-button-style {\n            font-family: 'Roboto', sans-serif !important;\n            font-weight: 600 !important;\n            padding: 12px 30px !important;\n            border-radius: 10px !important;\n            font-size: 15px !important;\n            transition: all 0.3s ease !important;\n            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;\n          }\n          .custom-button-style:hover {\n            transform: translateY(-2px) !important;\n            box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important;\n          }\n        "}`;
        document.head.appendChild(v_95);
      }
    }).then(v_96 => {
      if (v_96.isConfirmed) {
        window.open("https://t.me/traderjisanx", "_blank");
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
  async function showPaymentModal() {
    await fetchPaymentMethods();
    getPlanPrice();
    let v_97 = "";
    let v_98 = getPlanPrice();
    const v_99 = v_100 => {
      const v_101 = "$" + Number(v_100).toFixed(2);
      const v_102 = document.getElementById("pmBinancePrice");
      const v_103 = document.getElementById("pmCryptoPrice");
      const v_104 = document.getElementById("pmBdtPrice");
      const v_105 = document.getElementById("pmTotalPrice");
      if (v_102) {
        v_102.textContent = v_101 + " USDT";
      }
      if (v_103) {
        v_103.textContent = v_101 + " USD";
      }
      if (v_104) {
        const v_106 = Math.round(Number(v_100) * Number(bdtUsdRate || 120));
        v_104.textContent = "৳" + v_106.toLocaleString("en-US") + " BDT";
      }
      if (v_105) {
        v_105.textContent = v_101;
      }
    };
    await Swal.fire({
      ["title"]: "",
      ["html"]: `${"\n        <div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center;\n                    background: #FFFFFF; padding: 0; border-radius: 16px; overflow: hidden;\">\n\n          <div style=\"background: #FAFAFA; padding: 22px 20px 18px; border-bottom: 1px solid #EAECEF;\">\n            <div style=\"width: 52px; height: 52px; border-radius: 14px; background: rgba(240,185,11,0.08); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;\">\n              <svg width=\"26\" height=\"26\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#C99400\" stroke-width=\"2.5\"><rect x=\"1\" y=\"4\" width=\"22\" height=\"16\" rx=\"2\" ry=\"2\"/><line x1=\"1\" y1=\"10\" x2=\"23\" y2=\"10\"/></svg>\n            </div>\n            <h3 style=\"color: #1E2329; font-size: 20px; font-weight: 800; margin: 4px 0;\">"}${activePlanType === "subscription" ? "Monthly Subscription" : "Choose Payment Method"}${"</h3>\n            <p style=\"color: #707A8A; font-size: 13px; margin: 0;\">"}${activePlanType === "subscription" ? "Pay monthly fee — active for 30 days" : "Select how you want to pay"}${"</p>\n            <p style=\"color: #1E2329; font-size: 22px; font-weight: 800; margin: 10px 0 0;\">\n              <span id=\"pmTotalPrice\">$"}${v_98.toFixed(2)}${"</span>\n            </p>\n          </div>\n\n          <div style=\"padding: 20px;\">\n            <div id=\"pmDiscountBadge\" style=\"display:none; background: rgba(249, 115, 22, 0.12); padding: 10px; border-radius: 8px; margin-bottom: 12px; border: 1px solid rgba(249, 115, 22, 0.25); text-align:left;\">\n              <p style=\"color: #ea580c; font-size: 13px; margin: 0; font-weight: 600;\" id=\"pmDiscountText\"></p>\n            </div>\n\n            "}${paymentMethodsStatus.binance ? `${"\n            <button id=\"pmSelectBinance\" style=\"display:flex;width:100%;padding:16px 18px;background:#FFFFFF;border:1.5px solid #EAECEF;border-radius:14px;color:#1E2329;cursor:pointer;align-items:center;gap:14px;margin-bottom:12px;transition:all 0.2s;\">\n              <div style=\"width:48px;height:48px;border-radius:12px;background:rgba(240,185,11,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;\">\n                <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"#F0B90B\"><path d=\"M12 2L7.5 6.5L9.62 8.62L12 6.24L14.38 8.62L16.5 6.5L12 2ZM2 12L6.5 7.5L8.62 9.62L6.24 12L8.62 14.38L6.5 16.5L2 12ZM22 12L17.5 16.5L15.38 14.38L17.76 12L15.38 9.62L17.5 7.5L22 12ZM12 22L16.5 17.5L14.38 15.38L12 17.76L9.62 15.38L7.5 17.5L12 22ZM12 15.38L14.38 12L12 8.62L9.62 12L12 15.38Z\"/></svg>\n              </div>\n              <div style=\"text-align:left;flex:1;\">\n                <div style=\"font-weight:700;font-size:15px;color:#1E2329;\">Binance Pay</div>\n                <div style=\"color:#707A8A;font-size:12px;margin-top:2px;\">Pay with USDT via Binance</div>\n                <div id=\"pmBinancePrice\" style=\"color:#C99400;font-size:13px;font-weight:700;margin-top:4px;\">$"}${v_98.toFixed(2)}${" USDT</div>\n              </div>\n              <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#AEB4BC\" stroke-width=\"2\"><polyline points=\"9 18 15 12 9 6\"/></svg>\n            </button>\n            "}` : ""}${"\n\n            "}${paymentMethodsStatus.crypto ? `${"\n            <button id=\"pmSelectCrypto\" style=\"display:flex;width:100%;padding:16px 18px;background:#FFFFFF;border:1.5px solid #EAECEF;border-radius:14px;color:#1E2329;cursor:pointer;align-items:center;gap:14px;margin-bottom:16px;transition:all 0.2s;\">\n              <div style=\"width:48px;height:48px;border-radius:12px;background:rgba(2,192,118,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;\">\n                <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"#02C076\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><text x=\"12\" y=\"16\" text-anchor=\"middle\" font-size=\"12\" fill=\"#fff\" font-weight=\"bold\">$</text></svg>\n              </div>\n              <div style=\"text-align:left;flex:1;\">\n                <div style=\"font-weight:700;font-size:15px;color:#1E2329;\">Crypto</div>\n                <div style=\"color:#707A8A;font-size:12px;margin-top:2px;\">Pay with Crypto via OxaPay</div>\n                <div id=\"pmCryptoPrice\" style=\"color:#03A66D;font-size:13px;font-weight:700;margin-top:4px;\">$"}${v_98.toFixed(2)}${" USD</div>\n              </div>\n              <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#AEB4BC\" stroke-width=\"2\"><polyline points=\"9 18 15 12 9 6\"/></svg>\n            </button>\n            "}` : ""}${"\n\n            "}${paymentMethodsStatus.bdt ? `${"\n            <button id=\"pmSelectBdt\" style=\"display:flex;width:100%;padding:16px 18px;background:#FFFFFF;border:1.5px solid #EAECEF;border-radius:14px;color:#1E2329;cursor:pointer;align-items:center;gap:14px;margin-bottom:16px;transition:all 0.2s;\">\n              <div style=\"width:48px;height:48px;border-radius:12px;background:rgba(6,95,70,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;\">\n                <span style=\"font-weight:900;font-size:18px;color:#065F46;\">৳</span>\n              </div>\n              <div style=\"text-align:left;flex:1;\">\n                <div style=\"font-weight:700;font-size:15px;color:#1E2329;\">BDT TAKA</div>\n                <div style=\"color:#707A8A;font-size:12px;margin-top:2px;\">Pay with Bangladeshi Taka (৳"}${Number(bdtUsdRate || 120)}${" = $1)</div>\n                <div id=\"pmBdtPrice\" style=\"color:#065F46;font-size:13px;font-weight:700;margin-top:4px;\">৳"}${Math.round(Number(v_98) * Number(bdtUsdRate || 120)).toLocaleString("en-US")}${" BDT</div>\n              </div>\n              <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#AEB4BC\" stroke-width=\"2\"><polyline points=\"9 18 15 12 9 6\"/></svg>\n            </button>\n            "}` : ""}${"\n\n            "}${!paymentMethodsStatus.binance && !paymentMethodsStatus.crypto && !paymentMethodsStatus.bdt ? "<p style=\"color:#CF304A;font-size:14px;\">No payment methods are currently available. Please contact developer.</p>" : ""}${"\n\n            <div style=\"margin-top: 4px; padding-top: 16px; border-top: 1px solid #EAECEF; text-align: left;\">\n              <label style=\"color: #1E2329; font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;\">Coupon Code</label>\n              <div style=\"display: flex; gap: 8px;\">\n                <input type=\"text\" id=\"pmCouponInput\" placeholder=\"Enter coupon code\"\n                       style=\"flex: 1; padding: 11px 12px; border: 1.5px solid #EAECEF;\n                              border-radius: 10px; background: #F8FAFC; color: #1E2329;\n                              font-size: 13px; outline: none; box-sizing: border-box;\">\n                <button id=\"pmApplyCouponBtn\" type=\"button\"\n                        style=\"padding: 11px 16px; background: linear-gradient(135deg, #f97316, #ea580c);\n                               border: none; border-radius: 10px; color: white; font-weight: 700;\n                               cursor: pointer; font-size: 12px; white-space: nowrap;\">Apply</button>\n              </div>\n              <p id=\"pmCouponMessage\" style=\"font-size: 11px; margin-top: 6px; color: #707A8A;\"></p>\n            </div>\n          </div>\n        </div>\n      "}`,
      ["showConfirmButton"]: false,
      ["showCancelButton"]: true,
      ["cancelButtonText"]: "Back",
      ["cancelButtonColor"]: "#707A8A",
      ["allowOutsideClick"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex",
        ["popup"]: "custom-popup-style"
      },
      ["didOpen"]: () => {
        const v_107 = document.getElementById("pmApplyCouponBtn");
        if (v_107) {
          v_107.addEventListener("click", async () => {
            const v_108 = document.getElementById("pmCouponInput");
            const v_109 = document.getElementById("pmCouponMessage");
            const v_110 = document.getElementById("pmDiscountBadge");
            const v_111 = document.getElementById("pmDiscountText");
            const v_112 = v_108.value.trim();
            if (!v_112) {
              v_109.textContent = "Please enter a coupon code";
              v_109.style.color = "#ef4444";
              return;
            }
            v_109.textContent = "Validating...";
            v_109.style.color = "#f97316";
            try {
              const v_113 = await fetch(URL_VALIDATE_COUPON, {
                ["method"]: "POST",
                ["headers"]: {
                  ["Content-Type"]: "application/json"
                },
                ["body"]: JSON.stringify({
                  ["code"]: v_112,
                  ["purpose"]: activePlanType,
                  ["project_type"]: PROJECT_TYPE
                })
              });
              const v_114 = await v_113.json();
              if (v_114.success) {
                v_98 = v_114.final_price;
                v_97 = v_112;
                appliedCouponCode = v_112;
                currentPlanPrice = v_98;
                v_99(v_98);
                v_109.textContent = "Coupon applied!";
                v_109.style.color = "#10b981";
                v_110.style.display = "block";
                v_111.textContent = "Discount: -$" + v_114.discount + " applied!";
              } else {
                v_109.textContent = v_114.message;
                v_109.style.color = "#ef4444";
              }
            } catch (v_115) {
              v_109.textContent = "Error validating coupon";
              v_109.style.color = "#ef4444";
            }
          });
        }
        const v_116 = v_117 => {
          appliedCouponCode = v_97;
          currentPlanPrice = v_98;
          Swal.close();
          if (v_117 === "binance") {
            initiateBinancePayment();
          } else {
            if (v_117 === "bdt") {
              createBdtOrder();
            } else {
              createDirectCryptoInvoice();
            }
          }
        };
        const v_118 = document.getElementById("pmSelectBinance");
        const v_119 = document.getElementById("pmSelectCrypto");
        const v_120 = document.getElementById("pmSelectBdt");
        if (v_118) {
          v_118.addEventListener("mouseover", () => {
            v_118.style.borderColor = "#F0B90B";
            v_118.style.background = "#FEF6D8";
          });
          v_118.addEventListener("mouseout", () => {
            v_118.style.borderColor = "#EAECEF";
            v_118.style.background = "#FFFFFF";
          });
          v_118.addEventListener("click", () => v_116("binance"));
        }
        if (v_119) {
          v_119.addEventListener("mouseover", () => {
            v_119.style.borderColor = "#02C076";
            v_119.style.background = "#E6F9F0";
          });
          v_119.addEventListener("mouseout", () => {
            v_119.style.borderColor = "#EAECEF";
            v_119.style.background = "#FFFFFF";
          });
          v_119.addEventListener("click", () => v_116("crypto"));
        }
        if (v_120) {
          v_120.addEventListener("mouseover", () => {
            v_120.style.borderColor = "#065F46";
            v_120.style.background = "#ECFDF5";
          });
          v_120.addEventListener("mouseout", () => {
            v_120.style.borderColor = "#EAECEF";
            v_120.style.background = "#FFFFFF";
          });
          v_120.addEventListener("click", () => v_116("bdt"));
        }
      }
    });
  }
  let activePendingOrder = null;
  let orderPollingIntervalId = null;
  let orderCountdownTimerId = null;
  const STORAGE_KEY_PENDING_ORDER = "pendingBinanceOrder";
  const PENDING_ORDER_TIMEOUT_MS = 7200000;
  function savePendingOrder(v_121) {
    try {
      const v_122 = JSON.parse(localStorage.getItem(STORAGE_KEY_PENDING_ORDER) || "{}");
      const v_123 = Object.assign({}, v_122, v_121 || {}, {
        ["updated_at"]: Date.now()
      });
      localStorage.setItem(STORAGE_KEY_PENDING_ORDER, JSON.stringify(v_123));
    } catch (v_124) {}
  }
  function clearPendingOrder() {
    localStorage.removeItem(STORAGE_KEY_PENDING_ORDER);
    stopOrderTimers();
  }
  function stopOrderTimers() {
    if (orderPollingIntervalId) {
      clearInterval(orderPollingIntervalId);
      orderPollingIntervalId = null;
    }
    if (orderCountdownTimerId) {
      clearInterval(orderCountdownTimerId);
      orderCountdownTimerId = null;
    }
  }
  function formatCountdown(v_125) {
    const v_126 = Math.max(0, Math.floor(Number(v_125) || 0));
    const v_127 = Math.floor(v_126 / 3600);
    const v_128 = Math.floor(v_126 % 3600 / 60);
    const v_129 = v_126 % 60;
    const v_130 = v_131 => String(v_131).padStart(2, "0");
    return v_130(v_127) + ":" + v_130(v_128) + ":" + v_130(v_129);
  }
  function calculateRemainingSeconds(v_132) {
    if (!v_132) {
      return 0;
    }
    if (v_132.expires_in_seconds != null && v_132.expires_in_seconds !== "") {
      return Math.max(0, Number(v_132.expires_in_seconds) || 0);
    }
    if (v_132.expires_at) {
      try {
        const v_133 = new Date(String(v_132.expires_at).trim().replace(" ", "T") + "+06:00");
        if (!isNaN(v_133.getTime())) {
          return Math.max(0, Math.floor((v_133.getTime() - Date.now()) / 1000));
        }
      } catch (v_134) {}
    }
    if (v_132.created_at_ms) {
      return Math.max(0, Math.floor((Number(v_132.created_at_ms) + PENDING_ORDER_TIMEOUT_MS - Date.now()) / 1000));
    }
    return 7200;
  }
  function parseOrderExpiry(v_135) {
    if (!v_135) {
      return 0;
    }
    try {
      const v_136 = String(v_135).trim().replace(" ", "T");
      const v_137 = new Date(v_136 + "+06:00");
      if (isNaN(v_137.getTime())) {
        return 0;
      }
      return v_137.getTime() - 120000;
    } catch (v_138) {
      return 0;
    }
  }
  async function checkOrderStatus(v_139) {
    try {
      const [v_140, v_141] = await Promise.all([fetch(URL_BINANCE_ORDER_STATUS, {
        ["method"]: "POST",
        ["headers"]: {
          ["Content-Type"]: "application/json"
        },
        ["body"]: JSON.stringify({
          ["order_id"]: v_139
        })
      }), fetch(URL_BINANCE_INFO)]);
      const v_142 = await v_140.json();
      const v_143 = await v_141.json();
      if (!v_142.success) {
        clearPendingOrder();
        return false;
      }
      if (v_142.status === "completed" && v_142.license_key) {
        localStorage.setItem("appActivation", v_142.license_key);
        localStorage.setItem("lastVerified", Date.now());
        clearPendingOrder();
        return "completed";
      }
      if (v_142.status === "subscription_complete") {
        clearPendingOrder();
        activePlanType = "permanent";
        return "subscription_complete";
      }
      if (v_142.status === "paid") {
        clearPendingOrder();
        if (activePlanType === "subscription" || v_142.purpose === "subscription") {
          await confirmMonthlySubscription(v_139);
        } else {
          await promptMonthlyBinanceOrder(v_139);
        }
        return "paid";
      }
      if (v_142.status === "failed" || v_142.status === "expired") {
        clearPendingOrder();
        return false;
      }
      if (!v_143.enabled || !v_143.uid) {
        return false;
      }
      if (!v_142.payment_note) {
        clearPendingOrder();
        return false;
      }
      if (Number(v_142.expires_in_seconds || 0) <= 0 && v_142.expires_at) {
        clearPendingOrder();
        return false;
      }
      const v_144 = Number(v_142.paid_amount || 0);
      const v_145 = String(v_142.purpose || "permanent").toLowerCase();
      if (isPriceDiscrepant(v_142.amount, v_144)) {
        clearPendingOrder();
        return false;
      }
      if (v_144 <= 0.01 && v_145 !== String(activePlanType || "permanent").toLowerCase()) {
        clearPendingOrder();
        return false;
      }
      activePendingOrder = {
        ["order_id"]: v_139,
        ["amount"]: Number(v_142.amount),
        ["paid_so_far"]: v_144,
        ["remaining"]: Number(v_142.remaining ?? Math.max(0, v_142.amount - v_144)),
        ["uid"]: v_143.uid,
        ["account_name"]: v_143.account_name,
        ["order_created_at"]: v_142.created_at || "",
        ["payment_note"]: v_142.payment_note,
        ["expires_at"]: v_142.expires_at || "",
        ["expires_in_seconds"]: Number(v_142.expires_in_seconds || 0),
        ["created_at_ms"]: Date.now(),
        ["purpose"]: v_145
      };
      savePendingOrder({
        ["order_id"]: v_139,
        ["amount"]: v_142.amount,
        ["paid_so_far"]: activePendingOrder.paid_so_far,
        ["remaining"]: activePendingOrder.remaining,
        ["payment_note"]: v_142.payment_note,
        ["expires_at"]: v_142.expires_at || "",
        ["order_created_at"]: v_142.created_at || "",
        ["purpose"]: v_145,
        ["created_at"]: Date.now()
      });
      return "checkout";
    } catch (v_146) {
      console.error("[BinancePay] Resume error:", v_146);
      return false;
    }
  }
  async function initiateBinancePayment() {
    stopOrderTimers();
    await fetchPaymentMethods();
    getPlanPrice();
    try {
      const v_147 = localStorage.getItem(STORAGE_KEY_PENDING_ORDER);
      if (v_147) {
        const v_148 = JSON.parse(v_147);
        const v_149 = Date.now() - Number(v_148.updated_at || v_148.created_at || 0);
        const v_150 = String(v_148.purpose || "").toLowerCase();
        if (isPriceDiscrepant(v_148.amount, v_148.paid_so_far) || Number(v_148.paid_so_far || 0) <= 0.01 && v_150 && v_150 !== String(activePlanType || "permanent").toLowerCase()) {
          clearPendingOrder();
        } else {
          if (v_148.order_id && v_149 < PENDING_ORDER_TIMEOUT_MS) {
            Swal.fire({
              ["title"]: "Resuming Payment...",
              ["html"]: "<div style=\"color: rgba(255,255,255,0.8);\">Checking your previous Binance payment...</div>",
              ["allowOutsideClick"]: false,
              ["showConfirmButton"]: false,
              ["customClass"]: {
                ["container"]: "swal-high-zindex"
              },
              ["didOpen"]: () => {
                Swal.showLoading();
              }
            });
            const v_151 = await checkOrderStatus(v_148.order_id);
            Swal.close();
            if (v_151 === "completed" || v_151 === "paid") {
              return;
            }
            if (v_151 === "checkout") {
              renderOrderModal();
              return;
            }
          } else {
            if (v_149 >= PENDING_ORDER_TIMEOUT_MS) {
              clearPendingOrder();
            }
          }
        }
      }
    } catch (v_152) {}
    Swal.close();
    Swal.fire({
      ["title"]: "Creating Binance Payment...",
      ["html"]: "<div style=\"color: rgba(255,255,255,0.8);\">Setting up your payment...</div>",
      ["allowOutsideClick"]: false,
      ["showConfirmButton"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      },
      ["didOpen"]: () => {
        Swal.showLoading();
      }
    });
    try {
      const [v_153, v_154] = await Promise.all([fetch(URL_CREATE_BINANCE_ORDER, {
        ["method"]: "POST",
        ["headers"]: {
          ["Content-Type"]: "application/json"
        },
        ["body"]: JSON.stringify({
          ["coupon_code"]: appliedCouponCode,
          ["purpose"]: activePlanType,
          ["project_type"]: PROJECT_TYPE,
          ["license_key"]: activePlanType === "subscription" ? activeLicenseKey || localStorage.getItem("appActivation") || "" : ""
        })
      }), fetch(URL_BINANCE_INFO)]);
      const v_155 = await v_153.json();
      const v_156 = await v_154.json();
      if (!v_155.success) {
        Swal.fire({
          ["icon"]: "error",
          ["title"]: "Error",
          ["text"]: v_155.message || "Failed to create order.",
          ["customClass"]: {
            ["container"]: "swal-high-zindex"
          }
        });
        return;
      }
      if (!v_156.enabled) {
        Swal.fire({
          ["icon"]: "error",
          ["title"]: "Binance Pay Disabled",
          ["text"]: "Binance Pay is currently disabled. Please try Crypto payment.",
          ["customClass"]: {
            ["container"]: "swal-high-zindex"
          }
        });
        return;
      }
      if (!v_156.uid) {
        Swal.fire({
          ["icon"]: "error",
          ["title"]: "Not Configured",
          ["text"]: "Binance Pay is not configured. Please contact support.",
          ["customClass"]: {
            ["container"]: "swal-high-zindex"
          }
        });
        return;
      }
      if (!v_155.payment_note) {
        Swal.fire({
          ["icon"]: "error",
          ["title"]: "Error",
          ["text"]: "Server did not return payment note. Please reload app.py on PythonAnywhere.",
          ["customClass"]: {
            ["container"]: "swal-high-zindex"
          }
        });
        return;
      }
      currentPlanPrice = Number(v_155.amount);
      activePendingOrder = {
        ["order_id"]: v_155.order_id,
        ["amount"]: v_155.amount,
        ["paid_so_far"]: 0,
        ["remaining"]: v_155.amount,
        ["uid"]: v_156.uid,
        ["account_name"]: v_156.account_name,
        ["order_created_at"]: v_155.created_at || "",
        ["payment_note"]: v_155.payment_note,
        ["expires_at"]: v_155.expires_at || "",
        ["expires_in_seconds"]: Number(v_155.expires_in_seconds || 7200),
        ["created_at_ms"]: Date.now(),
        ["purpose"]: v_155.purpose || activePlanType
      };
      savePendingOrder({
        ["order_id"]: v_155.order_id,
        ["amount"]: v_155.amount,
        ["paid_so_far"]: 0,
        ["remaining"]: v_155.amount,
        ["payment_note"]: v_155.payment_note,
        ["expires_at"]: v_155.expires_at || "",
        ["order_created_at"]: v_155.created_at || "",
        ["purpose"]: v_155.purpose || activePlanType,
        ["created_at"]: Date.now()
      });
      renderOrderModal();
    } catch (v_157) {
      console.error("[BinancePay] Error:", v_157);
      Swal.fire({
        ["icon"]: "error",
        ["title"]: "Error",
        ["text"]: "Connection error. Please check your internet and try again.",
        ["customClass"]: {
          ["container"]: "swal-high-zindex"
        }
      });
    }
  }
  const YOUTUBE_TUTORIAL_ID = "tVFINN8FT6o";
  function openTutorialVideo() {
    const v_158 = YOUTUBE_TUTORIAL_ID;
    const v_159 = "https://www.youtube.com/watch?v=tVFINN8FT6o";
    const v_160 = navigator.userAgent || "";
    const v_161 = /iPhone|iPad|iPod/i.test(v_160);
    const v_162 = /Android/i.test(v_160);
    if (!v_161 && !v_162) {
      window.open(v_159, "_blank", "noopener,noreferrer");
      return;
    }
    if (v_161) {
      const v_163 = Date.now();
      window.location.href = "youtube://www.youtube.com/watch?v=tVFINN8FT6o";
      setTimeout(() => {
        if (document.visibilityState === "visible" && Date.now() - v_163 < 2000) {
          window.open(v_159, "_blank", "noopener,noreferrer");
        }
      }, 900);
      return;
    }
    window.open(v_159, "_blank", "noopener,noreferrer");
  }
  function renderOrderModal() {
    if (!activePendingOrder) {
      return;
    }
    stopOrderTimers();
    const v_164 = Number(activePendingOrder.amount || 0);
    const v_165 = Number(activePendingOrder.paid_so_far || 0);
    const v_166 = Number(activePendingOrder.remaining ?? Math.max(0, v_164 - v_165));
    const v_167 = v_165 > 0 && v_166 > 0;
    const v_168 = v_167 ? v_166 : v_164;
    const v_169 = activePendingOrder.payment_note || "";
    let v_170 = calculateRemainingSeconds(activePendingOrder);
    Swal.fire({
      ["title"]: "",
      ["html"]: `${"\n        <div id=\"binCheckoutRoot\" style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n                    background: #FFFFFF; padding: 0; border-radius: 16px; overflow: hidden; max-height: 75vh; overflow-y: auto;\">\n\n          <div style=\"background: linear-gradient(135deg, #FCD535 0%, #F0B90B 100%); padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 12px;\">\n            <div style=\"display:flex;align-items:center;gap:12px;\">\n              <svg width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"#1E2329\"><path d=\"M12 2L7.5 6.5L9.62 8.62L12 6.24L14.38 8.62L16.5 6.5L12 2ZM2 12L6.5 7.5L8.62 9.62L6.24 12L8.62 14.38L6.5 16.5L2 12ZM22 12L17.5 16.5L15.38 14.38L17.76 12L15.38 9.62L17.5 7.5L22 12ZM12 22L16.5 17.5L14.38 15.38L12 17.76L9.62 15.38L7.5 17.5L12 22ZM12 15.38L14.38 12L12 8.62L9.62 12L12 15.38Z\"/></svg>\n              <div>\n                <div style=\"font-size:18px;font-weight:800;color:#1E2329;letter-spacing:0.5px;\">Binance Pay</div>\n                <div style=\"font-size:11px;color:rgba(0,0,0,0.45);font-weight:600;\">Auto detect by Note</div>\n              </div>\n            </div>\n            <div style=\"text-align:right;\">\n              <div style=\"font-size:10px;color:rgba(0,0,0,0.5);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;\">Time Left</div>\n              <div id=\"binCountdown\" style=\"font-size:16px;font-weight:900;color:#1E2329;font-variant-numeric:tabular-nums;\">"}${formatCountdown(v_170)}${"</div>\n            </div>\n          </div>\n\n          <div style=\"padding: 20px;\">\n\n            <div style=\"background: #FAFAFA; border: 1px solid #EAECEF; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 16px;\">\n              "}${v_167 ? `${"<p style=\"color:#03A66D;font-size:12px;font-weight:700;margin:0 0 6px;\">Already paid: $"}${v_165.toFixed(2)}${" USDT</p>"}` : ""}${"\n              <p style=\"color:#707A8A;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;\">"}${v_167 ? "Remaining Amount" : "Total Amount"}${"</p>\n              <p id=\"binDisplayAmount\" style=\"font-size:36px;font-weight:900;color:#C99400;margin:0;line-height:1;\">"}${v_168}${" <span style=\"font-size:15px;color:#707A8A;font-weight:600;\">USDT</span></p>\n              <button id=\"binCopyAmount\" style=\"margin-top:10px;background:#FFFFFF;border:1px solid #EAECEF;border-radius:8px;color:#C99400;padding:6px 16px;font-size:12px;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:5px;\">\n                Copy Amount\n              </button>\n            </div>\n\n            <div style=\"background:#FAFAFA;border:1px solid #EAECEF;border-radius:14px;padding:16px;margin-bottom:16px;\">\n              <div style=\"display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;\">\n                <span style=\"color:#707A8A;font-size:12px;font-weight:600;\">Binance Pay ID</span>\n                <div style=\"display:flex;gap:6px;align-items:center;\">\n                  <button id=\"binShowQR\" type=\"button\" style=\"position:relative;background:#FFFFFF;border:1px solid #F0B90B;border-radius:8px;color:#1E2329;padding:5px 9px;font-size:11px;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:4px;overflow:visible;\">\n                    <svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\">\n                      <path d=\"M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v4h-4v-2h2v-2z\" fill=\"#F0B90B\"/>\n                    </svg>\n                    <span>QR</span>\n                    <span class=\"bin-qr-cursor\" aria-hidden=\"true\" style=\"display:inline-flex;\">\n                      <svg width=\"11\" height=\"11\" viewBox=\"0 0 24 24\" fill=\"none\">\n                        <path d=\"M5.5 3.2l13.2 7.1c.7.4.4 1.4-.4 1.4h-5.3l-2.4 6.8c-.2.7-1.3.7-1.5 0L5.5 3.2z\" fill=\"#707A8A\"/>\n                      </svg>\n                    </span>\n                  </button>\n                  <button id=\"binCopyUid\" style=\"background:#F0B90B;border:none;border-radius:8px;color:#1E2329;padding:5px 14px;font-size:11px;cursor:pointer;font-weight:800;\">Copy ID</button>\n                </div>\n              </div>\n              <p style=\"color:#1E2329;font-size:22px;font-weight:800;letter-spacing:2px;margin:0;word-break:break-all;\">"}${activePendingOrder.uid}${"</p>\n              "}${activePendingOrder.account_name ? `${"<p style=\"color:#707A8A;font-size:12px;margin:6px 0 0;\"><span style=\"color:#F0B90B;\">●</span> "}${activePendingOrder.account_name}${"</p>"}` : ""}${"\n            </div>\n\n            <div style=\"background:#FFF7E6;border:2px solid #F0B90B;border-radius:14px;padding:16px;margin-bottom:16px;text-align:center;\">\n              <p style=\"color:#C99400;font-size:12px;font-weight:800;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;\">Payment Note (Required)</p>\n              <p id=\"binPaymentNote\" style=\"color:#1E2329;font-size:28px;font-weight:900;letter-spacing:3px;margin:0 0 10px;font-family:monospace;\">"}${v_169}${"</p>\n              <button id=\"binCopyNote\" style=\"background:#1E2329;border:none;border-radius:8px;color:#F0B90B;padding:8px 18px;font-size:12px;cursor:pointer;font-weight:800;\">Copy Note</button>\n              <p style=\"color:#707A8A;font-size:11px;margin:10px 0 0;line-height:1.5;\">\n                Binance Pay → Send → put this note in <strong style=\"color:#C99400;\">Note / Remark</strong>. Payment will auto-complete.\n              </p>\n            </div>\n\n            <div id=\"binQROverlay\" style=\"display:none;position:fixed;inset:0;width:100%;height:100%;background:rgba(0,0,0,0.82);z-index:100000;align-items:center;justify-content:center;backdrop-filter:blur(6px);padding:12px;box-sizing:border-box;\">\n              <div style=\"background:#FFFFFF;border-radius:24px;padding:28px 20px 32px;max-width:min(96vw,560px);width:100%;text-align:center;position:relative;box-shadow:0 24px 80px rgba(0,0,0,0.45);\">\n                <button id=\"binCloseQR\" style=\"position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:50%;border:none;background:#F5F5F5;cursor:pointer;font-size:18px;font-weight:700;color:#1E2329;line-height:1;\">✕</button>\n                <p style=\"color:#1E2329;font-size:20px;font-weight:800;margin:12px 0 4px;\">Scan to Pay</p>\n                <p style=\"color:#707A8A;font-size:13px;margin:0 0 8px;\">Open Binance app and scan this QR</p>\n                <div style=\"background:#FAFAFA;border-radius:18px;padding:16px;border:1px solid #EAECEF;margin-top:14px;\">\n                  <img src=\"https://i.postimg.cc/139x62ZS/share-2026-07-16-16-37-56-835-jpeg-2026-07-16-16-37-56.jpg\" alt=\"Binance QR Code\" style=\"width:100%;max-width:480px;border-radius:12px;display:block;margin:0 auto;\">\n                </div>\n              </div>\n            </div>\n\n            <button type=\"button\" id=\"binWatchTutorialBtn\" style=\"width:100%;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12px;padding:12px 16px;border:none;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#FF0000 0%,#CC0000 100%);color:#fff;font-weight:800;font-size:14px;box-shadow:0 6px 18px rgba(255,0,0,0.28);\">\n              <svg width=\"22\" height=\"16\" viewBox=\"0 0 24 17\" fill=\"none\" aria-hidden=\"true\">\n                <path d=\"M23.5 2.7a3 3 0 0 0-2.1-2.1C19.5 0 12 0 12 0S4.5 0 2.6.6A3 3 0 0 0 .5 2.7 31.5 31.5 0 0 0 0 8.5a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1C4.5 17 12 17 12 17s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 8.5a31.5 31.5 0 0 0-.5-5.8z\" fill=\"#fff\"/>\n                <path d=\"M9.6 12.1V4.9l6.3 3.6-6.3 3.6z\" fill=\"#FF0000\"/>\n              </svg>\n              Watch Payment Tutorial on YouTube\n            </button>\n\n            <div style=\"background:#FAFAFA;border:1px solid #EAECEF;border-radius:14px;padding:16px;margin-bottom:16px;\">\n              <p style=\"color:#1E2329;font-weight:700;font-size:13px;margin-bottom:12px;\">How to Pay</p>\n              <div style=\"color:#474D57;font-size:12px;line-height:2.1;\">\n                <p style=\"margin:0;\">1. Open <strong>Binance App</strong> → Pay → Send</p>\n                <p style=\"margin:0;\">2. Enter Pay ID: <strong style=\"color:#C99400;\">"}${activePendingOrder.uid}${"</strong></p>\n                <p style=\"margin:0;\">3. Amount: <strong id=\"binHowToAmount\" style=\"color:#C99400;\">"}${v_168}${" USDT</strong></p>\n                <p style=\"margin:0;\">4. Note: <strong id=\"binHowToNote\" style=\"color:#03A66D;\">"}${v_169}${"</strong> (must match exactly)</p>\n                <p style=\"margin:0;\">5. Confirm & Send — detection is automatic</p>\n              </div>\n            </div>\n\n            <div style=\"background:#F0FFF4;border:1px solid #BBF7D0;border-radius:12px;padding:12px;margin-bottom:12px;text-align:center;\">\n              <p id=\"binVerifyStatus\" style=\"color:#059669;font-size:12px;margin:0;font-weight:600;\">\n                Waiting for payment... Auto-checking every few seconds.\n              </p>\n            </div>\n\n            <p style=\"color:#AEB4BC;font-size:10px;text-align:center;margin:0;\">Secured by Binance Pay · Expires in 2 hours</p>\n          </div>\n        </div>\n      "}`,
      ["showConfirmButton"]: false,
      ["showCancelButton"]: true,
      ["cancelButtonText"]: "Cancel",
      ["cancelButtonColor"]: "#CF304A",
      ["allowOutsideClick"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex",
        ["popup"]: "custom-popup-style"
      },
      ["didOpen"]: () => {
        if (!document.getElementById("binQrBtnAnimStyle")) {
          const v_171 = document.createElement("style");
          v_171.id = "binQrBtnAnimStyle";
          document.head.appendChild(v_171);
        }
        document.getElementById("binQrBtnAnimStyle").textContent = `${"\n            @keyframes binQrBtnGlow {\n              0%, 100% { box-shadow: 0 0 0 0 rgba(240,185,11,0.25); }\n              50% { box-shadow: 0 0 0 3px rgba(240,185,11,0); }\n            }\n            @keyframes binQrCursorTap {\n              0%, 100% { transform: translate(0,0); opacity: 0.75; }\n              50% { transform: translate(1px, 1px); opacity: 1; }\n            }\n            #binShowQR {\n              animation: binQrBtnGlow 2.4s ease-in-out infinite !important;\n            }\n            #binShowQR .bin-qr-cursor {\n              display: inline-flex !important;\n              animation: binQrCursorTap 1.8s ease-in-out infinite !important;\n            }\n            #binShowQR:hover {\n              background: #FFF7E6 !important;\n            }\n          "}`;
        document.getElementById("binCopyUid").addEventListener("click", () => {
          navigator.clipboard.writeText(activePendingOrder.uid).catch(() => {});
          const v_172 = document.getElementById("binCopyUid");
          v_172.textContent = "✓ Copied!";
          v_172.style.background = "#03A66D";
          v_172.style.color = "#fff";
          setTimeout(() => {
            v_172.textContent = "Copy ID";
            v_172.style.background = "#F0B90B";
            v_172.style.color = "#1E2329";
          }, 2000);
        });
        document.getElementById("binCopyAmount").addEventListener("click", () => {
          navigator.clipboard.writeText(String(v_168)).catch(() => {});
          const v_173 = document.getElementById("binCopyAmount");
          v_173.textContent = "Copied!";
          v_173.style.color = "#03A66D";
          setTimeout(() => {
            v_173.textContent = "Copy Amount";
            v_173.style.color = "#C99400";
          }, 2000);
        });
        document.getElementById("binCopyNote").addEventListener("click", () => {
          navigator.clipboard.writeText(v_169).catch(() => {});
          const v_174 = document.getElementById("binCopyNote");
          v_174.textContent = "✓ Note Copied!";
          setTimeout(() => {
            v_174.textContent = "Copy Note";
          }, 2000);
        });
        document.getElementById("binShowQR").addEventListener("click", () => {
          const v_175 = document.getElementById("binQROverlay");
          if (!v_175) {
            return;
          }
          document.body.appendChild(v_175);
          v_175.style.display = "flex";
          const v_176 = typeof Swal !== "undefined" && Swal.getCancelButton ? Swal.getCancelButton() : document.querySelector(".swal2-container .swal2-cancel");
          const v_177 = document.querySelector(".swal2-container .swal2-actions");
          if (v_176) {
            v_176.style.display = "none";
          }
          if (v_177) {
            v_177.style.display = "none";
          }
        });
        document.getElementById("binCloseQR").addEventListener("click", () => {
          const v_178 = document.getElementById("binQROverlay");
          const v_179 = document.getElementById("binCheckoutRoot");
          if (v_178) {
            v_178.style.display = "none";
            if (v_179) {
              v_179.appendChild(v_178);
            }
          }
          const v_180 = typeof Swal !== "undefined" && Swal.getCancelButton ? Swal.getCancelButton() : document.querySelector(".swal2-container .swal2-cancel");
          const v_181 = document.querySelector(".swal2-container .swal2-actions");
          if (v_180) {
            v_180.style.display = "";
          }
          if (v_181) {
            v_181.style.display = "flex";
          }
        });
        document.getElementById("binQROverlay").addEventListener("click", v_182 => {
          if (v_182.target !== v_182.currentTarget) {
            return;
          }
          document.getElementById("binCloseQR")?.["click"]?.();
        });
        document.getElementById("binWatchTutorialBtn")?.["addEventListener"]?.("click", v_183 => {
          v_183.preventDefault();
          openTutorialVideo();
        });
        const v_184 = document.getElementById("binCountdown");
        orderCountdownTimerId = setInterval(() => {
          v_170 -= 1;
          if (v_170 <= 0) {
            v_170 = 0;
            if (v_184) {
              v_184.textContent = "00:00:00";
              v_184.style.color = "#CF304A";
            }
            stopOrderTimers();
            clearPendingOrder();
            const v_185 = document.getElementById("binVerifyStatus");
            if (v_185) {
              v_185.style.color = "#CF304A";
              v_185.textContent = "Time expired (2 hours). Please start a new Binance payment.";
            }
            return;
          }
          if (v_184) {
            v_184.textContent = formatCountdown(v_170);
            if (v_170 < 600) {
              v_184.style.color = "#CF304A";
            }
          }
        }, 1000);
        startOrderPolling();
      },
      ["willClose"]: () => {
        const v_186 = document.getElementById("binQROverlay");
        if (v_186 && v_186.parentElement === document.body) {
          v_186.remove();
        }
        stopOrderTimers();
      }
    });
  }
  async function fetchOrderStatus() {
    if (!activePendingOrder) {
      return null;
    }
    const v_187 = await fetch(URL_VERIFY_BINANCE_PAYMENT, {
      ["method"]: "POST",
      ["headers"]: {
        ["Content-Type"]: "application/json"
      },
      ["body"]: JSON.stringify({
        ["system_order_id"]: activePendingOrder.order_id
      })
    });
    return await v_187.json();
  }
  function startOrderPolling() {
    if (orderPollingIntervalId) {
      clearInterval(orderPollingIntervalId);
      orderPollingIntervalId = null;
    }
    const v_188 = async () => {
      if (!activePendingOrder) {
        return;
      }
      const v_189 = document.getElementById("binVerifyStatus");
      try {
        const v_190 = await fetchOrderStatus();
        if (!v_190) {
          return;
        }
        if (v_190.status === "expired") {
          stopOrderTimers();
          clearPendingOrder();
          if (v_189) {
            v_189.style.color = "#CF304A";
            v_189.textContent = v_190.message || "Payment time expired.";
          }
          return;
        }
        if (v_190.status === "pending") {
          if (v_189) {
            const v_191 = Number(activePendingOrder.paid_so_far || 0);
            const v_192 = Number(activePendingOrder.remaining || 0);
            if (v_191 > 0 && v_192 > 0) {
              v_189.style.color = "#d97706";
              v_189.innerHTML = "You have paid <strong>$" + v_191.toFixed(2) + "</strong> USDT. " + "Remaining: <strong>$" + v_192.toFixed(2) + "</strong> USDT.<br>" + "Please pay the remaining amount using note <strong>" + (activePendingOrder.payment_note || "") + "</strong>. " + "Still waiting for payment...";
            } else {
              v_189.style.color = "#059669";
              v_189.textContent = "Waiting for payment with note " + (activePendingOrder.payment_note || "") + "...";
            }
          }
          return;
        }
        if (v_190.status === "partial") {
          const v_193 = Number(v_190.installment || 0);
          activePendingOrder.paid_so_far = Number(v_190.paid_total || v_190.total_paid || 0);
          activePendingOrder.remaining = Number(v_190.remaining || 0);
          if (v_190.payment_note) {
            activePendingOrder.payment_note = v_190.payment_note;
          }
          savePendingOrder({
            ["order_id"]: activePendingOrder.order_id,
            ["amount"]: v_190.required || activePendingOrder.amount,
            ["paid_so_far"]: activePendingOrder.paid_so_far,
            ["remaining"]: activePendingOrder.remaining,
            ["payment_note"]: activePendingOrder.payment_note,
            ["expires_at"]: activePendingOrder.expires_at,
            ["order_created_at"]: activePendingOrder.order_created_at
          });
          const v_194 = document.getElementById("binDisplayAmount");
          if (v_194) {
            v_194.innerHTML = activePendingOrder.remaining.toFixed(2) + " <span style=\"font-size:15px;color:#707A8A;font-weight:600;\">USDT</span>";
          }
          const v_195 = document.getElementById("binPaymentNote");
          if (v_195 && activePendingOrder.payment_note) {
            v_195.textContent = activePendingOrder.payment_note;
          }
          const v_196 = document.getElementById("binHowToNote");
          if (v_196 && activePendingOrder.payment_note) {
            v_196.textContent = activePendingOrder.payment_note;
          }
          const v_197 = document.getElementById("binHowToAmount");
          if (v_197) {
            v_197.textContent = activePendingOrder.remaining.toFixed(2) + " USDT";
          }
          if (v_189) {
            v_189.style.color = "#d97706";
            v_189.innerHTML = "You paid <strong>$" + (v_193 || activePendingOrder.paid_so_far).toFixed(2) + "</strong> USDT. " + "Total received: <strong>$" + activePendingOrder.paid_so_far.toFixed(2) + "</strong> USDT. " + "Remaining: <strong>$" + activePendingOrder.remaining.toFixed(2) + "</strong> USDT.<br>" + "Please pay the remaining amount using the <strong>NEW note: " + (activePendingOrder.payment_note || "") + "</strong>";
          }
          return;
        }
        if (v_190.status === "subscription_complete") {
          stopOrderTimers();
          if (v_189) {
            v_189.style.color = "#059669";
            v_189.textContent = "Subscription activated!";
          }
          clearPendingOrder();
          activePlanType = "permanent";
          await new Promise(v_198 => setTimeout(v_198, 600));
          Swal.close();
          await Swal.fire({
            ["icon"]: "success",
            ["title"]: "Subscription Active!",
            ["text"]: v_190.message || "Your monthly subscription is active for 30 days.",
            ["confirmButtonColor"]: "#8b5cf6",
            ["customClass"]: {
              ["container"]: "swal-high-zindex"
            }
          });
          location.reload();
          return;
        }
        if (v_190.status === "complete" || v_190.status === "completed") {
          stopOrderTimers();
          if (v_189) {
            v_189.style.color = "#059669";
            v_189.textContent = "Payment verified! Activating...";
          }
          const v_199 = activePendingOrder.order_id;
          clearPendingOrder();
          await new Promise(v_200 => setTimeout(v_200, 800));
          Swal.close();
          if (activePlanType === "subscription") {
            await confirmMonthlySubscription(v_199);
          } else {
            await promptMonthlyBinanceOrder(v_199);
          }
          return;
        }
        if (!v_190.success && v_190.message) {
          if (v_189) {
            v_189.style.color = "#d97706";
            v_189.textContent = v_190.message;
          }
        }
      } catch (v_201) {
        console.error("[BinancePay] Auto-check error:", v_201);
        if (v_189) {
          v_189.style.color = "#d97706";
          v_189.textContent = "Checking... (connection issue, retrying)";
        }
      }
    };
    v_188();
    orderPollingIntervalId = setInterval(v_188, 15000);
  }
  async function checkPendingBdtOrder() {
    const v_202 = localStorage.getItem("pendingOrderId");
    if (!v_202) {
      return null;
    }
    try {
      const v_203 = await fetch(URL_CHECK_STATUS, {
        ["method"]: "POST",
        ["headers"]: {
          ["Content-Type"]: "application/json"
        },
        ["body"]: JSON.stringify({
          ["order_id"]: v_202
        })
      });
      const v_204 = await v_203.json();
      if (v_204.success) {
        if (v_204.status === "completed" && v_204.license_key) {
          localStorage.setItem("appActivation", v_204.license_key);
          localStorage.setItem("lastVerified", Date.now());
          localStorage.removeItem("pendingOrderId");
          return {
            ["recovered"]: true,
            ["license_key"]: v_204.license_key
          };
        } else {
          if (v_204.status === "paid") {
            return {
              ["needsDetails"]: true,
              ["order_id"]: v_202
            };
          } else {
            if (v_204.status === "failed") {
              localStorage.removeItem("pendingOrderId");
            }
          }
        }
      }
    } catch (v_205) {}
    return null;
  }
  async function createBdtOrder() {
    const v_206 = {
      ["price"]: currentPlanPrice,
      ["coupon"]: appliedCouponCode
    };
    const v_207 = Math.round(Number(v_206.price) * Number(bdtUsdRate || 120));
    Swal.fire({
      ["title"]: "Creating BDT Payment...",
      ["html"]: "<div style=\"color: rgba(255,255,255,0.8);\">Preparing ৳" + v_207.toLocaleString("en-US") + " Taka checkout...</div>",
      ["allowOutsideClick"]: false,
      ["showConfirmButton"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      },
      ["didOpen"]: () => {
        Swal.showLoading();
      }
    });
    try {
      const v_208 = await fetch(URL_CREATE_BDT_ORDER, {
        ["method"]: "POST",
        ["headers"]: {
          ["Content-Type"]: "application/json"
        },
        ["body"]: JSON.stringify({
          ["coupon_code"]: v_206.coupon,
          ["purpose"]: activePlanType,
          ["project_type"]: PROJECT_TYPE,
          ["license_key"]: activePlanType === "subscription" ? activeLicenseKey || localStorage.getItem("appActivation") || localStorage.getItem("quotexLowAppActivation") || "" : "",
          ["name"]: "Quotex Customer"
        })
      });
      let v_209 = {};
      try {
        v_209 = await v_208.json();
      } catch (v_210) {
        v_209 = {};
      }
      if (!v_208.ok || !v_209.success) {
        const v_211 = v_209.message || (v_208.status === 404 ? "BDT payment API not found on server. Upload/restart updated app.py on uix.zozo.city" : "Failed to create BDT payment (HTTP " + v_208.status + ")");
        Swal.fire({
          ["icon"]: "error",
          ["title"]: "Error",
          ["text"]: v_211,
          ["customClass"]: {
            ["container"]: "swal-high-zindex"
          }
        });
        return;
      }
      const v_212 = v_209.order_id;
      const v_213 = v_209.payment_url || v_209.pay_link;
      const v_214 = v_209.amount_bdt || v_207;
      if (v_209.usd_rate) {
        bdtUsdRate = Number(v_209.usd_rate);
      }
      localStorage.setItem("pendingOrderId", v_212);
      localStorage.setItem("pendingBdtOrder", JSON.stringify({
        ["order_id"]: v_212,
        ["amount_bdt"]: v_214,
        ["amount_usd"]: v_209.amount_usd || v_206.price,
        ["created_at"]: Date.now()
      }));
      window.open(v_213, "_blank");
      await pollBdtOrderStatus(v_212, v_214);
    } catch (v_215) {
      Swal.fire({
        ["icon"]: "error",
        ["title"]: "Error",
        ["text"]: "BDT payment request failed. Make sure updated app.py is running on the server, then retry.",
        ["customClass"]: {
          ["container"]: "swal-high-zindex"
        }
      });
    }
  }
  async function pollBdtOrderStatus(v_216, v_217) {
    return new Promise(v_218 => {
      let v_219 = 0;
      const v_220 = 360;
      const v_221 = "৳" + Number(v_217 || 0).toLocaleString("en-US");
      Swal.fire({
        ["title"]: "",
        ["html"]: `${"\n          <div style=\"font-family: 'Roboto', sans-serif; text-align: center;\n                      background: linear-gradient(135deg, rgba(6, 78, 59, 0.98), rgba(16, 185, 129, 0.95));\n                      padding: 20px; border-radius: 15px;\">\n            <div style=\"margin-bottom: 20px;\">\n              <div style=\"width: 60px; height: 60px; border: 4px solid rgba(255,255,255,0.25);\n                          border-top: 4px solid #fff; border-radius: 50%; margin: 0 auto;\n                          animation: paymentSpin 1s linear infinite;\"></div>\n            </div>\n            <h2 style=\"color: #fff; font-size: 16px; margin-bottom: 8px;\">Waiting for BDT Payment...</h2>\n            <p style=\"color: rgba(255,255,255,0.85); font-size: 22px; font-weight: 800; margin: 0 0 8px;\">"}${v_221}${"</p>\n            <p style=\"color: rgba(255,255,255,0.75); font-size: 13px; line-height: 1.6;\">\n              Complete payment in the opened tab.<br>\n              Auto-checking in background — subscription activates automatically.\n            </p>\n            <div style=\"background: rgba(255,255,255,0.12); padding: 12px; border-radius: 8px; margin-top: 15px;\">\n              <p style=\"color: #fff; font-size: 12px; margin: 0;\">Order: "}${v_216}${"</p>\n            </div>\n          </div>\n        "}`,
        ["showConfirmButton"]: false,
        ["showCancelButton"]: true,
        ["cancelButtonText"]: "Cancel",
        ["cancelButtonColor"]: "#ef4444",
        ["allowOutsideClick"]: false,
        ["customClass"]: {
          ["container"]: "swal-high-zindex",
          ["popup"]: "custom-popup-style"
        },
        ["didOpen"]: () => {
          const v_222 = document.createElement("style");
          v_222.textContent = "@keyframes paymentSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
          document.head.appendChild(v_222);
          const v_223 = setInterval(async () => {
            v_219++;
            if (v_219 >= v_220) {
              clearInterval(v_223);
              Swal.close();
              v_218();
              return;
            }
            try {
              let v_224 = await fetch(URL_CHECK_BDT_ORDER, {
                ["method"]: "POST",
                ["headers"]: {
                  ["Content-Type"]: "application/json"
                },
                ["body"]: JSON.stringify({
                  ["order_id"]: v_216
                })
              });
              let v_225 = await v_224.json();
              if (!v_225.success) {
                v_224 = await fetch(URL_CHECK_STATUS, {
                  ["method"]: "POST",
                  ["headers"]: {
                    ["Content-Type"]: "application/json"
                  },
                  ["body"]: JSON.stringify({
                    ["order_id"]: v_216
                  })
                });
                v_225 = await v_224.json();
              }
              if (v_225.success) {
                if (v_225.status === "paid") {
                  clearInterval(v_223);
                  Swal.close();
                  localStorage.removeItem("pendingBdtOrder");
                  if (activePlanType === "subscription") {
                    await confirmMonthlySubscription(v_216);
                  } else {
                    await promptMonthlyBinanceOrder(v_216);
                  }
                  v_218();
                } else {
                  if (v_225.status === "completed" || v_225.status === "subscription_complete") {
                    clearInterval(v_223);
                    if (v_225.license_key) {
                      localStorage.setItem("appActivation", v_225.license_key);
                      try {
                        localStorage.setItem("quotexLowAppActivation", v_225.license_key);
                      } catch (v_226) {}
                      localStorage.setItem("lastVerified", Date.now());
                    }
                    localStorage.removeItem("pendingOrderId");
                    localStorage.removeItem("pendingBdtOrder");
                    isActivated = true;
                    activePlanType = "permanent";
                    Swal.close();
                    if (v_225.status === "subscription_complete" || v_225.purpose === "subscription") {
                      await Swal.fire({
                        ["icon"]: "success",
                        ["title"]: "Subscription Active!",
                        ["text"]: v_225.message || "Your monthly subscription is active for 30 days.",
                        ["confirmButtonColor"]: "#065F46",
                        ["customClass"]: {
                          ["container"]: "swal-high-zindex"
                        }
                      });
                    } else {
                      await showSuccessAlert();
                    }
                    location.reload();
                    v_218();
                  } else {
                    if (v_225.status === "failed") {
                      clearInterval(v_223);
                      localStorage.removeItem("pendingOrderId");
                      localStorage.removeItem("pendingBdtOrder");
                      Swal.fire({
                        ["icon"]: "error",
                        ["title"]: "Payment Failed",
                        ["text"]: "Your BDT payment has failed or expired. Please try again.",
                        ["customClass"]: {
                          ["container"]: "swal-high-zindex"
                        }
                      });
                      v_218();
                    }
                  }
                }
              }
            } catch (v_227) {}
          }, 4000);
          Swal.getPopup().__pollInterval = v_223;
        },
        ["willClose"]: () => {
          const v_228 = Swal.getPopup()?.["__pollInterval"];
          if (v_228) {
            clearInterval(v_228);
          }
        }
      });
    });
  }
  async function createDirectCryptoInvoice() {
    const v_229 = {
      ["price"]: currentPlanPrice,
      ["coupon"]: appliedCouponCode
    };
    Swal.fire({
      ["title"]: "Creating Payment...",
      ["html"]: "<div style=\"color: rgba(255,255,255,0.8);\">Setting up your payment...</div>",
      ["allowOutsideClick"]: false,
      ["showConfirmButton"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      },
      ["didOpen"]: () => {
        Swal.showLoading();
      }
    });
    try {
      const v_230 = await fetch(URL_CREATE_INVOICE, {
        ["method"]: "POST",
        ["headers"]: {
          ["Content-Type"]: "application/json"
        },
        ["body"]: JSON.stringify({
          ["coupon_code"]: v_229.coupon,
          ["purpose"]: activePlanType,
          ["project_type"]: PROJECT_TYPE,
          ["license_key"]: activePlanType === "subscription" ? activeLicenseKey || localStorage.getItem("appActivation") || "" : ""
        })
      });
      const v_231 = await v_230.json();
      if (!v_231.success) {
        Swal.fire({
          ["icon"]: "error",
          ["title"]: "Error",
          ["text"]: v_231.message || "Failed to create payment",
          ["customClass"]: {
            ["container"]: "swal-high-zindex"
          }
        });
        return;
      }
      const v_232 = v_231.order_id;
      const v_233 = v_231.payment_url;
      localStorage.setItem("pendingOrderId", v_232);
      window.open(v_233, "_blank");
      await pollCryptoInvoiceStatus(v_232);
    } catch (v_234) {
      Swal.fire({
        ["icon"]: "error",
        ["title"]: "Error",
        ["text"]: "Failed to create payment. Check your connection.",
        ["customClass"]: {
          ["container"]: "swal-high-zindex"
        }
      });
    }
  }
  async function pollCryptoInvoiceStatus(v_235) {
    return new Promise(v_236 => {
      let v_237 = 0;
      const v_238 = 360;
      Swal.fire({
        ["title"]: "",
        ["html"]: `${"\n          <div style=\"font-family: 'Roboto', sans-serif; text-align: center;\n                      background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98));\n                      padding: 20px; border-radius: 15px;\">\n            <div style=\"margin-bottom: 20px;\">\n              <div style=\"width: 60px; height: 60px; border: 4px solid rgba(16, 185, 129, 0.3);\n                          border-top: 4px solid #10b981; border-radius: 50%; margin: 0 auto;\n                          animation: paymentSpin 1s linear infinite;\"></div>\n            </div>\n            <h2 style=\"color: #fff; font-size: 16px; margin-bottom: 10px;\">Waiting for Payment...</h2>\n            <p style=\"color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.6;\">\n              Complete your payment in the opened tab.<br>\n              This will automatically update once confirmed.\n            </p>\n            <div style=\"background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 8px; margin-top: 15px;\">\n              <p style=\"color: #10b981; font-size: 12px; margin: 0;\">Order: "}${v_235}${"</p>\n            </div>\n          </div>\n        "}`,
        ["showConfirmButton"]: false,
        ["showCancelButton"]: true,
        ["cancelButtonText"]: "Cancel",
        ["cancelButtonColor"]: "#ef4444",
        ["allowOutsideClick"]: false,
        ["customClass"]: {
          ["container"]: "swal-high-zindex",
          ["popup"]: "custom-popup-style"
        },
        ["didOpen"]: () => {
          const v_239 = document.createElement("style");
          v_239.textContent = "@keyframes paymentSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
          document.head.appendChild(v_239);
          const v_240 = setInterval(async () => {
            v_237++;
            if (v_237 >= v_238) {
              clearInterval(v_240);
              Swal.close();
              v_236();
              return;
            }
            try {
              const v_241 = await fetch(URL_CHECK_STATUS, {
                ["method"]: "POST",
                ["headers"]: {
                  ["Content-Type"]: "application/json"
                },
                ["body"]: JSON.stringify({
                  ["order_id"]: v_235
                })
              });
              const v_242 = await v_241.json();
              if (v_242.success) {
                if (v_242.status === "paid") {
                  clearInterval(v_240);
                  Swal.close();
                  if (activePlanType === "subscription") {
                    await confirmMonthlySubscription(v_235);
                  } else {
                    await promptMonthlyBinanceOrder(v_235);
                  }
                  v_236();
                } else {
                  if (v_242.status === "completed" || v_242.status === "subscription_complete") {
                    clearInterval(v_240);
                    if (v_242.license_key) {
                      localStorage.setItem("appActivation", v_242.license_key);
                      localStorage.setItem("lastVerified", Date.now());
                    }
                    localStorage.removeItem("pendingOrderId");
                    isActivated = true;
                    activePlanType = "permanent";
                    Swal.close();
                    if (v_242.status === "subscription_complete" || v_242.purpose === "subscription") {
                      await Swal.fire({
                        ["icon"]: "success",
                        ["title"]: "Subscription Active!",
                        ["text"]: v_242.message || "Your monthly subscription is active for 30 days.",
                        ["confirmButtonColor"]: "#8b5cf6",
                        ["customClass"]: {
                          ["container"]: "swal-high-zindex"
                        }
                      });
                    } else {
                      await showSuccessAlert();
                    }
                    location.reload();
                    v_236();
                  } else {
                    if (v_242.status === "failed") {
                      clearInterval(v_240);
                      localStorage.removeItem("pendingOrderId");
                      Swal.fire({
                        ["icon"]: "error",
                        ["title"]: "Payment Failed",
                        ["text"]: "Your payment has failed or expired. Please try again.",
                        ["customClass"]: {
                          ["container"]: "swal-high-zindex"
                        }
                      });
                      v_236();
                    }
                  }
                }
              }
            } catch (v_243) {}
          }, 5000);
          Swal.getPopup().__pollInterval = v_240;
        },
        ["willClose"]: () => {
          const v_244 = Swal.getPopup()?.["__pollInterval"];
          if (v_244) {
            clearInterval(v_244);
          }
        }
      });
    });
  }
  async function confirmMonthlySubscription(v_245) {
    Swal.fire({
      ["title"]: "Activating subscription...",
      ["html"]: "<div style=\"color: rgba(255,255,255,0.8);\">Confirming your monthly payment...</div>",
      ["allowOutsideClick"]: false,
      ["showConfirmButton"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      },
      ["didOpen"]: () => {
        Swal.showLoading();
      }
    });
    try {
      const v_246 = await fetch(URL_COMPLETE, {
        ["method"]: "POST",
        ["headers"]: {
          ["Content-Type"]: "application/json"
        },
        ["body"]: JSON.stringify({
          ["order_id"]: v_245,
          ["email"]: "subscription@local",
          ["whatsapp"]: "",
          ["telegram"]: ""
        })
      });
      const v_247 = await v_246.json();
      if (v_247.success) {
        const v_248 = !!(v_247.license_still_blocked || String(v_247.license_status || "").toLowerCase() === "blocked");
        if (v_247.license_key) {
          localStorage.setItem("appActivation", v_247.license_key);
        }
        localStorage.removeItem("pendingOrderId");
        clearPendingOrder();
        activePlanType = "permanent";
        clearCachedTokens();
        if (v_248) {
          isActivated = false;
          setSubscriptionDue(false);
          localStorage.removeItem("lastVerified");
          await Swal.fire({
            ["icon"]: "warning",
            ["title"]: "Payment Received — License Blocked",
            ["html"]: "Your payment was recorded, but this license is <strong>BLOCKED</strong> by admin.<br>It will <strong>not work</strong> until the admin Activates it manually.",
            ["confirmButtonColor"]: "#e74c3c",
            ["customClass"]: {
              ["container"]: "swal-high-zindex"
            }
          });
          location.reload();
          return;
        }
        localStorage.setItem("lastVerified", Date.now());
        isActivated = true;
        setSubscriptionDue(false);
        await Swal.fire({
          ["icon"]: "success",
          ["title"]: "Subscription Active!",
          ["text"]: v_247.message || "Your monthly subscription is active for 30 days.",
          ["confirmButtonColor"]: "#8b5cf6",
          ["customClass"]: {
            ["container"]: "swal-high-zindex"
          }
        });
        location.reload();
      } else {
        Swal.fire({
          ["icon"]: "error",
          ["title"]: "Error",
          ["text"]: v_247.message || "Failed to activate subscription",
          ["customClass"]: {
            ["container"]: "swal-high-zindex"
          }
        });
      }
    } catch (v_249) {
      Swal.fire({
        ["icon"]: "error",
        ["title"]: "Connection Error",
        ["text"]: "Failed to complete subscription. Please try again.",
        ["customClass"]: {
          ["container"]: "swal-high-zindex"
        }
      });
    }
  }
  async function promptMonthlyBinanceOrder(v_250) {
    const {
      ["value"]: v_251,
      ["isDismissed"]: v_252
    } = await Swal.fire({
      ["title"]: "",
      ["html"]: `${"\n        <div style=\"font-family: 'Roboto', sans-serif; text-align: center;\n                    background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98));\n                    padding: 20px; border-radius: 15px; box-shadow: 0 15px 40px rgba(0,0,0,0.5);\">\n          <div style=\"background: linear-gradient(135deg, #10b981 0%, #059669 100%);\n                      padding: 2px; border-radius: 12px; margin-bottom: 15px;\">\n            <div style=\"background: rgba(30, 11, 54, 0.95); padding: 15px; border-radius: 10px;\">\n              <div style=\"font-size: 40px; margin-bottom: 8px;\">&#10004;</div>\n              <h2 style=\"color: #fff; margin: 0; font-size: 16px; font-weight: 700;\n                         background: linear-gradient(to right, #10b981, #059669);\n                         -webkit-background-clip: text; -webkit-text-fill-color: transparent;\">\n                Payment Successful!\n              </h2>\n            </div>\n          </div>\n\n          <p style=\"color: rgba(255,255,255,0.8); font-size: 13px; margin-bottom: 15px;\">\n            Please provide your details to receive your license key.\n          </p>\n\n          <div style=\"text-align: left;\">\n            <label style=\"color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;\">\n              Email Address <span style=\"color: #ef4444;\">*</span>\n            </label>\n            <input type=\"email\" id=\"swalUserEmail\" placeholder=\"your@email.com\"\n                   style=\"width: 100%; padding: 10px; border: 2px solid rgba(255,255,255,0.2);\n                          border-radius: 8px; background: rgba(255,255,255,0.1); color: white;\n                          font-size: 13px; outline: none; margin-bottom: 12px; box-sizing: border-box;\">\n\n            <label style=\"color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;\">\n              WhatsApp Number <span style=\"color: rgba(255,255,255,0.5); font-size: 10px;\">(Optional)</span>\n            </label>\n            <input type=\"text\" id=\"swalUserWhatsApp\" placeholder=\"+880XXXXXXXXXX\"\n                   style=\"width: 100%; padding: 10px; border: 2px solid rgba(255,255,255,0.2);\n                          border-radius: 8px; background: rgba(255,255,255,0.1); color: white;\n                          font-size: 13px; outline: none; margin-bottom: 12px; box-sizing: border-box;\">\n\n            <label style=\"color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px;\">\n              Telegram Username <span style=\"color: rgba(255,255,255,0.5); font-size: 10px;\">(Optional)</span>\n            </label>\n            <input type=\"text\" id=\"swalUserTelegram\" placeholder=\"@username\"\n                   style=\"width: 100%; padding: 10px; border: 2px solid rgba(255,255,255,0.2);\n                          border-radius: 8px; background: rgba(255,255,255,0.1); color: white;\n                          font-size: 13px; outline: none; box-sizing: border-box;\">\n          </div>\n        </div>\n      "}`,
      ["showConfirmButton"]: true,
      ["confirmButtonText"]: "Submit & Get License",
      ["confirmButtonColor"]: "#10b981",
      ["allowOutsideClick"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex",
        ["popup"]: "custom-popup-style"
      },
      ["preConfirm"]: () => {
        const v_253 = document.getElementById("swalUserEmail").value.trim();
        if (!v_253 || !v_253.includes("@")) {
          Swal.showValidationMessage("Please enter a valid email address");
          return false;
        }
        return {
          ["email"]: v_253,
          ["whatsapp"]: document.getElementById("swalUserWhatsApp").value.trim(),
          ["telegram"]: document.getElementById("swalUserTelegram").value.trim()
        };
      }
    });
    if (v_252 || !v_251) {
      return;
    }
    Swal.fire({
      ["title"]: "Setting up your license...",
      ["html"]: "<div style=\"color: rgba(255,255,255,0.8);\">Creating license and sending email...</div>",
      ["allowOutsideClick"]: false,
      ["showConfirmButton"]: false,
      ["customClass"]: {
        ["container"]: "swal-high-zindex"
      },
      ["didOpen"]: () => {
        Swal.showLoading();
      }
    });
    try {
      const v_254 = await fetch(URL_COMPLETE, {
        ["method"]: "POST",
        ["headers"]: {
          ["Content-Type"]: "application/json"
        },
        ["body"]: JSON.stringify({
          ["order_id"]: v_250,
          ["email"]: v_251.email,
          ["whatsapp"]: v_251.whatsapp,
          ["telegram"]: v_251.telegram
        })
      });
      const v_255 = await v_254.json();
      if (v_255.success && v_255.license_key) {
        localStorage.setItem("appActivation", v_255.license_key);
        localStorage.setItem("lastVerified", Date.now());
        localStorage.removeItem("pendingOrderId");
        isActivated = true;
        const v_256 = document.getElementById("licenseInput");
        if (v_256) {
          v_256.value = v_255.license_key;
        }
        await Swal.fire({
          ["icon"]: "success",
          ["title"]: "License Activated!",
          ["html"]: "<div style=\"text-align: center;\"><p style=\"margin-bottom: 10px;\">Your license key has been set automatically.</p><div style=\"background: #1a1a2e; padding: 15px; border-radius: 10px; margin: 10px 0;            border: 1px solid #10b981; word-break: break-all;\"><code style=\"color: #10b981; font-size: 14px;\">" + v_255.license_key + "</code></div>" + "<p style=\"font-size: 12px; color: #94a3b8;\">A copy has been sent to: " + v_251.email + "</p></div>",
          ["confirmButtonText"]: "Start Using",
          ["confirmButtonColor"]: "#10b981",
          ["allowOutsideClick"]: false,
          ["customClass"]: {
            ["container"]: "swal-high-zindex"
          }
        });
        location.reload();
      } else {
        Swal.fire({
          ["icon"]: "error",
          ["title"]: "Error",
          ["text"]: v_255.message || "Failed to create license",
          ["customClass"]: {
            ["container"]: "swal-high-zindex"
          }
        });
      }
    } catch (v_257) {
      Swal.fire({
        ["icon"]: "error",
        ["title"]: "Connection Error",
        ["text"]: "Failed to complete order. Please try again.",
        ["customClass"]: {
          ["container"]: "swal-high-zindex"
        }
      });
    }
  }
  function generateAliasFromName(v_258) {
    const v_259 = {
      ["A"]: "Nebula",
      ["B"]: "Quartz",
      ["C"]: "Tornado",
      ["D"]: "Eclipse",
      ["E"]: "Blizzard",
      ["F"]: "Mirage",
      ["G"]: "Vortex",
      ["H"]: "Zephyr",
      ["I"]: "Nimbus",
      ["J"]: "Cyclone",
      ["K"]: "Phantom",
      ["L"]: "Ignite",
      ["M"]: "Jungle",
      ["N"]: "Lynx",
      ["O"]: "Falcon",
      ["P"]: "Comet",
      ["Q"]: "Raven",
      ["R"]: "Stellar",
      ["S"]: "Glacier",
      ["T"]: "Orbit",
      ["U"]: "Tempest",
      ["V"]: "Nova",
      ["W"]: "Inferno",
      ["X"]: "Echo",
      ["Y"]: "Gravity",
      ["Z"]: "Shadow",
      0: "Drift",
      1: "Bolt",
      2: "Fury",
      3: "Crimson",
      4: "Oblivion",
      5: "Pulse",
      6: "Specter",
      7: "Radiant",
      8: "Blitz",
      9: "Strike",
      ["@"]: "Quotex",
      ["-"]: "Lyra",
      ["_"]: "Xion",
      ["#"]: "Vega",
      ["."]: "Orion"
    };
    const v_260 = v_258.toUpperCase().split("").map(v_261 => v_259[v_261] || "Fine").join(" ");
    return v_260;
  }
  const FLOATING_POPUP_CSS = `${"\n    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');\n    \n    /* SweetAlert High Z-Index */\n    .swal-high-zindex {\n      z-index: 10000 !important;\n    }\n    \n    .swal2-container.swal-high-zindex {\n      z-index: 10000 !important;\n    }\n    \n    #settingsPopup {\n      position: fixed;\n      top: 50%;\n      left: 50%;\n      transform: translate(-50%, -50%) scale(0.8);\n      width: calc(100% - 20px);\n      max-width: 360px;\n      max-height: calc(100vh - 20px);\n      height: auto;\n      padding: 10px 12px;\n      background: rgba(30, 11, 54, 0.98);\n      backdrop-filter: blur(10px);\n      border-radius: 10px;\n      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);\n      text-align: center;\n      border: 1px solid rgba(248, 0, 255, 0.2);\n      overflow-y: auto;\n      overflow-x: hidden;\n      font-family: 'Roboto', sans-serif;\n      color: #f8f8f8;\n      z-index: 9999;\n      opacity: 0;\n      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);\n    }\n    \n    @media (max-height: 700px) {\n      #settingsPopup {\n        padding: 8px 10px;\n        max-height: calc(100vh - 10px);\n      }\n      #settingsPopup h2 { font-size: 11px; padding: 6px; margin-bottom: 6px; }\n      #settingsPopup h3 { font-size: 11px; margin: 6px 0 5px 0; }\n      #settingsPopup label { font-size: 10px; margin-bottom: 5px; }\n      #settingsPopup input, #settingsPopup select { padding: 6px; font-size: 12px; margin-top: 2px; }\n      #settingsPopup button { padding: 6px; font-size: 12px; margin-top: 4px; }\n      #settingsPopup small { font-size: 8px; margin-bottom: 5px; }\n      .telegram-link img { width: 28px; height: 28px; }\n      .telegram-link { margin-bottom: 5px; }\n      #licenseSection, #demoBalanceSection { padding: 8px; margin-top: 6px; }\n      #cheatCodeDisplay { font-size: 10px !important; padding: 6px !important; }\n    }\n    \n    @media (max-height: 550px) {\n      #settingsPopup {\n        padding: 6px 8px;\n      }\n      #settingsPopup h2 { font-size: 10px; padding: 5px; margin-bottom: 5px; }\n      #settingsPopup h3 { font-size: 10px; margin: 4px 0 4px 0; }\n      #settingsPopup label { font-size: 9px; margin-bottom: 4px; }\n      #settingsPopup input, #settingsPopup select { padding: 5px; font-size: 11px; border-radius: 6px; }\n      #settingsPopup button { padding: 5px; font-size: 11px; margin-top: 3px; border-radius: 6px; }\n      #settingsPopup small { font-size: 7px; margin-bottom: 4px; }\n      .telegram-link img { width: 24px; height: 24px; }\n      .telegram-link { margin-bottom: 4px; }\n      #licenseSection, #demoBalanceSection { padding: 6px; margin-top: 4px; }\n    }\n    \n    #settingsPopup::-webkit-scrollbar {\n      width: 8px;\n    }\n    \n    #settingsPopup::-webkit-scrollbar-track {\n      background: rgba(255, 255, 255, 0.1);\n      border-radius: 10px;\n    }\n    \n    #settingsPopup::-webkit-scrollbar-thumb {\n      background: linear-gradient(135deg, #8333ff, #f900ff);\n      border-radius: 10px;\n    }\n    \n    #settingsPopup::before {\n      content: '';\n      position: absolute;\n      top: 0;\n      left: 0;\n      right: 0;\n      height: 5px;\n      background: linear-gradient(to right, #f900ff, #00d9ff);\n      background-size: 200% 200%;\n      animation: gradientFlow 3s linear infinite;\n      border-radius: 12px 12px 0 0;\n    }\n    \n    @keyframes gradientFlow {\n      0% { background-position: 0% 50%; }\n      50% { background-position: 100% 50%; }\n      100% { background-position: 0% 50%; }\n    }\n\n    #settingsPopup.show {\n      opacity: 1;\n      transform: translate(-50%, -50%) scale(1);\n    }\n\n    #settingsPopup.hide {\n      opacity: 0;\n      transform: translate(-50%, -50%) scale(0.8);\n    }\n\n    #settingsPopup h2 {\n      color: white;\n      font-size: 12px;\n      font-weight: 600;\n      margin: 0 0 8px 0;\n      padding: 8px;\n      background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.9) 100%);\n      border-radius: 6px;\n      text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);\n      border: 1px solid rgba(248, 0, 255, 0.3);\n      line-height: 1.4;\n    }\n    \n    #settingsPopup h2 .warning-text {\n      color: #ff3366;\n      font-weight: 700;\n      display: block;\n      margin-top: 3px;\n      animation: warningPulse 2s infinite alternate;\n    }\n    \n    @keyframes warningPulse {\n      from { text-shadow: 0 0 5px rgba(255, 51, 102, 0.5); }\n      to { text-shadow: 0 0 15px rgba(255, 51, 102, 0.9), 0 0 20px rgba(255, 51, 102, 0.7); }\n    }\n    \n    #settingsPopup h3 {\n      color: white;\n      font-size: 12px;\n      font-weight: 700;\n      margin: 6px 0 5px 0;\n      text-transform: uppercase;\n      letter-spacing: 1px;\n      background: linear-gradient(to right, #f900ff, #00d9ff);\n      -webkit-background-clip: text;\n      background-clip: text;\n      -webkit-text-fill-color: transparent;\n      position: relative;\n      display: inline-block;\n    }\n    \n    #settingsPopup h3::after {\n      content: '';\n      position: absolute;\n      width: 60%;\n      height: 2px;\n      bottom: -5px;\n      left: 20%;\n      background: linear-gradient(to right, #f900ff, #00d9ff);\n      border-radius: 10px;\n    }\n    \n    .telegram-link {\n      display: inline-block;\n      margin-bottom: 6px;\n    }\n    \n    .telegram-link img {\n      width: 32px;\n      height: 32px;\n      cursor: pointer;\n      border-radius: 50%;\n      border: 2px solid rgba(255, 255, 255, 0.2);\n      box-shadow: 0 0 15px rgba(248, 0, 255, 0.5);\n      transition: all 0.3s ease;\n    }\n    \n    .telegram-link img:hover {\n      transform: scale(1.1) rotate(5deg);\n      box-shadow: 0 0 20px rgba(248, 0, 255, 0.7);\n      border-color: rgba(255, 255, 255, 0.4);\n    }\n\n    #settingsPopup label {\n      display: block; \n      margin-bottom: 6px; \n      color: rgba(255, 255, 255, 0.9);\n      font-size: 11px;\n      font-weight: 500;\n      text-align: left;\n    }\n\n    #settingsPopup input, #settingsPopup select {\n      width: 100%; \n      padding: 7px; \n      margin-top: 2px; \n      border: 2px solid rgba(255, 255, 255, 0.2); \n      border-radius: 8px; \n      background: rgba(255, 255, 255, 0.1);\n      color: white;\n      font-size: 13px;\n      box-sizing: border-box;\n      font-family: 'Roboto', sans-serif;\n      transition: all 0.3s ease;\n    }\n    \n    #settingsPopup input::placeholder {\n      color: rgba(255, 255, 255, 0.5);\n    }\n    \n    #settingsPopup input:focus, #settingsPopup select:focus {\n      outline: none;\n      border-color: #f900ff;\n      box-shadow: 0 0 0 3px rgba(248, 0, 255, 0.3);\n      background: rgba(255, 255, 255, 0.15);\n    }\n    \n    /* Country Flag Select Dropdown Styling */\n    #countryFlagSelect {\n      background: rgba(30, 11, 54, 0.9);\n      color: white;\n      cursor: pointer;\n    }\n    \n    #countryFlagSelect option {\n      background: #1e0b36;\n      color: white;\n      padding: 10px;\n      font-size: 14px;\n    }\n    \n    #countryFlagSelect option:hover {\n      background: rgba(248, 0, 255, 0.2);\n    }\n    \n    #countryFlagSelect option:checked {\n      background: linear-gradient(135deg, #8333ff, #f900ff);\n      color: white;\n      font-weight: 600;\n    }\n    \n    #settingsPopup small {\n      display: block;\n      margin-top: -4px;\n      margin-bottom: 6px;\n      color: rgba(255, 255, 255, 0.6);\n      font-size: 8px;\n      font-style: italic;\n      text-align: left;\n    }\n\n    #settingsPopup button {\n      width: 100%;\n      padding: 7px;\n      margin-top: 5px;\n      border: none;\n      border-radius: 8px;\n      font-size: 13px;\n      font-weight: 600;\n      cursor: pointer;\n      transition: all 0.3s ease;\n      text-transform: uppercase;\n      letter-spacing: 1px;\n      position: relative;\n      overflow: hidden;\n      font-family: 'Roboto', sans-serif;\n    }\n    \n    #settingsPopup button::before {\n      content: '';\n      position: absolute;\n      top: 0;\n      left: -100%;\n      width: 100%;\n      height: 100%;\n      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);\n      transition: all 0.5s ease;\n    }\n    \n    #settingsPopup button:hover::before {\n      left: 100%;\n    }\n    \n    #settingsPopup button:hover {\n      transform: translateY(-2px);\n      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);\n    }\n    \n    #settingsPopup button:active {\n      transform: translateY(0);\n    }\n    \n    #saveButton, #verifyBtn, #setDemoBtn {\n      background: linear-gradient(135deg, #8333ff, #f900ff);\n      color: white;\n      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);\n    }\n\n    #onlinePaymentActiveBtn {\n      background: linear-gradient(135deg, #10b981, #059669) !important;\n      color: white !important;\n      box-shadow: 0 5px 15px rgba(16, 185, 129, 0.35) !important;\n      margin-top: 8px !important;\n      width: 100%;\n      font-weight: 700 !important;\n    }\n\n    #onlinePaymentActiveBtn:hover {\n      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.45) !important;\n    }\n\n    #settingsPopup button.close-btn {\n      background: linear-gradient(135deg, #ff3366, #ff5757);\n      color: white;\n      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);\n    }\n\n    #settingsPopup button:disabled {\n      background: #6c757d;\n      cursor: not-allowed;\n      opacity: 0.6;\n    }\n    \n    #settingsPopup button:disabled:hover {\n      transform: none;\n      box-shadow: none;\n    }\n\n    #licenseSection, #demoBalanceSection {\n      margin-top: 8px;\n      padding: 10px;\n      background: rgba(255, 255, 255, 0.05);\n      border-radius: 8px;\n      border: 1px solid rgba(255, 255, 255, 0.1);\n      transition: all 0.3s ease;\n    }\n\n    #licenseSection.hide {\n      opacity: 0;\n      max-height: 0;\n      padding: 0;\n      margin: 0;\n      overflow: hidden;\n      border: none;\n    }\n\n    #demoBalanceSection {\n      opacity: 0;\n      max-height: 0;\n      overflow: hidden;\n      padding: 0;\n      margin: 0;\n      border: none;\n    }\n\n    #demoBalanceSection.show {\n      opacity: 1;\n      max-height: 500px;\n      padding: 12px;\n      margin-top: 10px;\n      border: 1px solid rgba(255, 255, 255, 0.1);\n    }\n\n    .message-popup {\n      position: fixed;\n      top: 80px;\n      right: 20px;\n      padding: 15px 20px;\n      color: white;\n      border-radius: 12px;\n      font-size: 14px;\n      font-weight: 600;\n      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);\n      opacity: 0;\n      transform: translateY(-20px);\n      transition: opacity 0.5s ease, transform 0.5s ease;\n      z-index: 10001;\n      max-width: 300px;\n      text-align: center;\n      backdrop-filter: blur(10px);\n      border: 1px solid rgba(255, 255, 255, 0.1);\n      font-family: 'Roboto', sans-serif;\n    }\n    \n    .message-popup.show {\n      opacity: 1;\n      transform: translateY(0);\n    }\n    \n    .message-popup.success {\n      background: rgba(0, 255, 163, 0.15);\n      color: #00ffa3;\n      box-shadow: 0 0 15px rgba(0, 255, 163, 0.3);\n      border: 1px solid rgba(0, 255, 163, 0.2);\n    }\n    \n    .message-popup.error {\n      background: rgba(255, 51, 102, 0.15);\n      color: #ff3366;\n      box-shadow: 0 0 15px rgba(255, 51, 102, 0.3);\n      border: 1px solid rgba(255, 51, 102, 0.2);\n    }\n    \n    #centeredDeveloperMessage {\n      position: fixed; \n      top: 50%; \n      left: 50%;\n      transform: translate(-50%, -50%);\n      background: rgba(0, 0, 0, 0.9);\n      color: white; \n      padding: 30px 50px; \n      border-radius: 15px;\n      font-size: 20px; \n      font-weight: bold;\n      z-index: 10004; \n      opacity: 0;\n      transition: opacity 0.5s ease;\n      box-shadow: 0 10px 30px rgba(0,0,0,0.5);\n      border: 2px solid rgba(248, 0, 255, 0.5);\n      font-family: 'Roboto', sans-serif;\n      text-align: center;\n    }\n    \n    /* Hide original flag/name while loading and prepare for instant replacement */\n    .jisanx-leaderboard-loading .position__header-name {\n        opacity: 0 !important;\n    }\n\n    #licenseInput, #demoBalanceInput {\n      width: 100%;\n      padding: 8px;\n      font-size: 12px;\n      border: 2px solid rgba(255, 255, 255, 0.2);\n      border-radius: 10px;\n      margin-bottom: 8px;\n      background: rgba(255, 255, 255, 0.1);\n      color: white;\n      font-family: 'Roboto', sans-serif;\n      box-sizing: border-box;\n    }\n\n    #cheatCodeDisplay {\n      font-size: 8px;\n      padding: 6px;\n      margin-top: 6px;\n      line-height: 1.4;\n      background: rgba(0, 0, 0, 0.3);\n      border-radius: 6px;\n      color: rgba(255, 255, 255, 0.7);\n      border: 1px solid rgba(255, 255, 255, 0.1);\n      word-wrap: break-word;\n    }\n\n    .verified-badge {\n      background: rgba(0, 255, 163, 0.2);\n      color: #00ffa3;\n      padding: 4px 10px;\n      border-radius: 6px;\n      font-size: 10px;\n      font-weight: 600;\n      margin-top: 6px;\n      display: inline-block;\n      border: 1px solid rgba(0, 255, 163, 0.3);\n    }\n    \n    .unverified-badge {\n      background: rgba(255, 51, 102, 0.2);\n      color: #ff3366;\n      padding: 4px 10px;\n      border-radius: 6px;\n      font-size: 10px;\n      font-weight: 600;\n      margin-top: 10px;\n      display: inline-block;\n      border: 1px solid rgba(255, 51, 102, 0.3);\n    }\n\n    #demoBalanceStatus, #verificationStatus {\n      margin-top: 10px;\n      font-size: 12px;\n      font-weight: 500;\n    }\n\n    /* To reduce unnecessary space */\n    #settingsPopup br {\n      display: none;\n    }\n    \n    /* CSS for refresh button */\n    #refreshBalanceBtn {\n      position: absolute; \n      top: 26px; \n      right: 8px;\n      cursor: pointer;\n      width: 22px; \n      height: 22px;\n      display: flex; \n      align-items: center; \n      justify-content: center;\n      border-radius: 50%; \n      background: rgba(248, 0, 255, 0.2);\n      border: 2px solid rgba(248, 0, 255, 0.4);\n      transition: all 0.3s ease;\n    }\n    \n    #refreshBalanceBtn:hover { \n      background: rgba(248, 0, 255, 0.3);\n      transform: scale(1.1);\n      box-shadow: 0 0 15px rgba(248, 0, 255, 0.5);\n    }\n    \n    #refreshBalanceBtn svg { \n      width: 12px; \n      height: 12px; \n      fill: #f900ff; \n    }\n    \n    @keyframes spin { \n      from { transform: rotate(0deg); } \n      to { transform: rotate(360deg); } \n    }\n    \n    .spinning { \n      animation: spin 0.6s linear; \n    }\n    \n    /* Mobile Responsive */\n    @media screen and (max-width: 480px) {\n      #settingsPopup {\n        padding: 8px 10px;\n        max-width: 95%;\n        max-height: calc(100vh - 10px);\n      }\n      \n      #settingsPopup h2 {\n        font-size: 10px;\n        padding: 6px;\n        margin-bottom: 5px;\n        line-height: 1.3;\n      }\n      \n      #settingsPopup h3 {\n        font-size: 10px;\n        margin: 5px 0 4px 0;\n      }\n      \n      #settingsPopup h3::after {\n        bottom: -3px;\n      }\n      \n      .telegram-link {\n        margin-bottom: 4px;\n      }\n      \n      .telegram-link img {\n        width: 26px;\n        height: 26px;\n      }\n      \n      #settingsPopup input, #settingsPopup select {\n        padding: 5px;\n        font-size: 11px;\n      }\n      \n      #settingsPopup button {\n        padding: 5px;\n        font-size: 11px;\n      }\n      \n      #settingsPopup label {\n        font-size: 9px;\n        margin-bottom: 4px;\n      }\n      \n      #settingsPopup small {\n        font-size: 7px;\n        margin-top: -3px;\n        margin-bottom: 4px;\n      }\n      \n      #refreshBalanceBtn {\n        top: 24px;\n        width: 22px;\n        height: 22px;\n      }\n      \n      #refreshBalanceBtn svg {\n        width: 11px;\n        height: 11px;\n      }\n      \n      #licenseSection, #demoBalanceSection {\n        padding: 6px;\n        margin-top: 5px;\n      }\n      \n      #demoBalanceSection.show {\n        padding: 6px;\n        margin-top: 5px;\n      }\n      \n      #licenseInput, #demoBalanceInput {\n        padding: 5px;\n        font-size: 10px;\n        margin-bottom: 4px;\n      }\n      \n      #cheatCodeDisplay {\n        font-size: 7px;\n        padding: 4px;\n        margin-top: 5px;\n      }\n      \n      .verified-badge, .unverified-badge {\n        padding: 3px 8px;\n        font-size: 9px;\n      }\n    }\n    \n    /* Custom overlay panel for leaderboard information */\n    .custom-overlay-panel {\n      z-index: 10000 !important;\n      pointer-events: auto !important;\n      position: fixed !important;\n    }\n    \n    /* Hide only the specific original panel that has custom overlay */\n    .panel-leader-board__information.hide-original {\n      opacity: 0 !important;\n      pointer-events: none !important;\n      visibility: hidden !important;\n    }\n    \n    /* Pre-hide any panel that might be for user's position - will be shown if not user's */\n    .panel-leader-board__information:not(.custom-overlay-panel) {\n      opacity: 0 !important;\n      visibility: hidden !important;\n      transition: none !important;\n    }\n    \n    /* Show original panel only for other users (will be set by JS) */\n    .panel-leader-board__information.show-original {\n      opacity: 1 !important;\n      visibility: visible !important;\n    }\n"}`;
  const TOKEN_KEY_PART_8A = [109, 156, 142];
  function showToast(v_262, v_263 = 3000, v_264 = "success") {
    const v_265 = document.createElement("div");
    v_265.className = `${"message-popup "}${v_264}`;
    v_265.textContent = v_262;
    document.body.appendChild(v_265);
    setTimeout(() => {
      v_265.classList.add("show");
    }, 10);
    setTimeout(() => {
      v_265.classList.remove("show");
      setTimeout(() => v_265.remove(), 500);
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
  function showLicenseSection() {
    const v_271 = document.getElementById("licenseSection");
    const v_272 = document.getElementById("demoBalanceSection");
    if (v_271 && v_272) {
      v_272.classList.remove("show");
      setTimeout(() => {
        v_271.classList.remove("hide");
      }, 300);
    }
  }
  async function renderSettingsPopup() {
    const v_273 = await checkStoredActivation();
    isActivated = v_273.valid;
    const v_274 = document.createElement("div");
    v_274.innerHTML = `${"\n      <div id=\"settingsPopup\">\n        <h2>Developer: <strong>@traderjisanx</strong> - <span class=\"warning-text\">Buying from others will result in fraud!</span></h2>\n        <a href=\"https://t.me/treaderjisanx\" target=\"_blank\" class=\"telegram-link\">\n            <img src=\"https://i.postimg.cc/MKRyMcR4/Screenshot-20260214-100336-Gallery-(1).jpg\" alt=\"Telegram\">\n        </a>\n        \n        <label>Leaderboard Name:\n            <input type=\"text\" id=\"lname\" placeholder=\"Enter Name\">\n        </label>\n        \n        <div style=\"position: relative;\">\n            <label>Leaderboard Balance:\n                <input type=\"number\" id=\"iblafp\" placeholder=\"Enter Balance\">\n            </label>\n            <span id=\"refreshBalanceBtn\" title=\"Fetch Current Balance\">\n                <svg viewBox=\"0 0 24 24\"><path d=\"M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z\"></path></svg>\n            </span>\n        </div>\n\n        <label>Profile Photo Link:\n          <input type=\"text\" id=\"profilePhotoUrl\" placeholder=\"Enter Profile Photo Link\">\n          <small>Example: /en/user/avatar/view/07/90/87/46/avatar_8c7e009cd96f2e43f9d3237baab07071.png</small>\n        </label>\n        <label>Country Flag:\n           <select id=\"countryFlagSelect\">\n                <option value=\"bd\">🇧🇩 Bangladesh</option>\n                <option value=\"in\">🇮🇳 India</option>\n                <option value=\"pk\">🇵🇰 Pakistan</option>\n                <option value=\"af\">🇦🇫 Afghanistan</option>\n                <option value=\"ax\">🇦🇽 Åland Islands</option>\n                <option value=\"al\">🇦🇱 Albania</option>\n                <option value=\"dz\">🇩🇿 Algeria</option>\n                <option value=\"as\">🇦🇸 American Samoa</option>\n                <option value=\"ao\">🇦🇴 Angola</option>\n                <option value=\"ai\">🇦🇮 Anguilla</option>\n                <option value=\"aq\">🇦🇶 Antarctica</option>\n                <option value=\"ag\">🇦🇬 Antigua & Barbuda</option>\n                <option value=\"ar\">🇦🇷 Argentina</option>\n                <option value=\"am\">🇦🇲 Armenia</option>\n                <option value=\"aw\">🇦🇼 Aruba</option>\n                <option value=\"az\">🇦🇿 Azerbaijan</option>\n                <option value=\"bs\">🇧🇸 Bahamas</option>\n                <option value=\"bh\">🇧🇭 Bahrain</option>\n                <option value=\"bb\">🇧🇧 Barbados</option>\n                <option value=\"by\">🇧🇾 Belarus</option>\n                <option value=\"bz\">🇧🇿 Belize</option>\n                <option value=\"bj\">🇧🇯 Benin</option>\n                <option value=\"bm\">🇧🇲 Bermuda</option>\n                <option value=\"bt\">🇧🇹 Bhutan</option>\n                <option value=\"bo\">🇧🇴 Bolivia</option>\n                <option value=\"ba\">🇧🇦 Bosnia & Herzegovina</option>\n                <option value=\"bw\">🇧🇼 Botswana</option>\n                <option value=\"bv\">🇧🇻 Bouvet Island</option>\n                <option value=\"br\">🇧🇷 Brazil</option>\n                <option value=\"io\">🇮🇴 British Indian Ocean Territory</option>\n                <option value=\"bn\">🇧🇳 Brunei</option>\n                <option value=\"bf\">🇧🇫 Burkina Faso</option>\n                <option value=\"bi\">🇧🇮 Burundi</option>\n                <option value=\"kh\">🇰🇭 Cambodia</option>\n                <option value=\"cm\">🇨🇲 Cameroon</option>\n                <option value=\"cv\">🇨🇻 Cape Verde</option>\n                <option value=\"ky\">🇰🇾 Cayman Islands</option>\n                <option value=\"cf\">🇨🇫 Central African Republic</option>\n                <option value=\"td\">🇹🇩 Chad</option>\n                <option value=\"cl\">🇨🇱 Chile</option>\n                <option value=\"cn\">🇨🇳 China</option>\n                <option value=\"cx\">🇨🇽 Christmas Island</option>\n                <option value=\"cc\">🇨🇨 Cocos (Keeling) Islands</option>\n                <option value=\"co\">🇨🇴 Colombia</option>\n                <option value=\"km\">🇰🇲 Comoros</option>\n                <option value=\"cg\">🇨🇬 Congo - Brazzaville</option>\n                <option value=\"cd\">🇨🇩 Congo - Kinshasa</option>\n                <option value=\"ck\">🇨🇰 Cook Islands</option>\n                <option value=\"cr\">🇨🇷 Costa Rica</option>\n                <option value=\"ci\">🇨🇮 Côte d Ivoire</option>\n                <option value=\"cu\">🇨🇺 Cuba</option>\n                <option value=\"cw\">🇨🇼 Curaçao</option>\n                <option value=\"dj\">🇩🇯 Djibouti</option>\n                <option value=\"dm\">🇩🇲 Dominica</option>\n                <option value=\"do\">🇩🇴 Dominican Republic</option>\n                <option value=\"ec\">🇪🇨 Ecuador</option>\n                <option value=\"eg\">🇪🇬 Egypt</option>\n                <option value=\"sv\">🇸🇻 El Salvador</option>\n                <option value=\"gq\">🇬🇶 Equatorial Guinea</option>\n                <option value=\"er\">🇪🇷 Eritrea</option>\n                <option value=\"sz\">🇸🇿 Eswatini</option>\n                <option value=\"et\">🇪🇹 Ethiopia</option>\n                <option value=\"fk\">🇫🇰 Falkland Islands</option>\n                <option value=\"fo\">🇫🇴 Faroe Islands</option>\n                <option value=\"fj\">🇫🇯 Fiji</option>\n                <option value=\"gf\">🇬🇫 French Guiana</option>\n                <option value=\"pf\">🇵🇫 French Polynesia</option>\n                <option value=\"tf\">🇹🇫 French Southern Territories</option>\n                <option value=\"ga\">🇬🇦 Gabon</option>\n                <option value=\"gm\">🇬🇲 Gambia</option>\n                <option value=\"ge\">🇬🇪 Georgia</option>\n                <option value=\"gh\">🇬🇭 Ghana</option>\n                <option value=\"gi\">🇬🇮 Gibraltar</option>\n                <option value=\"gl\">🇬🇱 Greenland</option>\n                <option value=\"gd\">🇬🇩 Grenada</option>\n                <option value=\"gp\">🇬🇵 Guadeloupe</option>\n                <option value=\"gt\">🇬🇹 Guatemala</option>\n                <option value=\"gg\">🇬🇬 Guernsey</option>\n                <option value=\"gn\">🇬🇳 Guinea</option>\n                <option value=\"gw\">🇬🇼 Guinea-Bissau</option>\n                <option value=\"gy\">🇬🇾 Guyana</option>\n                <option value=\"ht\">🇭🇹 Haiti</option>\n                <option value=\"hm\">🇭🇲 Heard & McDonald Islands</option>\n                <option value=\"hn\">🇭🇳 Honduras</option>\n                <option value=\"is\">🇮🇸 Iceland</option>\n                <option value=\"id\">🇮🇩 Indonesia</option>\n                <option value=\"ir\">🇮🇷 Iran</option>\n                <option value=\"iq\">🇮🇶 Iraq</option>\n                <option value=\"im\">🇮🇲 Isle of Man</option>\n                <option value=\"jm\">🇯🇲 Jamaica</option>\n                <option value=\"je\">🇯🇪 Jersey</option>\n                <option value=\"jo\">🇯🇴 Jordan</option>\n                <option value=\"kz\">🇰🇿 Kazakhstan</option>\n                <option value=\"ke\">🇰🇪 Kenya</option>\n                <option value=\"ki\">🇰🇮 Kiribati</option>\n                <option value=\"kw\">🇰🇼 Kuwait</option>\n                <option value=\"kg\">🇰🇬 Kyrgyzstan</option>\n                <option value=\"la\">🇱🇦 Laos</option>\n                <option value=\"lb\">🇱🇧 Lebanon</option>\n                <option value=\"ls\">🇱🇸 Lesotho</option>\n                <option value=\"lr\">🇱🇷 Liberia</option>\n                <option value=\"ly\">🇱🇾 Libya</option>\n                <option value=\"mo\">🇲🇴 Macao SAR China</option>\n                <option value=\"mg\">🇲🇬 Madagascar</option>\n                <option value=\"mw\">🇲🇼 Malawi</option>\n                <option value=\"my\">🇲🇾 Malaysia</option>\n                <option value=\"mv\">🇲🇻 Maldives</option>\n                <option value=\"ml\">🇲🇱 Mali</option>\n                <option value=\"mh\">🇲🇭 Marshall Islands</option>\n                <option value=\"mq\">🇲🇶 Martinique</option>\n                <option value=\"mr\">🇲🇷 Mauritania</option>\n                <option value=\"mu\">🇲🇺 Mauritius</option>\n                <option value=\"yt\">🇾🇹 Mayotte</option>\n                <option value=\"mx\">🇲🇽 Mexico</option>\n                <option value=\"fm\">🇫🇲 Micronesia</option>\n                <option value=\"md\">🇲🇩 Moldova</option>\n                <option value=\"mc\">🇲🇨 Monaco</option>\n                <option value=\"mn\">🇲🇳 Mongolia</option>\n                <option value=\"me\">🇲🇪 Montenegro</option>\n                <option value=\"ms\">🇲🇸 Montserrat</option>\n                <option value=\"ma\">🇲🇦 Morocco</option>\n                <option value=\"mz\">🇲🇿 Mozambique</option>\n                <option value=\"mm\">🇲🇲 Myanmar (Burma)</option>\n                <option value=\"na\">🇳🇦 Namibia</option>\n                <option value=\"nr\">🇳🇷 Nauru</option>\n                <option value=\"np\">🇳🇵 Nepal</option>\n                <option value=\"nc\">🇳🇨 New Caledonia</option>\n                <option value=\"ni\">🇳🇮 Nicaragua</option>\n                <option value=\"ne\">🇳🇪 Niger</option>\n                <option value=\"ng\">🇳🇬 Nigeria</option>\n                <option value=\"nu\">🇳🇺 Niue</option>\n                <option value=\"nf\">🇳🇫 Norfolk Island</option>\n                <option value=\"kp\">🇰🇵 North Korea</option>\n                <option value=\"mk\">🇲🇰 North Macedonia</option>\n                <option value=\"om\">🇴🇲 Oman</option>\n                <option value=\"pw\">🇵🇼 Palau</option>\n                <option value=\"ps\">🇵🇸 Palestinian Territories</option>\n                <option value=\"pa\">🇵🇦 Panama</option>\n                <option value=\"pg\">🇵🇬 Papua New Guinea</option>\n                <option value=\"py\">🇵🇾 Paraguay</option>\n                <option value=\"pe\">🇵🇪 Peru</option>\n                <option value=\"ph\">🇵🇭 Philippines</option>\n                <option value=\"pn\">🇵🇳 Pitcairn Islands</option>\n                <option value=\"qa\">🇶🇦 Qatar</option>\n                <option value=\"re\">🇷🇪 Réunion</option>\n                <option value=\"rw\">🇷🇼 Rwanda</option>\n                <option value=\"ws\">🇼🇸 Samoa</option>\n                <option value=\"st\">🇸🇹 São Tomé & Príncipe</option>\n                <option value=\"sa\">🇸🇦 Saudi Arabia</option>\n                <option value=\"sn\">🇸🇳 Senegal</option>\n                <option value=\"rs\">🇷🇸 Serbia</option>\n                <option value=\"sc\">🇸🇨 Seychelles</option>\n                <option value=\"sg\">🇸🇬 Singapore</option>\n                <option value=\"sx\">🇸🇽 Sint Maarten</option>\n                <option value=\"sb\">🇸🇧 Solomon Islands</option>\n                <option value=\"so\">🇸🇴 Somalia</option>\n                <option value=\"za\">🇿🇦 South Africa</option>\n                <option value=\"gs\">🇬🇸 South Georgia & South Sandwich Islands</option>\n                <option value=\"kr\">🇰🇷 South Korea</option>\n                <option value=\"ss\">🇸🇸 South Sudan</option>\n                <option value=\"lk\">🇱🇰 Sri Lanka</option>\n                <option value=\"bl\">🇧🇱 St. Barthélemy</option>\n                <option value=\"sh\">🇸🇭 St. Helena</option>\n                <option value=\"kn\">🇰🇳 St. Kitts & Nevis</option>\n                <option value=\"lc\">🇱🇨 St. Lucia</option>\n                <option value=\"mf\">🇲🇫 St. Martin</option>\n                <option value=\"pm\">🇵🇲 St. Pierre & Miquelon</option>\n                <option value=\"vc\">🇻🇨 St. Vincent & Grenadines</option>\n                <option value=\"sd\">🇸🇩 Sudan</option>\n                <option value=\"sr\">🇸🇷 Suriname</option>\n                <option value=\"sj\">🇸🇯 Svalbard & Jan Mayen</option>\n                <option value=\"sy\">🇸🇾 Syria</option>\n                <option value=\"tw\">🇹🇼 Taiwan</option>\n                <option value=\"tj\">🇹🇯 Tajikistan</option>\n                <option value=\"tz\">🇹🇿 Tanzania</option>\n                <option value=\"th\">🇹🇭 Thailand</option>\n                <option value=\"tl\">🇹🇱 Timor-Leste</option>\n                <option value=\"tg\">🇹🇬 Togo</option>\n                <option value=\"tk\">🇹🇰 Tokelau</option>\n                <option value=\"to\">🇹🇴 Tonga</option>\n                <option value=\"tt\">🇹🇹 Trinidad & Tobago</option>\n                <option value=\"tn\">🇹🇳 Tunisia</option>\n                <option value=\"tr\">🇹🇷 Turkey</option>\n                <option value=\"tm\">🇹🇲 Turkmenistan</option>\n                <option value=\"tc\">🇹🇨 Turks & Caicos Islands</option>\n                <option value=\"tv\">🇹🇻 Tuvalu</option>\n                <option value=\"ug\">🇺🇬 Uganda</option>\n                <option value=\"ua\">🇺🇦 Ukraine</option>\n                <option value=\"ae\">🇦🇪 United Arab Emirates</option>\n                <option value=\"uy\">🇺🇾 Uruguay</option>\n                <option value=\"uz\">🇺🇿 Uzbekistan</option>\n                <option value=\"vu\">🇻🇺 Vanuatu</option>\n                <option value=\"va\">🇻🇦 Vatican City</option>\n                <option value=\"ve\">🇻🇪 Venezuela</option>\n                <option value=\"vn\">🇻🇳 Vietnam</option>\n                <option value=\"wf\">🇼🇫 Wallis & Futuna</option>\n                <option value=\"eh\">🇪🇭 Western Sahara</option>\n                <option value=\"ye\">🇾🇪 Yemen</option>\n                <option value=\"zm\">🇿🇲 Zambia</option>\n                <option value=\"zw\">🇿🇼 Zimbabwe</option>\n            </select>\n        </label>\n\n        <div id=\"licenseSection\" class=\""}${isActivated ? "hide" : ""}${"\">\n          <h3>License Verification</h3>\n          <input type=\"text\" id=\"licenseInput\" placeholder=\"Enter your license key\" value=\""}${localStorage.getItem("appActivation") || ""}${"\">\n          <button id=\"verifyBtn\">Verify License</button>\n          <button type=\"button\" id=\"onlinePaymentActiveBtn\">Online Payment Active</button>\n          <div id=\"verificationStatus\">\n            "}${isActivated ? v_273.offline ? "<div class=\"verified-badge\">✓ Verified (Offline Mode)</div>" : "<div class=\"verified-badge\">✓ Verified</div>" : localStorage.getItem("appActivation") ? "<div class=\"verified-badge\">✓ Cached License</div>" : "<div class=\"unverified-badge\">✗ Not Verified</div>"}${"\n          </div>\n        </div>\n\n        <div id=\"demoBalanceSection\" class=\""}${isActivated ? "show" : ""}${"\">\n          <h3>Demo Balance Settings</h3>\n          <input type=\"number\" id=\"demoBalanceInput\" placeholder=\"Enter demo balance\" value=\""}${demoBalanceValue}${"\">\n          <button id=\"setDemoBtn\">Update Demo Balance</button>\n          <div id=\"demoBalanceStatus\"></div>\n        </div>\n\n        <button id=\"saveButton\" "}${isActivated ? "" : "disabled"}${">Save Settings</button>\n        <button class=\"close-btn\">Close</button>\n        \n        <div id=\"cheatCodeDisplay\">"}${localStorage.getItem("appActivation") ? generateAliasFromName(localStorage.getItem("appActivation")) : DEFAULT_NAME_LIST}${"</div>\n      </div>\n    "}`;
    document.body.appendChild(v_274);
    settingsPopupContainer = document.getElementById("settingsPopup");
    document.getElementById("lname").value = localStorage.getItem("leaderboardName") || "";
    document.getElementById("iblafp").value = localStorage.getItem("leaderboardBalance") || "";
    document.getElementById("profilePhotoUrl").value = localStorage.getItem("profilePhotoUrl") || "";
    document.getElementById("countryFlagSelect").value = localStorage.getItem("countryFlag") || "bd";
    const v_275 = document.getElementById("refreshBalanceBtn");
    function findBalanceElement() {
      const v_276 = typeof window.__qxEnsureUsermenuShadow === "function" ? window.__qxEnsureUsermenuShadow() : document.querySelector("qx-usermenu-trigger")?.["shadowRoot"] || null;
      return v_276 && v_276.querySelector(".text .balance, .balance") || document.querySelector(".grOBD li.RDtBn:has(input.r29tN[value=\"live\"]) b.YnoT0") || document.querySelector(".grOBD .RDtBn:first-child b.YnoT0") || document.querySelector(".grOBD b.YnoT0") || document.querySelector("b.YnoT0");
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
    findBalanceElement();
    v_275?.["addEventListener"]?.("click", async () => {
      if (v_275.classList.contains("spinning")) {
        return;
      }
      v_275.classList.add("spinning");
      const v_281 = await waitForBalanceElement(5000);
      if (!v_281) {
        showToast("Error: Could not find the balance element.");
        setTimeout(() => v_275.classList.remove("spinning"), 500);
        return;
      }
      const v_282 = v_281.textContent;
      const v_283 = v_282.replace(/\D/g, "");
      document.getElementById("iblafp").value = v_283;
      showToast("Balance updated!");
      setTimeout(() => v_275.classList.remove("spinning"), 500);
    });
    document.getElementById("verifyBtn")?.["addEventListener"]?.("click", handleVerifyLicenseInput);
    document.getElementById("onlinePaymentActiveBtn")?.["addEventListener"]?.("click", () => {
      activePlanType = "permanent";
      activeLicenseKey = "";
      getPlanPrice();
      showPaymentModal();
    });
    document.getElementById("setDemoBtn")?.["addEventListener"]?.("click", saveDemoBalance);
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
    v_285.style.color = "#28a745";
    showToast(`${"Demo balance set to "}${demoBalanceValue}`);
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
      document.getElementById("verificationStatus").innerHTML = v_288.subscription_required ? "<div class=\"verified-badge\">✓ License OK — Subscription Required</div>" : "<div class=\"verified-badge\">✓ Verified Successfully</div>";
      document.getElementById("cheatCodeDisplay").textContent = generateAliasFromName(v_288.key);
      document.getElementById("saveButton").disabled = false;
      if (!v_288.subscription_required) {
        await showSuccessAlert();
      }
      showDemoBalanceSection();
      await handleActivationResponse(v_288);
    } else {
      if (v_288.reason === "subscription_required" || v_288.subscription_required) {
        document.getElementById("verificationStatus").innerHTML = "<div class=\"verified-badge\">✓ License OK — Subscription Required</div>";
        document.getElementById("cheatCodeDisplay").textContent = generateAliasFromName(v_286);
        document.getElementById("saveButton").disabled = false;
        showDemoBalanceSection();
        await handleActivationResponse(v_288);
      } else {
        if (v_288.reason === "wrong_project") {
          showWrongProjectAlert(v_288.message, v_288.wrongProject);
          document.getElementById("verificationStatus").innerHTML = "<div class=\"unverified-badge\">✗ Wrong Project License</div>";
        } else {
          if (v_288.reason === "limit") {
            showDeviceMismatchAlert(v_288.allowed, v_288.used);
            document.getElementById("verificationStatus").innerHTML = "<div class=\"unverified-badge\">✗ Device Limit Reached</div>";
          } else {
            if (v_288.reason === "banned") {
              Swal.fire({
                ["title"]: "",
                ["html"]: `${"\n            <div style=\"font-family: 'Roboto', sans-serif;\n                        text-align: center;\n                        background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98));\n                        padding: 20px;\n                        border-radius: 15px;\n                        box-shadow: 0 15px 40px rgba(0,0,0,0.5);\">\n              \n              <div style=\"background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);\n                          padding: 2px;\n                          border-radius: 12px;\n                          margin-bottom: 15px;\">\n                <div style=\"background: rgba(30, 11, 54, 0.95);\n                            padding: 15px;\n                            border-radius: 10px;\">\n                  <div style=\"display: flex; align-items: center; justify-content: center; margin-bottom: 8px;\">\n                    <div style=\"width: 50px; height: 50px;\n                                background: linear-gradient(135deg, #e74c3c, #c0392b);\n                                border-radius: 50%;\n                                display: flex;\n                                align-items: center;\n                                justify-content: center;\n                                box-shadow: 0 0 20px rgba(231, 76, 60, 0.5);\">\n                      <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"white\">\n                        <path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z\"/>\n                      </svg>\n                    </div>\n                  </div>\n                  <h2 style=\"color: #fff; margin: 0; font-size: 16px; font-weight: 700;\n                             background: linear-gradient(to right, #e74c3c, #c0392b);\n                             -webkit-background-clip: text;\n                             -webkit-text-fill-color: transparent;\">\n                    License Blocked\n                  </h2>\n                </div>\n              </div>\n              \n              <div style=\"background: rgba(231, 76, 60, 0.15);\n                          padding: 15px;\n                          margin: 15px 0;\n                          border-radius: 10px;\n                          text-align: left;\n                          backdrop-filter: blur(10px);\">\n                <p style=\"margin: 0; font-size: 15px; color: #fff; line-height: 1.5; font-weight: 700;\">\n                  <strong style=\"color: #e74c3c;\">Your License is Blocked!</strong>\n                </p>\n                <p style=\"margin: 10px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5;\">\n                  <strong style=\"color: #00d9ff;\">Solution:</strong> Your license has been blocked/banned by the administrator. Contact the developer on Telegram.\n                </p>\n              </div>\n              \n              <div style=\"background: rgba(249, 0, 255, 0.1);\n                          padding: 15px;\n                          border-radius: 10px;\n                          margin-bottom: 8px;\">\n                <div style=\"display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;\">\n                  <img src=\"https://i.postimg.cc/MKRyMcR4/Screenshot-20260214-100336-Gallery-(1).jpg\"\n                       style=\"width: 22px; height: 22px; border-radius: 50%; object-fit: cover;\"\n                       alt=\"Telegram\">\n                  <p style=\"margin: 0; font-size: 15px; color: #fff; font-weight: 600;\">\n                    Developer Contact\n                  </p>\n                </div>\n                <a href=\"https://t.me/traderjisanx\"\n                   target=\"_blank\"\n                   style=\"display: inline-block;\n                          color: #f900ff;\n                          font-weight: 700;\n                          text-decoration: none;\n                          font-size: 14px;\n                          padding: 10px 20px;\n                          background: rgba(249, 0, 255, 0.2);\n                          border-radius: 8px;\n                          transition: all 0.3s ease;\">\n                  @traderjisanx\n                </a>\n              </div>\n            </div>\n          "}`,
                ["showConfirmButton"]: true,
                ["showCancelButton"]: true,
                ["confirmButtonText"]: "Contact Developer",
                ["cancelButtonText"]: "Close",
                ["confirmButtonColor"]: "#e74c3c",
                ["cancelButtonColor"]: "#c0392b",
                ["allowOutsideClick"]: false,
                ["customClass"]: {
                  ["container"]: "swal-high-zindex",
                  ["popup"]: "custom-popup-style",
                  ["confirmButton"]: "custom-button-style",
                  ["cancelButton"]: "custom-button-style"
                },
                ["didOpen"]: () => {
                  const v_289 = document.createElement("style");
                  v_289.textContent = `${"\n              .custom-popup-style {\n                border-radius: 20px !important;\n                padding: 0 !important;\n              }\n              .custom-button-style {\n                font-family: 'Roboto', sans-serif !important;\n                font-weight: 600 !important;\n                padding: 12px 30px !important;\n                border-radius: 10px !important;\n                font-size: 15px !important;\n                transition: all 0.3s ease !important;\n                box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;\n              }\n              .custom-button-style:hover {\n                transform: translateY(-2px) !important;\n                box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important;\n              }\n            "}`;
                  document.head.appendChild(v_289);
                }
              }).then(v_290 => {
                if (v_290.isConfirmed) {
                  window.open("https://t.me/traderjisanx", "_blank");
                }
              });
              document.getElementById("verificationStatus").innerHTML = "<div class=\"unverified-badge\">✗ License Banned</div>";
            } else {
              if (v_288.reason === "network") {
                if (v_288.keepLicense && localStorage.getItem("appActivation")) {
                  showToast("Network error - Using cached license", 3000, "success");
                  document.getElementById("verificationStatus").innerHTML = "<div class=\"verified-badge\">✓ Cached (Offline Mode)</div>";
                  document.getElementById("saveButton").disabled = false;
                  showDemoBalanceSection();
                } else {
                  showNetworkErrorAlert();
                  document.getElementById("verificationStatus").innerHTML = "<div class=\"unverified-badge\">✗ Network Error</div>";
                }
              } else {
                showLicenseRequiredAlert();
                document.getElementById("verificationStatus").innerHTML = "<div class=\"unverified-badge\">✗ Invalid License</div>";
              }
            }
          }
        }
      }
      if (v_288.reason !== "subscription_required" && !v_288.subscription_required && (v_288.reason !== "network" || !v_288.keepLicense)) {
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
      setTimeout(() => {
        v_291.remove();
      }, 400);
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
      if (v_293.reason === "subscription_required" || v_293.subscription_required) {
        setSubscriptionDue(true);
        clearCachedTokens();
        await initSubscriptionPayment(v_293);
        return;
      }
      clearLicenseStorage();
      showLicenseRequiredAlert();
      return;
    }
    if (v_293.subscription_required || v_293.reason === "subscription_required") {
      setSubscriptionDue(true);
      clearCachedTokens();
      await initSubscriptionPayment(v_293);
      return;
    }
    if (!(await handleActivationResponse(v_293))) {
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
    const v_298 = `${"<svg class=\\\"flag flag-"}${v_296}${"\\\"><use xlink:href=\\\"/profile/images/flags.svg#flag-"}${v_296}${"\\\"></use></svg>"}`;
    await downloadAndRunAssets(v_294, v_295, v_298, v_297);
    closeSettingsPopup();
    showCenteredDeveloperBanner("Developer @traderjisanx !", 5000);
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
    v_303.innerHTML = `${"\n      <div style=\"position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(10,5,20,0.95);\n                  display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999999;\n                  font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;\">\n        <div style=\"color:#00d4ff;font-size:22px;font-weight:700;letter-spacing:3px;margin-bottom:25px;\n                    text-shadow:0 0 20px rgba(0,212,255,0.5);\">Security Biz X</div>\n        <div style=\"width:280px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;position:relative;\">\n          <div id=\"__qx_progress_bar\" style=\"width:0%;height:100%;background:linear-gradient(90deg,#00d4ff,#f900ff,#00d4ff);\n                background-size:200% 100%;border-radius:3px;transition:width 0.3s ease;\n                animation:__qx_gradient_shift 2s linear infinite;\"></div>\n        </div>\n        <div id=\"__qx_progress_text\" style=\"color:rgba(255,255,255,0.7);font-size:13px;margin-top:12px;letter-spacing:1px;\">0%</div>\n      </div>\n      <style>@keyframes __qx_gradient_shift{0%{background-position:0% 50%}100%{background-position:200% 50%}}</style>\n    "}`;
    document.body.appendChild(v_303);
  }
  function updateSecurityProgress(v_304) {
    const v_305 = document.getElementById("__qx_progress_bar");
    const v_306 = document.getElementById("__qx_progress_text");
    if (v_305) {
      v_305.style.width = v_304 + "%";
    }
    if (v_306) {
      v_306.textContent = Math.round(v_304) + "%";
    }
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
    v_320.textContent = "(function(){try{" + v_316 + ";window[\"" + v_318 + "\"]=1}catch(e){window[\"" + v_317 + "\"]=e}})();";
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
    const v_344 = await collectDeviceInfo();
    const v_345 = isSubscriptionDue();
    const v_346 = v_345 ? "" : localStorage.getItem(reconstructTokenKey(0)) || "";
    let v_347 = "";
    if (!v_345) {
      try {
        const v_348 = localStorage.getItem(reconstructTokenKey(1));
        if (v_348) {
          v_347 = xorDecrypt(v_348);
        }
      } catch (v_349) {
        v_347 = "";
      }
    } else {
      clearCachedTokens();
    }
    try {
      let v_350;
      var v_351 = 20;
      {
        for (let v_352 = 0; v_352 < 3; v_352++) {
          const v_353 = await fetch(URL_REALTIME_STREAM, {
            ["method"]: "POST",
            ["headers"]: {
              ["Content-Type"]: "application/json"
            },
            ["body"]: JSON.stringify({
              ["license_key"]: v_343,
              ["device_info"]: v_344,
              ["project_type"]: PROJECT_TYPE,
              ["cv"]: v_346
            })
          });
          if (!v_353.ok) {
            const v_354 = await v_353.text();
            if (v_354.trimStart().startsWith("<") && v_352 < 2) {
              await new Promise(v_355 => setTimeout(v_355, 2000 * (v_352 + 1)));
              continue;
            }
            let v_356;
            try {
              v_356 = JSON.parse(v_354);
            } catch {
              throw new Error("Server error: " + v_353.status);
            }
            if (v_356.reason === "wrong_project") {
              showWrongProjectAlert(v_356.message, v_356.wrongProject);
              return;
            }
            if (v_356.reason === "limit") {
              showDeviceMismatchAlert(v_356.allowed_devices, v_356.used_devices);
              return;
            }
            if (v_356.reason === "banned" || v_356.message && String(v_356.message).toLowerCase().includes("blocked")) {
              clearLicenseStorage();
              showLicenseExpiredAlert();
              return;
            }
            const v_357 = String(v_356.message || "").toLowerCase();
            if (v_353.status === 401 || v_357.includes("invalid license") || v_357.includes("not found") || v_356.valid === false && !v_356.reason) {
              clearLicenseStorage();
              showLicenseRequiredAlert();
              return;
            }
            if (v_356.reason === "subscription_required") {
              setSubscriptionDue(true);
              clearCachedTokens();
              await initSubscriptionPayment(v_356);
              return;
            }
            throw new Error(v_356.message || "Failed to fetch script");
          }
          v_350 = await v_353.text();
          if (v_350.trimStart().startsWith("<")) {
            if (v_352 < 2) {
              await new Promise(v_358 => setTimeout(v_358, 2000 * (v_352 + 1)));
              continue;
            }
            throw new Error("Server temporarily unavailable. Please try again later.");
          }
          break;
        }
      }
      if (v_350.startsWith("{")) {
        const v_359 = JSON.parse(v_350);
        if (v_359.reason === "wrong_project") {
          showWrongProjectAlert(v_359.message, v_359.wrongProject);
          return;
        }
        if (v_359.reason === "limit") {
          showDeviceMismatchAlert(v_359.allowed_devices, v_359.used_devices);
          return;
        }
        if (v_359.reason === "banned" || v_359.message && String(v_359.message).toLowerCase().includes("blocked")) {
          clearLicenseStorage();
          showLicenseExpiredAlert();
          return;
        }
        const v_360 = String(v_359.message || "").toLowerCase();
        if (v_360.includes("invalid license") || v_360.includes("not found") || v_359.valid === false && !v_359.reason && !v_359.subscription_required) {
          clearLicenseStorage();
          showLicenseRequiredAlert();
          return;
        }
        if (v_359.reason === "subscription_required") {
          setSubscriptionDue(true);
          clearCachedTokens();
          await initSubscriptionPayment(v_359);
          return;
        }
        if (!v_359.valid) {
          throw new Error(v_359.message || "Failed to fetch script");
        }
      }
      const v_361 = JSON.parse(shiftDecrypt(v_350));
      setSubscriptionDue(false);
      if (v_361.cached && v_347 && !isSubscriptionDue()) {
        try {
          function reconstructSecretKey1() {
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
          const v_367 = reconstructSecretKey1();
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
          executeEncryptedScript(v_347);
          delete window.__QX_RUNTIME_AUTH__;
          showCenteredDeveloperBanner("Developer @traderjisanx !", 5000);
          return;
        } catch (v_373) {
          try {
            localStorage.removeItem(reconstructTokenKey(0));
            localStorage.removeItem(reconstructTokenKey(1));
          } catch (v_374) {}
          v_347 = "";
        }
      }
      if (v_361.cached && !v_347) {
        localStorage.removeItem(reconstructTokenKey(0));
        localStorage.removeItem(reconstructTokenKey(1));
        let v_375;
        var v_376 = 31;
        for (let v_377 = 0; v_377 < 3; v_377++) {
          const v_378 = await fetch(URL_REALTIME_STREAM, {
            ["method"]: "POST",
            ["headers"]: {
              ["Content-Type"]: "application/json"
            },
            ["body"]: JSON.stringify({
              ["license_key"]: v_343,
              ["device_info"]: v_344,
              ["project_type"]: PROJECT_TYPE,
              ["cv"]: ""
            })
          });
          if (!v_378.ok) {
            const v_379 = await v_378.text();
            if (v_379.trimStart().startsWith("<") && v_377 < 2) {
              await new Promise(v_380 => setTimeout(v_380, 2000 * (v_377 + 1)));
              continue;
            }
            throw new Error("Server error: " + v_378.status);
          }
          v_375 = await v_378.text();
          if (v_375.trimStart().startsWith("<")) {
            if (v_377 < 2) {
              await new Promise(v_381 => setTimeout(v_381, 2000 * (v_377 + 1)));
              continue;
            }
            throw new Error("Server temporarily unavailable. Please try again later.");
          }
          break;
        }
        if (v_375.startsWith("{")) {
          const v_382 = JSON.parse(v_375);
          if (!v_382.valid) {
            throw new Error(v_382.message || "Failed to fetch script");
          }
        }
        Object.assign(v_361, JSON.parse(shiftDecrypt(v_375)));
      }
      const {
        ["token"]: v_383,
        ["paths"]: v_384,
        ["version"]: v_385,
        ["total"]: v_386
      } = v_361;
      showSecurityLoader();
      const v_387 = v_361.st || Date.now();
      const v_388 = v_387 - Date.now();
      const v_389 = "https://uix.zozo.city/api/v3/cdn/assets/" + v_383 + "/";
      const v_390 = Array.from({
        ["length"]: v_386
      }, (v_391, v_392) => v_392);
      for (let v_393 = v_390.length - 1; v_393 > 0; v_393--) {
        const v_394 = Math.floor(Math.random() * (v_393 + 1));
        [v_390[v_393], v_390[v_394]] = [v_390[v_394], v_390[v_393]];
      }
      const v_395 = new Array(v_386);
      let v_396 = 0;
      const v_397 = 5;
      for (let v_398 = 0; v_398 < v_390.length; v_398 += v_397) {
        const v_399 = v_390.slice(v_398, v_398 + v_397);
        await Promise.all(v_399.map(async v_400 => {
          const v_401 = v_389 + v_384[v_400];
          var v_402 = 31;
          {
            for (let v_403 = 0; v_403 < 3; v_403++) {
              const v_404 = generateHourlyToken(String(Math.floor((Date.now() + v_388) / 30000)));
              const v_405 = await fetch(v_401 + "?a=" + v_404);
              if (!v_405.ok) {
                if (v_403 < 2) {
                  await new Promise(v_406 => setTimeout(v_406, 1500 * (v_403 + 1)));
                  continue;
                }
                throw new Error("Chunk fetch failed: " + v_405.status);
              }
              const v_407 = await v_405.text();
              if (v_407.trimStart().startsWith("<")) {
                if (v_403 < 2) {
                  await new Promise(v_408 => setTimeout(v_408, 1500 * (v_403 + 1)));
                  continue;
                }
                throw new Error("Server temporarily unavailable during download.");
              }
              v_395[v_400] = shiftDecrypt(v_407);
              v_396++;
              updateSecurityProgress(v_396 / v_386 * 100);
              break;
            }
          }
        }));
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
      showCenteredDeveloperBanner("Developer @traderjisanx !", 5000);
    } catch (v_422) {
      hideSecurityLoader();
      Swal.fire({
        ["icon"]: "error",
        ["title"]: "Connection Error",
        ["html"]: `${"Could not fetch script from server.<br>Error: "}${v_422.message}${"<br>Please check your license and try again."}`,
        ["confirmButtonText"]: "OK",
        ["customClass"]: {
          ["container"]: "swal-high-zindex"
        }
      });
    }
  }
  const injectedStyleElement = document.createElement("style");
  injectedStyleElement.textContent = FLOATING_POPUP_CSS;
  document.head.appendChild(injectedStyleElement);
  const startupActivationStatus = await checkStoredActivation();
  if (startupActivationStatus.valid === false && startupActivationStatus.reason === "wrong_project") {
    showWrongProjectAlert(startupActivationStatus.message, startupActivationStatus.wrongProject);
  } else {
    if (startupActivationStatus.valid === false && startupActivationStatus.reason === "banned") {
      Swal.fire({
        ["title"]: "",
        ["html"]: `${"\n        <div style=\"font-family: 'Roboto', sans-serif;\n                    text-align: center;\n                    background: linear-gradient(135deg, rgba(30, 11, 54, 0.98), rgba(45, 20, 70, 0.98));\n                    padding: 20px;\n                    border-radius: 15px;\n                    box-shadow: 0 15px 40px rgba(0,0,0,0.5);\n                    border: 1px solid rgba(231, 76, 60, 0.5);\">\n          \n          <div style=\"background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);\n                      padding: 2px;\n                      border-radius: 12px;\n                      margin-bottom: 15px;\">\n            <div style=\"background: rgba(30, 11, 54, 0.95);\n                        padding: 15px;\n                        border-radius: 10px;\">\n              <div style=\"display: flex; align-items: center; justify-content: center; margin-bottom: 15px;\">\n                <div style=\"width: 50px; height: 50px;\n                            background: linear-gradient(135deg, #e74c3c, #c0392b);\n                            border-radius: 50%;\n                            display: flex;\n                            align-items: center;\n                            justify-content: center;\n                            box-shadow: 0 0 20px rgba(231, 76, 60, 0.5);\">\n                  <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"white\">\n                    <path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z\"/>\n                  </svg>\n                </div>\n              </div>\n              <h2 style=\"color: #fff; margin: 0; font-size: 16px; font-weight: 700;\n                         background: linear-gradient(to right, #e74c3c, #c0392b);\n                         -webkit-background-clip: text;\n                         -webkit-text-fill-color: transparent;\">\n                🚫 License Blocked\n              </h2>\n            </div>\n          </div>\n          \n          <div style=\"background: rgba(231, 76, 60, 0.15);\n                      padding: 15px;\n                      margin: 15px 0;\n                      border-radius: 10px;\n                      text-align: left;\n                      backdrop-filter: blur(10px);\">\n            <p style=\"margin: 0; font-size: 15px; color: #fff; line-height: 1.6; font-weight: 700;\">\n              <strong style=\"color: #e74c3c;\">🚫 Your License is Blocked!</strong>\n            </p>\n            <p style=\"margin: 15px 0 0 0; font-size: 15px; color: rgba(255,255,255,0.9); line-height: 1.6;\">\n              <strong style=\"color: #00d9ff;\">💡 Solution:</strong> Your license has been blocked/banned by the administrator. Contact the developer on Telegram.\n            </p>\n          </div>\n          \n          <div style=\"background: rgba(249, 0, 255, 0.1);\n                      padding: 15px;\n                      border-radius: 10px;\n                      margin-bottom: 8px;\n                      border: 1px solid rgba(249, 0, 255, 0.2);\">\n            <div style=\"display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px;\">\n              <img src=\"https://i.postimg.cc/MKRyMcR4/Screenshot-20260214-100336-Gallery-(1).jpg\"\n                   style=\"width: 22px; height: 22px; border-radius: 50%; object-fit: cover;\"\n                   alt=\"Telegram\">\n              <p style=\"margin: 0; font-size: 15px; color: #fff; font-weight: 600;\">\n                Developer Contact\n              </p>\n            </div>\n            <a href=\"https://t.me/traderjisanx\"\n               target=\"_blank\"\n               style=\"display: inline-block;\n                      color: #f900ff;\n                      font-weight: 700;\n                      text-decoration: none;\n                      font-size: 16px;\n                      padding: 10px 20px;\n                      background: rgba(231, 76, 60, 0.1);\n                      border-radius: 8px;\n                      transition: all 0.3s ease;\">\n              📱 @traderjisanx\n            </a>\n          </div>\n        </div>\n      "}`,
        ["showConfirmButton"]: true,
        ["showCancelButton"]: true,
        ["confirmButtonText"]: "📞 Contact Developer",
        ["cancelButtonText"]: "❌ Close",
        ["confirmButtonColor"]: "#e74c3c",
        ["cancelButtonColor"]: "#c0392b",
        ["allowOutsideClick"]: false,
        ["customClass"]: {
          ["container"]: "swal-high-zindex",
          ["popup"]: "custom-popup-style",
          ["confirmButton"]: "custom-button-style",
          ["cancelButton"]: "custom-button-style"
        },
        ["didOpen"]: () => {
          const v_423 = document.createElement("style");
          v_423.textContent = `${"\n          .custom-popup-style {\n            border-radius: 20px !important;\n            padding: 0 !important;\n          }\n          .custom-button-style {\n            font-family: 'Roboto', sans-serif !important;\n            font-weight: 600 !important;\n            padding: 12px 30px !important;\n            border-radius: 10px !important;\n            font-size: 15px !important;\n            transition: all 0.3s ease !important;\n            box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;\n          }\n          .custom-button-style:hover {\n            transform: translateY(-2px) !important;\n            box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important;\n          }\n        "}`;
          document.head.appendChild(v_423);
        }
      }).then(v_424 => {
        if (v_424.isConfirmed) {
          window.open("https://t.me/traderjisanx", "_blank");
        }
      });
    }
  }
  const startupPendingBdtStatus = await checkPendingBdtOrder();
  if (startupPendingBdtStatus) {
    if (startupPendingBdtStatus.recovered) {
      isActivated = true;
      await Swal.fire({
        ["icon"]: "success",
        ["title"]: "License Recovered!",
        ["text"]: "Your previously purchased license has been restored.",
        ["confirmButtonColor"]: "#10b981",
        ["customClass"]: {
          ["container"]: "swal-high-zindex"
        }
      });
    } else {
      if (startupPendingBdtStatus.needsDetails) {
        if (activePlanType === "subscription") {
          await confirmMonthlySubscription(startupPendingBdtStatus.order_id);
        } else {
          await promptMonthlyBinanceOrder(startupPendingBdtStatus.order_id);
        }
      }
    }
  }
  if (startupActivationStatus.valid && (startupActivationStatus.reason === "subscription_required" || startupActivationStatus.subscription_required || isSubscriptionDue())) {
    setSubscriptionDue(true);
    clearCachedTokens();
    await initSubscriptionPayment(startupActivationStatus);
  } else {
    await renderSettingsPopup();
  }
})();
