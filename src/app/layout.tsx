import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GlobalIssueWidget } from "@/components/feedback/global-issue-widget";

export const metadata: Metadata = {
  title: "AVA Online",
  description: "Sistema de avaliações online"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <GlobalIssueWidget />
      </body>
    </html>
  );
}
