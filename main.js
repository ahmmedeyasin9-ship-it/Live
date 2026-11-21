(function () {
  const PROFIT_SELECTOR = ".VgpLl";
  const BADGE_ID = "custom-tier-badge";
  const DEFAULT_TEXT = "+0% profit";

  function parseAmount(str) {
    if (!str) return null;
    const cleaned = String(str).replace(/[^0-9.,]/g, "").replace(/,/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  function extractAnyBalance() {
    const walker = document.createTreeWalker(
      document.body || document.documentElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    let fallbackAmount = null;

    while ((node = walker.nextNode())) {
      const raw = node.textContent.trim();
      if (!raw) continue;

      const match = raw.match(/^\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)$/);
      if (match) {
        const val = parseAmount(match[1]);
        if (val !== null) {
          const container = node.parentElement?.closest("button, div, a");
          const ctx = (container?.innerText || "").toLowerCase();

          if (ctx.includes("live") || ctx.includes("demo") || raw.includes("$")) {
            return val;
          }

          if (fallbackAmount === null) {
            fallbackAmount = val;
          }
        }
      }
    }

    const textMatch = (document.body?.innerText || "").match(
      /(?:live|demo|balance)[^\d$]{0,25}\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/i
    );
    if (textMatch) {
      const parsed = parseAmount(textMatch[1]);
      if (parsed !== null) return parsed;
    }

    return fallbackAmount;
  }

  function syncTierUI() {
    const el = document.querySelector(PROFIT_SELECTOR);
    if (!el) return;

    const balance = extractAnyBalance();
    const existingBadge = document.getElementById(BADGE_ID);

    if (balance === null || balance < 5000) {
      el.textContent = DEFAULT_TEXT;
      if (existingBadge) existingBadge.remove();
      return;
    }

    let profitText = "";
    let badgeText = "";
    let color = "";
    let bg = "";

    if (balance >= 10000) {
      profitText = "+4% profit";
      badgeText = "VIP";
      color = "#00E5FF";
      bg = "rgba(0, 229, 255, 0.14)";
    } else {
      profitText = "+2% profit";
      badgeText = "PRO";
      color = "#00FF88";
      bg = "rgba(0, 255, 136, 0.14)";
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
      badge.style.letterSpacing = "0.6px";
      badge.style.display = "inline-block";
      badge.style.verticalAlign = "middle";
      el.insertAdjacentElement("afterend", badge);
    }

    badge.textContent = badgeText;
    badge.style.color = color;
    badge.style.backgroundColor = bg;
    badge.style.border = `1px solid ${color}`;
  }

  syncTierUI();

  const observer = new MutationObserver(() => {
    syncTierUI();
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });

  setInterval(syncTierUI, 800);
})();
