"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { button } from "./ui";

/** Click-to-open popover: closes on outside click, Escape, or when a child calls `close`. */
export function Popover({
  trigger,
  children,
  align = "start",
  className = "w-64",
  onOpen,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: keyof typeof placement;
  className?: string;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({
        open,
        toggle: () => {
          if (!open) onOpen?.();
          setOpen(!open);
        },
      })}
      {open && (
        <div
          className={`pop absolute z-50 rounded-xl border border-line-strong bg-card p-1 shadow-[0_16px_40px_-16px_rgb(0_0_0/0.25)] ${placement[align]} ${className}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const placement = {
  start: "top-full mt-1.5 start-0 origin-top",
  end: "top-full mt-1.5 end-0 origin-top",
  up: "bottom-full mb-1.5 start-0 origin-bottom",
  upEnd: "bottom-full mb-1.5 end-0 origin-bottom",
};

export const menuItem =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm text-fg-2 transition-colors duration-100 hover:bg-card-hover hover:text-fg focus-visible:bg-card-hover focus-visible:outline-none aria-[current=true]:text-fg";

/** Modal confirm built on <dialog>: native focus trap, Escape and backdrop dismissal. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  cancelLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (open && !d?.open) d?.showModal();
    if (!open && d?.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="modal m-auto w-[min(400px,calc(100vw-32px))] rounded-2xl border border-line-strong bg-surface p-0 text-fg shadow-[0_16px_40px_-16px_rgb(0_0_0/0.25)]"
    >
      <div className="p-5">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1.5 text-sm text-pretty text-fg-2">{body}</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-line bg-shell/60 px-5 py-3">
        <button onClick={onClose} className={button.ghost} autoFocus>
          {cancelLabel}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={button.danger}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

/** Content dialog on <dialog> (same shell as ConfirmDialog): scrolls when tall, closes on Escape or backdrop click. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (open && !d?.open) d?.showModal();
    if (!open && d?.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`modal m-auto max-h-[min(720px,calc(100dvh-32px))] ${wide ? "w-[min(620px,calc(100vw-32px))]" : "w-[min(480px,calc(100vw-32px))]"} flex-col overflow-hidden rounded-2xl border border-line-strong bg-surface p-0 text-fg shadow-[0_16px_40px_-16px_rgb(0_0_0/0.25)] open:flex`}
    >
      <h2 className="shrink-0 border-b border-line px-5 py-4 font-semibold">{title}</h2>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">{children}</div>
      {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-line bg-shell/60 px-5 py-3">{footer}</div>}
    </dialog>
  );
}
