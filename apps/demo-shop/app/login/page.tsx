"use client";

import { useState } from "react";
import { login } from "@/lib/shop";

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

  if (user) return <p role="status">خوش آمدید · Welcome, {user}</p>;
  return (
    <>
      <h1>ورود · Login</h1>
      <form onSubmit={onSubmit} noValidate>
        <label>ایمیل · Email<input name="email" type="text" dir="ltr" required /></label>
        <label>رمز عبور · Password<input name="password" type="password" dir="ltr" required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button>ورود · Log in</button>
      </form>
    </>
  );
}
