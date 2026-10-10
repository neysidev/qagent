"use client";

import Link from "next/link";
import { useState } from "react";
import { signup } from "@/lib/shop";
import { Icon } from "../ui";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const err = signup(String(f.get("email")), String(f.get("password")));
    setError(err);
    setDone(!err);
  }

  if (done)
    return (
      <div className="empty" role="status">
        <span className="empty-icon"><Icon name="check" size={28} /></span>
        <h1>ثبت‌نام انجام شد</h1>
        <p className="muted">حساب شما ساخته شد</p>
        <Link href="/" className="btn">شروع خرید</Link>
      </div>
    );
  return (
    <div className="form-card">
      <h1>ساخت حساب</h1>
      <p className="muted">حساب دارید؟ <Link href="/login">وارد شوید</Link></p>
      <form onSubmit={onSubmit} noValidate>
        <label>نام<input name="name" autoComplete="name" required /></label>
        <label>ایمیل<input name="email" type="text" dir="ltr" autoComplete="email" required /></label>
        <label>رمز عبور<input name="password" type="password" dir="ltr" autoComplete="new-password" required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn block">ثبت‌نام</button>
      </form>
    </div>
  );
}
