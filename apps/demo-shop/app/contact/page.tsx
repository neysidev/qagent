"use client";

import { useState } from "react";
import { hasBug } from "@/lib/shop";

export default function ContactPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (hasBug("B4")) {
      // B4: shows success, but crashes before anything is sent.
      setToast("پیام شما ارسال شد · Message sent!");
      setTimeout(() => {
        throw new TypeError("Cannot read properties of undefined (reading 'send')");
      });
      return;
    }
    const res = await fetch("/api/contact", { method: "POST", body: JSON.stringify(data) });
    if (res.ok) setToast("پیام شما ارسال شد · Message sent!");
    else setError("ارسال ناموفق بود · Could not send message");
  }

  return (
    <>
      <h1>تماس با ما · Contact us</h1>
      <form onSubmit={onSubmit}>
        <label>نام · Name<input name="name" required /></label>
        <label>ایمیل · Email<input name="email" type="email" dir="ltr" required /></label>
        <label>پیام · Message<textarea name="message" rows={4} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button>ارسال · Send</button>
      </form>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}
