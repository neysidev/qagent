import { getRequestConfig } from "next-intl/server";

// Persian-only: one locale, one message file, no routing.
export default getRequestConfig(async () => ({ locale: "fa", messages: (await import("../messages/fa.json")).default }));
