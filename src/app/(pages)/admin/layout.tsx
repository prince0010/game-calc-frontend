"use client"
import Header from "@/components/custom/Header"
import TabNavigation from "@/components/custom/Navbar"
import { useEffect } from "react"

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content available!');
              }
            });
          });
        } catch (error) {
          console.error('SW registration failed:', error);
        }
      };
      
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  return (
    <main className="flex flex-col w-full h-screen bg-slate-200">
      <Header />
      {children}
      <TabNavigation />
    </main>
  )
}

export default AdminLayout