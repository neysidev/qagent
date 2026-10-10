"use client";

import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  return (
    <div className="form-card">
      <h1>اطلاعات ارسال</h1>
      <p className="muted">سفارش به این آدرس فرستاده می‌شود</p>
      <form onSubmit={(e) => { e.preventDefault(); router.push("/payment"); }}>
        <label>نام و نام خانوادگی<input name="name" autoComplete="name" required /></label>
        <label>موبایل<input name="mobile" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="09xxxxxxxxx" required /></label>
        <label>آدرس<textarea name="address" rows={3} autoComplete="street-address" required /></label>
        <button className="btn block">ادامه به پرداخت</button>
      </form>
    </div>
  );
}
