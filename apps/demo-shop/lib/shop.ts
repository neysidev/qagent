export type BugId = "B1" | "B2" | "B3" | "B4" | "B5";
export type Product = { id: string; name: string; nameEn: string; price: number; description: string; tag: string; tone: string; icon: string };
export type CartItem = { id: string; qty: number };
type User = { email: string; password: string };

export const products: Product[] = [
  { id: "1", name: "ماگ سرامیکی", nameEn: "Ceramic Mug", price: 280_000, tag: "دست‌ساز", tone: "#f3d9c4", icon: "mug", description: "ماگ لعابی ۳۵۰ میلی‌لیتری، ساخته شده در کارگاه سفال لالجین" },
  { id: "2", name: "دفترچه چرمی", nameEn: "Leather Notebook", price: 450_000, tag: "پرفروش", tone: "#e6d3bd", icon: "book", description: "دفترچه A5 با جلد چرم طبیعی و ۱۹۲ برگ کاغذ کرم" },
  { id: "3", name: "چای ارل گری", nameEn: "Earl Grey Tea", price: 190_000, tag: "تازه", tone: "#d8e4cf", icon: "leaf", description: "۲۵۰ گرم چای سیاه با عطر برگاموت، مناسب دم‌کردن آرام" },
  { id: "4", name: "شمع معطر", nameEn: "Scented Candle", price: 320_000, tag: "دست‌ساز", tone: "#f1e1b8", icon: "flame", description: "شمع سویا با رایحه وانیل و حدود ۴۰ ساعت سوختن" },
  { id: "5", name: "کاسه سفالی", nameEn: "Clay Bowl", price: 360_000, tag: "محدود", tone: "#ecd0c6", icon: "bowl", description: "کاسه سفالی لعاب‌دار، مناسب سالاد و میوه" },
  { id: "6", name: "قهوه‌ساز دمی", nameEn: "Pour-over Dripper", price: 540_000, tag: "جدید", tone: "#dcd6cc", icon: "drip", description: "دریپر سرامیکی برای دم‌آوری قهوه، همراه ۵۰ فیلتر کاغذی" },
];

export const formatPrice = (n: number) => `${n.toLocaleString("fa-IR")} تومان`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

/** Reads ?bugs= once and persists it, so it survives in-site navigation. */
export function initBugs() {
  const param = new URLSearchParams(location.search).get("bugs");
  if (param) localStorage.setItem("bugs", param);
}
export function bugsHeader(): string {
  return localStorage.getItem("bugs") ?? process.env.NEXT_PUBLIC_DEFAULT_BUGS ?? "all";
}
export function hasBug(id: BugId): boolean {
  const v = bugsHeader();
  return v === "all" || v.split(",").includes(id);
}

export const getCart = () => read<CartItem[]>("cart", []);
export const setCart = (cart: CartItem[]) => {
  write("cart", cart);
  window.dispatchEvent(new Event("cart"));
};
export function addToCart(id: string) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });
  setCart(cart);
}

export function signup(email: string, password: string): string | null {
  const valid = hasBug("B2") ? email.includes("@") : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!valid) return "ایمیل نامعتبر است";
  if (password.length < 6) return "رمز عبور باید حداقل ۶ کاراکتر باشد";
  const users = read<User[]>("users", []);
  const normalized = email.trim().toLowerCase();
  if (users.some((u) => u.email === normalized)) return "این ایمیل قبلا ثبت شده است";
  write("users", [...users, { email: normalized, password }]);
  localStorage.setItem("session", normalized);
  return null;
}

export function login(email: string, password: string): string | null {
  // B5: forgets to normalize case, so "User@x.com" never matches the stored "user@x.com".
  const key = hasBug("B5") ? email.trim() : email.trim().toLowerCase();
  const user = read<User[]>("users", []).find((u) => u.email === key && u.password === password);
  if (!user) return "ایمیل یا رمز عبور اشتباه است";
  localStorage.setItem("session", user.email);
  return null;
}
