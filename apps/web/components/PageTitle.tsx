"use client";

import { useEffect } from "react";
import { SITE_NAME } from "@/lib/site";

export function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = `${title} | ${SITE_NAME}`;
  }, [title]);
  return null;
}
