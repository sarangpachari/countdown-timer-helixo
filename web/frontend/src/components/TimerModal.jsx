import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  FormLayout,
  TextField,
  Select,
  BlockStack,
  Text,
  InlineGrid,
  Banner,
} from "@shopify/polaris";

const SIZE_OPTIONS = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const POSITION_OPTIONS = [
  { label: "Top of page", value: "top" },
  { label: "Bottom of page", value: "bottom" },
  { label: "Inline (below Add to Cart)", value: "inline" },
];

const URGENCY_OPTIONS = [
  { label: "Color Pulse", value: "color_pulse" },
  { label: "Notification Banner", value: "notification_banner" },
  { label: "None", value: "none" },
];

const DEFAULT_FORM = {
  name: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  description: "",
  color: "#4A90E2",
  size: "medium",
  position: "bottom",
  urgencyType: "color_pulse",
};

function toISOString(date, time) {
  if (!date) return null;
  const t = time || "00:00";
  return new Date(`${date}T${t}:00`).toISOString();
}

function fromISOString(isoStr) {
  if (!isoStr) return { date: "", time: "" };
  const d = new Date(isoStr);
  const date = d.toISOString().split("T")[0];
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return { date, time: `${hours}:${minutes}` };
}

export default function TimerModal({ open, onClose, onSave, editTimer }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Populate form when editing
  useEffect(() => {
    if (editTimer) {
      const { date: startDate, time: startTime } = fromISOString(editTimer.startDate);
      const { date: endDate, time: endTime } = fromISOString(editTimer.endDate);
      setForm({
        name: editTimer.name || "",
        startDate,
        startTime,
        endDate,
        endTime,
        description: editTimer.description || "",
        color: editTimer.color || "#4A90E2",
        size: editTimer.size || "medium",
        position: editTimer.position || "bottom",
        urgencyType: editTimer.urgencyType || "color_pulse",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setFormError(null);
  }, [editTimer, open]);

  const handleChange = useCallback(
    (field) => (value) => setForm((prev) => ({ ...prev, [field]: value })),
    []
  );

  const handleSave = useCallback(async () => {
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Timer name is required.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setFormError("Start date and End date are required.");
      return;
    }

    const startISO = toISOString(form.startDate, form.startTime);
    const endISO = toISOString(form.endDate, form.endTime);

    if (new Date(startISO) >= new Date(endISO)) {
      setFormError("End date/time must be after start date/time.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        startDate: startISO,
        endDate: endISO,
        description: form.description,
        color: form.color,
        size: form.size,
        position: form.position,
        urgencyType: form.urgencyType,
      });
      onClose();
    } catch (err) {
      setFormError(err.message || "Failed to save timer.");
    } finally {
      setSaving(false);
    }
  }, [form, onSave, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTimer ? "Edit Timer" : "Create New Timer"}
      primaryAction={{
        content: editTimer ? "Save changes" : "Create timer",
        onAction: handleSave,
        loading: saving,
      }}
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {formError && (
            <Banner tone="critical" title="Error">
              <p>{formError}</p>
            </Banner>
          )}

          <TextField
            label="Timer name"
            value={form.name}
            onChange={handleChange("name")}
            autoComplete="off"
            requiredIndicator
            placeholder="e.g., Black Friday Sale"
          />

          {/* Start date & time */}
          <InlineGrid columns={2} gap="300">
            <TextField
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={handleChange("startDate")}
              autoComplete="off"
              requiredIndicator
            />
            <TextField
              label="Start time"
              type="time"
              value={form.startTime}
              onChange={handleChange("startTime")}
              autoComplete="off"
            />
          </InlineGrid>

          {/* End date & time */}
          <InlineGrid columns={2} gap="300">
            <TextField
              label="End date"
              type="date"
              value={form.endDate}
              onChange={handleChange("endDate")}
              autoComplete="off"
              requiredIndicator
            />
            <TextField
              label="End time"
              type="time"
              value={form.endTime}
              onChange={handleChange("endTime")}
              autoComplete="off"
            />
          </InlineGrid>

          <TextField
            label="Promotion description"
            value={form.description}
            onChange={handleChange("description")}
            multiline={3}
            autoComplete="off"
            placeholder="Describe the promotion shown alongside the timer…"
          />

          {/* Color picker */}
          <BlockStack gap="100">
            <Text variant="bodyMd" as="span" fontWeight="medium">
              Timer color
            </Text>
            <input
              type="color"
              id="timer-color-picker"
              value={form.color}
              onChange={(e) => handleChange("color")(e.target.value)}
              style={{
                width: "100%",
                height: "44px",
                border: "1px solid #c9cccf",
                borderRadius: "8px",
                cursor: "pointer",
                padding: "2px",
              }}
            />
          </BlockStack>

          <InlineGrid columns={2} gap="300">
            <Select
              label="Timer size"
              options={SIZE_OPTIONS}
              value={form.size}
              onChange={handleChange("size")}
            />
            <Select
              label="Timer position"
              options={POSITION_OPTIONS}
              value={form.position}
              onChange={handleChange("position")}
            />
          </InlineGrid>

          <Select
            label="Urgency notification"
            helpText="Visual alert shown when timer is within 5 minutes of expiry."
            options={URGENCY_OPTIONS}
            value={form.urgencyType}
            onChange={handleChange("urgencyType")}
          />
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
