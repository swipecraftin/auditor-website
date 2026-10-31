"use client";

import { useEffect, useState } from "react";

export function CopyEmail({ email, className = "" }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <a href={`mailto:${email}`} className="link-underline text-body text-ink">{email}</a>
      <button type="button" onClick={copy} className="btn label-mono border border-line px-3 py-2 text-muted">
        <span key={String(copied)} className="copy-label inline-block">{copied ? "Copied" : "Copy email"}</span>
      </button>
      <span className="sr-only" aria-live="polite">{copied ? "Email address copied" : ""}</span>
    </div>
  );
}
