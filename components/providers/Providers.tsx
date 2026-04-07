"use client";

import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        theme="light"
        richColors
        closeButton
        position="top-center"
        toastOptions={{ classNames: { title: "font-medium" } }}
      />
    </>
  );
}
