import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

// Display face: bold, confident, geometric — used for headings only
const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

// Body face: highly readable for long-form chapter reading
const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "Learn From Ola | AI Software Builder Course",
  description: "Your premium learning space for the AI Software Builder Course.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
