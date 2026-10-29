import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import DemoRoleSwitcher from "@/components/DemoRoleSwitcher";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SRMIST Ramapuram | Smart OD Management System",
  description: "Smart AI OD Management System",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#050505] text-white min-h-screen`}>
        <AuthProvider>
          {children}
          <DemoRoleSwitcher />
        </AuthProvider>
      </body>
    </html>
  );
}
