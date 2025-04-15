import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import SessionLayout from "@/components/layout/Session"
// import InstallButton from "@/components/custom/InstallButton"

const inter = Inter({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Game Calculator",
    template: "%s | Game Calculator",
  },
  description: "C-ONE Game Calculator",
}

const HomeLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => (
  <html lang="en">
    {/* <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#ffffff" />
      </head> */}
    <body className={`${inter.className} antialiased`}>
      <SessionLayout>
        {/* <InstallButton /> */}
        {children}
        </SessionLayout>
    </body>
  </html>
)

export default HomeLayout
