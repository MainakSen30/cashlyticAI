import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });
export const metadata = {
  title: "cashlyticAI",
  description: "Your one stop finance management platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
      <body className={`${inter.className}`}>
        {/*header*/}
        <Header/>
        <main className="min-h-screen pt-20">{children}</main>
        <Toaster richColors />
        {/*footer*/}
        </body>
      </html>
    </ClerkProvider>
  );
}
