import Link from "next/link";
import { Icon } from "../ui";

export default function PaymentPage() {
  return (
    <div className="empty">
      <span className="empty-icon"><Icon name="check" size={28} /></span>
      <h1>درگاه پرداخت آزمایشی</h1>
      <p className="muted">این درگاه نمایشی است و هیچ پرداختی انجام نمی‌شود</p>
      <Link href="/" className="btn secondary">بازگشت به فروشگاه</Link>
    </div>
  );
}
