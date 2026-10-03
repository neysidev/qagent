"use client";

import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  return (
    <>
      <h1>تسویه حساب · Checkout</h1>
      <form onSubmit={(e) => { e.preventDefault(); router.push("/payment"); }}>
        <label>نام و نام خانوادگی · Full name<input name="name" required /></label>
        <label>موبایل · Mobile<input name="mobile" dir="ltr" placeholder="09xxxxxxxxx" required /></label>
        <label>آدرس · Address<textarea name="address" rows={3} required /></label>
        <button>ادامه به پرداخت · Continue to payment</button>
      </form>
    </>
  );
}
