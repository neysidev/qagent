"use client";

import { useState } from "react";
import { signup } from "@/lib/shop";

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

  if (done) return <p role="status">ثبت‌نام با موفقیت انجام شد · Account created successfully</p>;
  return (
    <>
      <h1>ثبت‌نام · Sign up</h1>
      <form onSubmit={onSubmit} noValidate>
        <label>نام · Name<input name="name" required /></label>
        <label>ایمیل · Email<input name="email" type="text" dir="ltr" required /></label>
        <label>رمز عبور · Password<input name="password" type="password" dir="ltr" required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button>ثبت‌نام · Sign up</button>
      </form>
    </>
  );
}
