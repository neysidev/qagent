"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

/** Image that opens in a lightbox on click; a shared layout animation grows it from (and returns it to) its slot. */
export function ZoomImage({ src, alt, className, imgKey }: { src: string; alt: string; className?: string; imgKey?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const transition = reduce ? { duration: 0 } : { duration: 0.32, ease: [0.32, 0.72, 0, 1] as const };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img
        key={imgKey}
        src={src}
        alt={alt}
        decoding="async"
        layoutId={open ? undefined : id}
        transition={transition}
        onClick={() => setOpen(true)}
        className={`cursor-zoom-in ${className ?? ""}`}
        style={{ opacity: open ? 0 : 1 }}
      />
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-black/70 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.2 }}
                onClick={() => setOpen(false)}
                role="dialog"
                aria-modal
                aria-label={alt}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <motion.img
                  src={src}
                  alt={alt}
                  layoutId={id}
                  transition={transition}
                  className="max-h-[90dvh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
