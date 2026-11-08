import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "./components/site-shell";
import "./globals.css";
export const metadata: Metadata = {metadataBase:new URL("https://dialife-medical-va.vercel.app"),title:{default:"Dialife Medical VA | Global Healthcare Talent",template:"%s"},description:"Explore online medical virtual assistant training, practical simulations and healthcare administrative staffing solutions from Dialife Ltd.",robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en" data-scroll-behavior="smooth"><body><a href="#main-content" className="skip-link">Skip to content</a><SiteHeader/><div id="main-content">{children}</div><SiteFooter/></body></html>}