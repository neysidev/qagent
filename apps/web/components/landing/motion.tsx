"use client";

import { LazyMotion, domAnimation, m, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

type Range = [number, number];
type Offset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>["offset"]>;

/**
 * One LazyMotion boundary for the landing page: ships only the DOM animation features, and `strict`
 * makes any accidental full `motion.*` import fail loudly instead of pulling in the whole bundle.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

/** Thin accent bar at the very top that fills as the page scrolls; springs so it never jitters. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
  return <m.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-0 z-[70] h-0.5 origin-right bg-accent" />;
}

/**
 * Scroll-linked transform/opacity on one element. Only compositor-friendly properties move, values are
 * derived from a single shared scroll listener, and reduced-motion users get the static layout.
 */
export function ScrollFx({ as = "div", offset = ["start end", "end start"], y, scale, opacity, children, ...rest }: {
  as?: "div" | "ul" | "ol";
  offset?: Offset;
  y?: Range;
  scale?: Range;
  opacity?: Range;
  children: ReactNode;
  // Only plain layout/ARIA attributes pass through; DOM event props clash with motion's own handlers.
  className?: string;
  id?: string;
  role?: string;
  "aria-labelledby"?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const yv = useTransform(scrollYProgress, [0, 1], y ?? [0, 0]);
  const sv = useTransform(scrollYProgress, [0, 1], scale ?? [1, 1]);
  const ov = useTransform(scrollYProgress, [0, 1], opacity ?? [1, 1]);
  const Tag = m[as] as typeof m.div;
  const style = reduce ? undefined : { ...(y && { y: yv }), ...(scale && { scale: sv }), ...(opacity && { opacity: ov }) };
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} style={style} {...rest}>
      {children}
    </Tag>
  );
}

/** Section trays: rise and settle from 95% to full size as they scroll into the reading zone. */
export function Rise(props: Omit<Parameters<typeof ScrollFx>[0], "offset" | "y" | "scale">) {
  return <ScrollFx offset={["start end", "start 0.55"]} y={[56, 0]} scale={[0.95, 1]} {...props} />;
}
