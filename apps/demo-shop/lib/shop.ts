export type BugId = "B1" | "B2" | "B3" | "B4" | "B5";
export type Product = { id: string; name: string; nameEn: string; price: number; description: string };
export type CartItem = { id: string; qty: number };
type User = { email: string; password: string };

export const products: Product[] = [
  { id: "1", name: "ماگ سرامیکی", nameEn: "Ceramic Mug", price: 280_000, description: "ماگ دست‌ساز ۳۵۰ میلی‌لیتری · Handmade 350ml mug" },
  { id: "2", name: "دفترچه چرمی", nameEn: "Leather Notebook", price: 450_000, description: "دفترچه A5 با جلد چرم · A5 notebook, leather cover" },
  { id: "3", name: "چای ارل گری", nameEn: "Earl Grey Tea", price: 190_000, description: "۲۵۰ گرم چای معطر · 250g fragrant tea" },
  { id: "4", name: "شمع معطر", nameEn: "Scented Candle", price: 320_000, description: "شمع سویا با رایحه وانیل · Vanilla soy candle" },
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
  if (!valid) return "ایمیل نامعتبر است · Invalid email";
  if (password.length < 6) return "رمز عبور باید حداقل ۶ کاراکتر باشد · Password must be at least 6 characters";
  const users = read<User[]>("users", []);
  const normalized = email.trim().toLowerCase();
  if (users.some((u) => u.email === normalized)) return "این ایمیل قبلاً ثبت شده · Email already registered";
  write("users", [...users, { email: normalized, password }]);
  localStorage.setItem("session", normalized);
  return null;
}

export function login(email: string, password: string): string | null {
  // B5: forgets to normalize case, so "User@x.com" never matches the stored "user@x.com".
  const key = hasBug("B5") ? email.trim() : email.trim().toLowerCase();
  const user = read<User[]>("users", []).find((u) => u.email === key && u.password === password);
  if (!user) return "ایمیل یا رمز عبور اشتباه است · Wrong email or password";
  localStorage.setItem("session", user.email);
  return null;
}
