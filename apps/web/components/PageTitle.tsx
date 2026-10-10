"use client";

import { useEffect } from "react";
import { SITE_NAME } from "@/lib/site";

/** Sets `document.title` to "title | brand"; the layout's default title returns on navigation. */
export function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = `${title} | ${SITE_NAME}`;
  }, [title]);
  return null;
}
