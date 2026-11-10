"use client";
import { motion, useReducedMotion } from "framer-motion";
export default function StoreTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={reduced ? {} : { opacity: [0.7, 1] }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.div>
  );
}
