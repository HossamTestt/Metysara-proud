import { RouterProvider } from 'react-router';
import { router } from './routes';
import { LanguageProvider } from './contexts/LanguageContext';
import { VenuesProvider } from './contexts/VenuesContext';
import { AuthProvider } from './contexts/AuthContext';
import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

export default function App() {
  useEffect(() => {
    CapacitorApp.addListener('backButton', () => {
      if (window.location.pathname === '/' || window.location.pathname === '/home' || window.location.pathname === '/login' || window.location.pathname === '/vendor' || window.location.pathname === '/admin') {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);
  return (
    <AuthProvider>
      <LanguageProvider>
        <VenuesProvider>
          <div className="min-h-screen bg-background">
            {/* Mobile viewport container */}
            <div className="mx-auto max-w-[430px] min-h-screen bg-background shadow-2xl relative">
              <RouterProvider router={router} />
            </div>
          </div>
        </VenuesProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}