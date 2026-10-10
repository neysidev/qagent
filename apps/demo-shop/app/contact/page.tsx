"use client";

import { useState } from "react";
import { hasBug } from "@/lib/shop";
import { Icon } from "../ui";

export default function ContactPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (hasBug("B4")) {
      setToast("پیام شما ارسال شد");
      setTimeout(() => {
        throw new TypeError("Cannot read properties of undefined (reading 'send')");
      });
      return;
    }
    const res = await fetch("/api/contact", { method: "POST", body: JSON.stringify(data) });
    if (res.ok) setToast("پیام شما ارسال شد");
    else setError("ارسال ناموفق بود، دوباره تلاش کنید");
  }

  return (
    <div className="form-card">
      <h1>تماس با ما</h1>
      <p className="muted">معمولا تا یک روز کاری پاسخ می‌دهیم</p>
      <form onSubmit={onSubmit}>
        <label>نام<input name="name" autoComplete="name" required /></label>
        <label>ایمیل<input name="email" type="email" dir="ltr" autoComplete="email" required /></label>
        <label>پیام<textarea name="message" rows={4} required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn block">ارسال پیام</button>
      </form>
      {toast && <div className="toast" role="status"><Icon name="check" size={18} />{toast}</div>}
    </div>
  );
}
