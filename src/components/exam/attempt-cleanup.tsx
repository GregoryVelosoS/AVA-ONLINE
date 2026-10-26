"use client";

import { useEffect } from "react";

export function AttemptCleanup({ attemptId }: { attemptId: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(`ava_attempt_draft_${attemptId}`);
      localStorage.removeItem(`ava_feedback_draft_${attemptId}`);
    } catch {
      // ignore
    }
  }, [attemptId]);

  return null;
}
