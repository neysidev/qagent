"use client";

import Link from "next/link";
import { useState } from "react";
import { login } from "@/lib/shop";
import { Icon } from "../ui";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const err = login(email, String(f.get("password")));
    setError(err);
    if (!err) setUser(email);
  }

  if (user)
    return (
      <div className="empty" role="status">
        <span className="empty-icon"><Icon name="check" size={28} /></span>
        <h1>خوش آمدید</h1>
        <p className="muted" dir="ltr">{user}</p>
        <Link href="/" className="btn">ادامه خرید</Link>
      </div>
    );
  return (
    <div className="form-card">
      <h1>ورود</h1>
      <p className="muted">حساب ندارید؟ <Link href="/signup">ثبت‌نام کنید</Link></p>
      <form onSubmit={onSubmit} noValidate>
        <label>ایمیل<input name="email" type="text" dir="ltr" autoComplete="email" required /></label>
        <label>رمز عبور<input name="password" type="password" dir="ltr" autoComplete="current-password" required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn block">ورود</button>
      </form>
    </div>
  );
}
