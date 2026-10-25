(function() {
  'use strict';
  const REQUIRED_PW = "qw12QW@#";
  
  // Prevent duplicate instances
  if (window.__QX_ENHANCED_CUSTOMIZER__) {
    const existing = document.getElementById("qx_customizer_modal");
    if (existing) {
      existing.style.display = existing.style.display === "none" ? "flex" : "none";
      return;
    }
  }
  window.__QX_ENHANCED_CUSTOMIZER__ = true;

  // Sound effects or feedback helper
  function notify(text, isError = false) {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 10000000;
      background: ${isError ? "linear-gradient(135deg, #ef4444, #991b1b)" : "linear-gradient(135deg, #10b981, #047857)"};
      color: #fff;
      padding: 12px 22px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.2);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = (isError ? "⚠️ " : "✓ ") + text;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // Country flags data
  const COUNTRIES = [{"code":"bd","name":"Bangladesh","flag":"🇧🇩"},{"code":"in","name":"India","flag":"🇮🇳"},{"code":"pk","name":"Pakistan","flag":"🇵🇰"},{"code":"us","name":"United States","flag":"🇺🇸"},{"code":"gb","name":"United Kingdom","flag":"🇬🇧"},{"code":"ae","name":"United Arab Emirates","flag":"🇦🇪"},{"code":"sa","name":"Saudi Arabia","flag":"🇸🇦"},{"code":"br","name":"Brazil","flag":"🇧🇷"},{"code":"id","name":"Indonesia","flag":"🇮🇩"},{"code":"my","name":"Malaysia","flag":"🇲🇾"},{"code":"ng","name":"Nigeria","flag":"🇳🇬"},{"code":"tr","name":"Turkey","flag":"🇹🇷"},{"code":"ru","name":"Russia","flag":"🇷🇺"},{"code":"de","name":"Germany","flag":"🇩🇪"},{"code":"fr","name":"France","flag":"🇫🇷"},{"code":"es","name":"Spain","flag":"🇪🇸"},{"code":"it","name":"Italy","flag":"🇮🇹"},{"code":"ca","name":"Canada","flag":"🇨🇦"},{"code":"au","name":"Australia","flag":"🇦🇺"},{"code":"za","name":"South Africa","flag":"🇿🇦"},{"code":"eg","name":"Egypt","flag":"🇪🇬"},{"code":"ph","name":"Philippines","flag":"🇵🇭"},{"code":"vn","name":"Vietnam","flag":"🇻🇳"},{"code":"th","name":"Thailand","flag":"🇹🇭"},{"code":"co","name":"Colombia","flag":"🇨🇴"},{"code":"ar","name":"Argentina","flag":"🇦🇷"},{"code":"mx","name":"Mexico","flag":"🇲🇽"},{"code":"ke","name":"Kenya","flag":"🇰🇪"},{"code":"gh","name":"Ghana","flag":"🇬🇭"},{"code":"np","name":"Nepal","flag":"🇳🇵"},{"code":"lk","name":"Sri Lanka","flag":"🇱🇰"},{"code":"af","name":"Afghanistan","flag":"🇦🇫"},{"code":"qa","name":"Qatar","flag":"🇶🇦"},{"code":"kw","name":"Kuwait","flag":"🇰🇼"},{"code":"om","name":"Oman","flag":"🇴🇲"},{"code":"bh","name":"Bahrain","flag":"🇧🇭"},{"code":"sg","name":"Singapore","flag":"🇸🇬"}];

  // 1. Password Verification Modal
  function showPasswordModal(onSuccess) {
    // If already verified in this session, skip
    if (sessionStorage.getItem("qx_pw_auth") === "granted") {
      onSuccess();
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "qx_pw_overlay";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(8, 11, 20, 0.88);
      backdrop-filter: blur(10px);
      z-index: 99999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 16px;
      box-sizing: border-box;
    `;

    overlay.innerHTML = `
      <div style="
        background: linear-gradient(145deg, #161c2e 0%, #0c101d 100%);
        border: 1px solid rgba(0, 212, 255, 0.35);
        border-radius: 20px;
        padding: 30px 24px;
        max-width: 420px;
        width: 100%;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 212, 255, 0.2);
        text-align: center;
        color: #fff;
        position: relative;
        animation: qxPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      ">
        <style>
          @keyframes qxPopIn {
            from { transform: scale(0.92); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes qxShake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
        </style>
        
        <div style="
          width: 60px;
          height: 60px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, #00d4ff, #8b5cf6);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
        ">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>

        <h2 style="margin: 0 0 6px; font-size: 22px; font-weight: 800; background: linear-gradient(90deg, #00d4ff, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          QX Security Lock
        </h2>
        <p style="margin: 0 0 20px; font-size: 13px; color: #94a3b8; line-height: 1.4;">
          পাসওয়ার্ড দিয়ে বুকমার্ক আনলক করুন<br>Enter password to unlock Quotex Customizer
        </p>

        <div style="margin-bottom: 16px; position: relative; text-align: left;">
          <input 
            type="password" 
            id="qx_pw_input" 
            placeholder="পাসওয়ার্ড লিখুন..." 
            style="
              width: 100%;
              padding: 13px 44px 13px 14px;
              background: rgba(15, 23, 42, 0.85);
              border: 1.5px solid rgba(255, 255, 255, 0.15);
              border-radius: 12px;
              color: #fff;
              font-size: 15px;
              box-sizing: border-box;
              outline: none;
              transition: all 0.2s;
            "
          />
          <button 
            type="button" 
            id="qx_toggle_pw_visibility" 
            style="
              position: absolute;
              right: 12px;
              top: 50%;
              transform: translateY(-50%);
              background: none;
              border: none;
              color: #94a3b8;
              cursor: pointer;
              font-size: 14px;
              padding: 4px;
            "
          >👁️</button>
        </div>

        <div id="qx_pw_error" style="color: #f87171; font-size: 12px; font-weight: 600; min-height: 20px; margin-bottom: 12px;"></div>

        <div style="display: flex; gap: 10px;">
          <button 
            type="button" 
            id="qx_pw_cancel" 
            style="
              flex: 1;
              padding: 12px;
              background: rgba(255, 255, 255, 0.08);
              border: 1px solid rgba(255, 255, 255, 0.15);
              border-radius: 12px;
              color: #cbd5e1;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            "
          >Cancel</button>

          <button 
            type="button" 
            id="qx_pw_submit" 
            style="
              flex: 2;
              padding: 12px;
              background: linear-gradient(135deg, #00d4ff 0%, #3b82f6 50%, #8b5cf6 100%);
              border: none;
              border-radius: 12px;
              color: #fff;
              font-size: 14px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 4px 15px rgba(0, 212, 255, 0.35);
              transition: all 0.2s;
            "
          >Unlock / আনলক</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = overlay.querySelector("#qx_pw_input");
    const errorMsg = overlay.querySelector("#qx_pw_error");
    const submitBtn = overlay.querySelector("#qx_pw_submit");
    const cancelBtn = overlay.querySelector("#qx_pw_cancel");
    const toggleBtn = overlay.querySelector("#qx_toggle_pw_visibility");
    const box = overlay.firstElementChild;

    input.focus();

    toggleBtn.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
    });

    cancelBtn.addEventListener("click", () => {
      overlay.remove();
    });

    function checkPassword() {
      const val = input.value.trim();
      if (val === REQUIRED_PW) {
        sessionStorage.setItem("qx_pw_auth", "granted");
        notify("Access Granted / আনলক সফল হয়েছে!", false);
        overlay.remove();
        onSuccess();
      } else {
        errorMsg.textContent = "ভুল পাসওয়ার্ড! Incorrect Password.";
        box.style.animation = "qxShake 0.4s ease";
        input.style.borderColor = "#ef4444";
        setTimeout(() => {
          box.style.animation = "";
        }, 400);
      }
    }

    submitBtn.addEventListener("click", checkPassword);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") checkPassword();
    });
  }

  // 2. Quotex DOM Manipulator Functions
  function formatMoney(amount, currency = "$") {
    const num = parseFloat(amount) || 0;
    return currency + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getQuotexCurrentBalance() {
    // Check shadow dom or normal DOM
    try {
      const trigger = document.querySelector("qx-usermenu-trigger");
      const root = trigger ? (trigger.shadowRoot || trigger) : document;
      const balanceEl = root.querySelector(".usermenu__info-balance, .header__balance-val, [class*='balance-value'], [class*='balance']");
      if (balanceEl) {
        const text = balanceEl.textContent.replace(/[^0-9.]/g, "");
        if (text) return text;
      }
    } catch(e) {}
    return localStorage.getItem("demoBalance") || "12500";
  }

  function applyQuotexDOMChanges() {
    const name = localStorage.getItem("leaderboardName") || "";
    const balance = localStorage.getItem("leaderboardBalance") || "";
    const flag = localStorage.getItem("countryFlag") || "bd";
    const photo = localStorage.getItem("profilePhotoUrl") || "";
    const demoBal = localStorage.getItem("demoBalance") || "";

    // 1. Update Header / User Menu
    const trigger = document.querySelector("qx-usermenu-trigger");
    const roots = [document];
    if (trigger && trigger.shadowRoot) roots.push(trigger.shadowRoot);

    roots.forEach(root => {
      // User name
      if (name) {
        root.querySelectorAll(".usermenu__info-name, .user-name, [class*='user-name']").forEach(el => {
          if (el.textContent !== name) el.textContent = name;
        });
      }

      // Profile avatar
      if (photo) {
        root.querySelectorAll(".usermenu__info-avatar img, img[alt*='avatar'], .avatar img").forEach(img => {
          if (img.src !== photo) img.src = photo;
        });
      }

      // Demo/Live Balance in header
      if (demoBal) {
        root.querySelectorAll(".usermenu__info-balance, .header__balance-val, .balance-val, [class*='balance-value']").forEach(el => {
          const formatted = formatMoney(demoBal);
          if (el.textContent.trim() !== formatted) el.textContent = formatted;
        });
      }
    });

    // 2. Update Leaderboard if visible
    if (name || balance || flag) {
      document.querySelectorAll(".position__header-name, .leaderboard-table__name, .leaderboard-user__name").forEach(el => {
        if (name && el.textContent !== name) el.textContent = name;
      });

      document.querySelectorAll(".position__header-balance, .leaderboard-table__profit, .leaderboard-user__profit").forEach(el => {
        if (balance) {
          const formatted = formatMoney(balance);
          if (el.textContent !== formatted) el.textContent = formatted;
        }
      });

      if (flag) {
        document.querySelectorAll("svg.flag use").forEach(use => {
          const targetHref = `/profile/images/flags.svg#flag-${flag}`;
          if (use.getAttribute("xlink:href") !== targetHref) {
            use.setAttribute("xlink:href", targetHref);
          }
        });
      }
    }
  }

  // 3. Persistent MutationObserver
  let observer = null;
  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => {
      applyQuotexDOMChanges();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    setInterval(applyQuotexDOMChanges, 800);
  }

  // 4. Main Customizer Settings Panel
  function showCustomizerPanel() {
    let modal = document.getElementById("qx_customizer_modal");
    if (modal) {
      modal.style.display = "flex";
      return;
    }

    modal = document.createElement("div");
    modal.id = "qx_customizer_modal";
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(10, 15, 28, 0.75);
      backdrop-filter: blur(8px);
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 16px;
      box-sizing: border-box;
    `;

    const savedName = localStorage.getItem("leaderboardName") || "";
    const savedBal = localStorage.getItem("leaderboardBalance") || "";
    const savedFlag = localStorage.getItem("countryFlag") || "bd";
    const savedPhoto = localStorage.getItem("profilePhotoUrl") || "";
    const savedDemo = localStorage.getItem("demoBalance") || "12500";

    const optionsHtml = COUNTRIES.map(c => 
      `<option value="${c.code}" ${c.code === savedFlag ? "selected" : ""}>${c.flag} ${c.name}</option>`
    ).join("");

    modal.innerHTML = `
      <div style="
        background: linear-gradient(145deg, #161c2e 0%, #0c101d 100%);
        border: 1px solid rgba(0, 212, 255, 0.3);
        border-radius: 20px;
        padding: 24px;
        max-width: 480px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 212, 255, 0.15);
        color: #fff;
        position: relative;
        box-sizing: border-box;
      ">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 20px;">⚡</span>
              <h2 style="margin: 0; font-size: 19px; font-weight: 800; background: linear-gradient(90deg, #00d4ff, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                Quotex Pro Customizer
              </h2>
            </div>
            <span style="display: inline-block; margin-top: 4px; font-size: 11px; padding: 2px 8px; border-radius: 20px; background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 600;">
              ✓ Password Unlocked & No License Restrictions
            </span>
          </div>
          <button id="qx_close_modal_btn" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px;">✕</button>
        </div>

        <!-- Form fields -->
        <div style="display: flex; flex-direction: column; gap: 14px; text-align: left;">
          
          <!-- Leaderboard Name -->
          <div>
            <label style="font-size: 12px; font-weight: 600; color: #94a3b8; display: block; margin-bottom: 5px;">
              Leaderboard / User Name:
            </label>
            <input 
              type="text" 
              id="qx_input_name" 
              value="${savedName}" 
              placeholder="e.g. VIP Trader BD" 
              style="width: 100%; padding: 10px 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; font-size: 14px; box-sizing: border-box; outline: none;"
            />
          </div>

          <!-- Leaderboard Balance & Quick Fetch -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <label style="font-size: 12px; font-weight: 600; color: #94a3b8;">
                Leaderboard Profit / Balance ($):
              </label>
              <button 
                type="button" 
                id="qx_fetch_balance_btn" 
                style="background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 6px; color: #00d4ff; font-size: 11px; padding: 3px 8px; cursor: pointer; font-weight: 600;"
              >
                🔄 Fetch Current
              </button>
            </div>
            <input 
              type="number" 
              id="qx_input_balance" 
              value="${savedBal}" 
              placeholder="e.g. 52400" 
              style="width: 100%; padding: 10px 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; font-size: 14px; box-sizing: border-box; outline: none;"
            />
          </div>

          <!-- Country Flag -->
          <div>
            <label style="font-size: 12px; font-weight: 600; color: #94a3b8; display: block; margin-bottom: 5px;">
              Country Flag:
            </label>
            <select 
              id="qx_select_flag" 
              style="width: 100%; padding: 10px 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; font-size: 14px; box-sizing: border-box; outline: none;"
            >
              ${optionsHtml}
            </select>
          </div>

          <!-- Profile Photo URL -->
          <div>
            <label style="font-size: 12px; font-weight: 600; color: #94a3b8; display: block; margin-bottom: 5px;">
              Profile Photo URL:
            </label>
            <input 
              type="text" 
              id="qx_input_photo" 
              value="${savedPhoto}" 
              placeholder="Image link / URL" 
              style="width: 100%; padding: 10px 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; font-size: 14px; box-sizing: border-box; outline: none;"
            />
          </div>

          <!-- Demo Balance Customizer -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px;">
            <label style="font-size: 12px; font-weight: 700; color: #38bdf8; display: block; margin-bottom: 6px;">
              Demo Account Display Balance ($):
            </label>
            <div style="display: flex; gap: 8px;">
              <input 
                type="number" 
                id="qx_input_demo_balance" 
                value="${savedDemo}" 
                placeholder="10000" 
                style="flex: 1; padding: 10px 12px; background: #0f172a; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: #fff; font-size: 14px; box-sizing: border-box; outline: none;"
              />
              <button 
                type="button" 
                id="qx_apply_demo_btn" 
                style="padding: 10px 16px; background: #0284c7; border: none; border-radius: 10px; color: #fff; font-weight: 700; font-size: 13px; cursor: pointer;"
              >Set</button>
            </div>
            <small style="color: #64748b; font-size: 11px; margin-top: 4px; display: block;">Changes displayed balance instantly in Quotex header.</small>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 10px; margin-top: 6px;">
            <button 
              type="button" 
              id="qx_save_btn" 
              style="
                flex: 1;
                padding: 13px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                border: none;
                border-radius: 12px;
                color: #fff;
                font-size: 15px;
                font-weight: 800;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
                transition: all 0.2s;
              "
            >
              💾 Save &amp; Apply Changes
            </button>
          </div>
        </div>

        <div style="margin-top: 16px; font-size: 11px; color: #64748b; text-align: center;">
          Quotex Bookmarklet v3.0 • Unlocked with Password: <strong style="color: #38bdf8;">${REQUIRED_PW}</strong>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add Floating Toggle Badge on Quotex screen
    let badge = document.getElementById("qx_floating_toggle_badge");
    if (!badge) {
      badge = document.createElement("button");
      badge.id = "qx_floating_toggle_badge";
      badge.innerHTML = "⚡ QX Tools";
      badge.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 9999998;
        background: linear-gradient(135deg, #00d4ff, #8b5cf6);
        color: #fff;
        border: none;
        padding: 8px 14px;
        border-radius: 30px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
      `;
      badge.addEventListener("click", () => {
        modal.style.display = modal.style.display === "none" ? "flex" : "none";
      });
      document.body.appendChild(badge);
    }

    // Event listeners inside modal
    modal.querySelector("#qx_close_modal_btn").addEventListener("click", () => {
      modal.style.display = "none";
    });

    modal.querySelector("#qx_fetch_balance_btn").addEventListener("click", () => {
      const cur = getQuotexCurrentBalance();
      modal.querySelector("#qx_input_balance").value = cur;
      notify("Fetched live balance: $" + cur);
    });

    modal.querySelector("#qx_apply_demo_btn").addEventListener("click", () => {
      const val = modal.querySelector("#qx_input_demo_balance").value;
      if (val) {
        localStorage.setItem("demoBalance", val);
        applyQuotexDOMChanges();
        notify("Demo Balance set to " + formatMoney(val));
      }
    });

    modal.querySelector("#qx_save_btn").addEventListener("click", () => {
      const name = modal.querySelector("#qx_input_name").value.trim();
      const bal = modal.querySelector("#qx_input_balance").value.trim();
      const flag = modal.querySelector("#qx_select_flag").value;
      const photo = modal.querySelector("#qx_input_photo").value.trim();
      const demo = modal.querySelector("#qx_input_demo_balance").value.trim();

      if (name) localStorage.setItem("leaderboardName", name);
      if (bal) localStorage.setItem("leaderboardBalance", bal);
      if (flag) localStorage.setItem("countryFlag", flag);
      if (photo) localStorage.setItem("profilePhotoUrl", photo);
      if (demo) localStorage.setItem("demoBalance", demo);

      applyQuotexDOMChanges();
      startObserver();
      notify("Settings Saved & Applied to Quotex!", false);
      modal.style.display = "none";
    });

    // Initial DOM update
    applyQuotexDOMChanges();
    startObserver();
  }

  // Run Flow: First verify password, then launch customizer
  showPasswordModal(showCustomizerPanel);
})();
