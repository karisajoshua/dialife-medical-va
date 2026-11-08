import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Dialife Medical VA | Global Healthcare Talent", description: "Online medical virtual assistant training and healthcare staffing solutions from Dialife Ltd." };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
