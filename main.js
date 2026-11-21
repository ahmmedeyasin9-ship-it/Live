(function () {
  const TARGET_SELECTOR = ".VgpLl";
  const BADGE_ID = "custom-tier-badge";
  const DEFAULT_TEXT = "+0% profit";

  function applyTierByBalance(balance) {
    const el = document.querySelector(TARGET_SELECTOR);
    if (!el) return;

    const numBalance = Number(balance);
    const existingBadge = document.getElementById(BADGE_ID);

    if (isNaN(numBalance) || numBalance < 5000) {
      el.textContent = DEFAULT_TEXT;
      if (existingBadge) existingBadge.remove();
      return;
    }

    let profitText = "";
    let badgeLabel = "";
    let badgeBg = "";
    let badgeColor = "";
    let badgeBorder = "";

    if (numBalance >= 10000) {
      profitText = "+4% profit";
      badgeLabel = "VIP";
      badgeBg = "rgba(0, 229, 255, 0.15)";
      badgeColor = "#00E5FF";
      badgeBorder = "#00E5FF";
    } else {
      profitText = "+2% profit";
      badgeLabel = "PRO";
      badgeBg = "rgba(0, 255, 136, 0.15)";
      badgeColor = "#00FF88";
      badgeBorder = "#00FF88";
    }

    el.textContent = profitText;

    let badge = existingBadge;
    if (!badge) {
      badge = document.createElement("span");
      badge.id = BADGE_ID;
      badge.style.marginLeft = "8px";
      badge.style.padding = "2px 7px";
      badge.style.borderRadius = "4px";
      badge.style.fontSize = "11px";
      badge.style.fontWeight = "700";
      badge.style.letterSpacing = "0.5px";
      badge.style.display = "inline-block";
      badge.style.verticalAlign = "middle";
      el.insertAdjacentElement("afterend", badge);
    }

    badge.textContent = badgeLabel;
    badge.style.backgroundColor = badgeBg;
    badge.style.color = badgeColor;
    badge.style.border = `1px solid ${badgeBorder}`;
  }

  window.updateProfitTier = applyTierByBalance;

  const observer = new MutationObserver(() => {
    const el = document.querySelector(TARGET_SELECTOR);
    if (el && typeof window.__currentBalance !== "undefined") {
      applyTierByBalance(window.__currentBalance);
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
})();
