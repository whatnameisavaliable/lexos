import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lexos 律所协作平台",
  description: "面向律师事务所的任务协作、客户交付和结算管理平台",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

