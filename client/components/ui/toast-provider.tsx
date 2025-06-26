"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function ToastProvider() {
  const { theme } = useTheme();
  
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:bg-emerald-50 group-[.toast]:text-emerald-900 group-[.toast]:border-emerald-200 dark:group-[.toast]:bg-emerald-950 dark:group-[.toast]:text-emerald-50 dark:group-[.toast]:border-emerald-800",
          error: "group-[.toast]:bg-red-50 group-[.toast]:text-red-900 group-[.toast]:border-red-200 dark:group-[.toast]:bg-red-950 dark:group-[.toast]:text-red-50 dark:group-[.toast]:border-red-800",
          warning: "group-[.toast]:bg-amber-50 group-[.toast]:text-amber-900 group-[.toast]:border-amber-200 dark:group-[.toast]:bg-amber-950 dark:group-[.toast]:text-amber-50 dark:group-[.toast]:border-amber-800",
        },
      }}
      theme={theme === "dark" ? "dark" : "light"}
      richColors
      closeButton
      duration={4000}
    />
  );
} 