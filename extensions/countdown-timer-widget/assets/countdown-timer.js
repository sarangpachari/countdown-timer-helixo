/**
 * countdown-timer.js — Preact Widget
 * Shopify Countdown Timer — Theme App Extension
 *
 * Uses Preact (loaded via CDN in the Liquid block) to render a reactive
 * countdown timer. Fetches the active timer for the current shop from the
 * Node/Express backend API and updates the display every second.
 */

(function () {
  "use strict";

  // Preact is loaded globally via CDN in the Liquid block
  const { h, render, Component } = window.preact;

  /* ── Helpers ──────────────────────────────────────────────────────────── */

  function pad(n) {
    return String(Math.max(0, n)).padStart(2, "0");
  }

  function getTimeDiff(endDate) {
    const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds, totalSeconds };
  }

  /* ── Preact Components ────────────────────────────────────────────────── */

  /**
   * Segment — renders a single time unit (days, hrs, min, sec)
   */
  function Segment({ value, unit }) {
    return h(
      "div",
      { class: "ctw-segment" },
      h("span", { class: "ctw-segment__value" }, pad(value)),
      h("span", { class: "ctw-segment__unit" }, unit)
    );
  }

  function Separator() {
    return h("span", { class: "ctw-separator" }, ":");
  }

  /**
   * UrgencyBanner — notification banner shown when timer is near expiry
   */
  function UrgencyBanner() {
    return h("div", { class: "ctw-urgency-banner" }, "⚡ Hurry! Offer expires soon!");
  }

  /**
   * CountdownTimer — main Preact component
   * Manages its own tick interval and re-renders each second.
   */
  class CountdownTimer extends Component {
    constructor(props) {
      super(props);
      this.state = getTimeDiff(props.timer.endDate);
      this._interval = null;
    }

    componentDidMount() {
      this._interval = setInterval(() => {
        const diff = getTimeDiff(this.props.timer.endDate);
        this.setState(diff);
        if (diff.totalSeconds <= 0) {
          clearInterval(this._interval);
        }
      }, 1000);
    }

    componentWillUnmount() {
      clearInterval(this._interval);
    }

    render() {
      const { timer } = this.props;
      const { days, hours, minutes, seconds, totalSeconds } = this.state;
      const threshold = (timer.urgencyThresholdMinutes || 5) * 60;
      const isUrgent = totalSeconds > 0 && totalSeconds <= threshold;

      // Timer expired
      if (totalSeconds <= 0) {
        return h("div", { class: "ctw-expired" }, "⏱ Offer has expired");
      }

      const containerClass = [
        "ctw-container",
        `ctw-container--${timer.size || "medium"}`,
        isUrgent && timer.urgencyType === "color_pulse"
          ? "ctw-container--urgency-pulse"
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      return h(
        "div",
        {
          class: containerClass,
          style: { backgroundColor: timer.color || "#4A90E2" },
        },
        // Urgency notification banner
        isUrgent &&
          timer.urgencyType === "notification_banner" &&
          h(UrgencyBanner, null),

        // Promotion description label
        timer.description && h("div", { class: "ctw-label" }, timer.description),

        // Countdown digits
        h(
          "div",
          { class: "ctw-timer" },
          days > 0 && h(Segment, { value: days, unit: "days" }),
          days > 0 && h(Separator, null),
          h(Segment, { value: hours, unit: "hrs" }),
          h(Separator, null),
          h(Segment, { value: minutes, unit: "min" }),
          h(Separator, null),
          h(Segment, { value: seconds, unit: "sec" })
        )
      );
    }
  }

  /* ── Bootstrap ────────────────────────────────────────────────────────── */

  async function init() {
    const root = document.getElementById("countdown-timer-widget-root");
    if (!root) return;

    const shopDomain = root.getAttribute("data-shop");
    const apiBase = (root.getAttribute("data-api-url") || "").trim();

    if (!shopDomain) {
      console.warn("[CountdownTimer] No shop domain found on widget root.");
      return;
    }

    if (!apiBase) {
      console.warn(
        "[CountdownTimer] API Base URL not set. " +
          "Configure it in the Theme Editor block settings."
      );
      return;
    }

    try {
      const res = await fetch(
        `${apiBase}/api/widget/timers?shop=${encodeURIComponent(shopDomain)}`,
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { timer } = await res.json();

      if (!timer) {
        // No active timer for this shop — hide the root container
        root.style.display = "none";
        return;
      }

      // Mount the Preact component into the widget root
      render(h(CountdownTimer, { timer }), root);
    } catch (err) {
      console.error("[CountdownTimer] Failed to load timer:", err.message);
    }
  }

  // Wait for DOM if still loading
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
