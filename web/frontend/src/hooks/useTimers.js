import { useState, useCallback } from "react";

const API_BASE = "/api/timers";

/**
 * Wrapper around authenticated fetch for Shopify embedded apps.
 * In a real embedded app this would use App Bridge's authenticatedFetch.
 * For dev/standalone testing it falls through to normal fetch.
 */
const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${response.status}`);
  }

  return response.json();
};

export function useTimers() {
  const [timers, setTimers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTimers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(API_BASE);
      setTimers(data.timers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTimer = useCallback(async (timerData) => {
    const data = await apiFetch(API_BASE, {
      method: "POST",
      body: JSON.stringify(timerData),
    });
    setTimers((prev) => [data.timer, ...prev]);
    return data.timer;
  }, []);

  const updateTimer = useCallback(async (id, timerData) => {
    const data = await apiFetch(`${API_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(timerData),
    });
    setTimers((prev) =>
      prev.map((t) => (t._id === id ? data.timer : t))
    );
    return data.timer;
  }, []);

  const deleteTimer = useCallback(async (id) => {
    await apiFetch(`${API_BASE}/${id}`, { method: "DELETE" });
    setTimers((prev) => prev.filter((t) => t._id !== id));
  }, []);

  return {
    timers,
    loading,
    error,
    fetchTimers,
    createTimer,
    updateTimer,
    deleteTimer,
  };
}
