import { RouterProvider } from 'react-router';
import { router } from './pages/routes';
import { LanguageProvider } from './context/LanguageContext';
import { VenuesProvider } from './context/VenuesContext';
import { AuthProvider } from './context/AuthContext';
import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { PullToRefresh } from './components/ui/PullToRefresh';
import { Toaster } from 'sonner';

export default function App() {
  useEffect(() => {
    // Initialize Crashlytics
    const initCrashlytics = async () => {
      try {
        const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
        
        // Catch global errors
        window.onerror = (message, source, lineno, colno, error) => {
          FirebaseCrashlytics.recordException({
            message: `Global Error: ${message} at ${source}:${lineno}:${colno}`,
          }).catch(() => {});
        };

        window.onunhandledrejection = (event) => {
          FirebaseCrashlytics.recordException({
            message: `Unhandled Rejection: ${event.reason?.message || event.reason}`,
          }).catch(() => {});
        };
        
        console.log('Crashlytics initialized');
      } catch (e) {
        console.error('Failed to init Crashlytics:', e);
      }
    };
    initCrashlytics();

    // Handle Android hardware back button
    const backListener = CapacitorApp.addListener('backButton', () => {
      const path = window.location.pathname;

      // Only exit if we are on root paths and there's no meaningful history to go back to
      // or if specifically at the "entry" points of the app
      if (path === '/' || path === '/login' || path === '/onboarding') {
        CapacitorApp.exitApp();
      } else if (path === '/home' || path === '/admin' || path === '/vendor') {
        // On main dashboards, usually we exit on back, but you could also show a toast
        CapacitorApp.exitApp();
      } else {
        // For all other screens (Venue Details, Search, etc.), just go back in history
        if (window.history.length > 1) {
          window.history.back();
        } else {
          CapacitorApp.exitApp();
        }
      }
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <VenuesProvider>
          <Toaster richColors position="top-center" toastOptions={{ style: { whiteSpace: 'pre-line', wordBreak: 'break-word', padding: '16px' } }} />
          <PullToRefresh>
            <div className="min-h-screen bg-background overscroll-none selection:bg-primary/30">
              {/* Mobile viewport container: responsive on mobile, centered on desktop */}
              <div className="mx-auto w-full md:max-w-[430px] min-h-screen bg-background md:shadow-2xl relative overflow-hidden">
                <RouterProvider router={router} />
              </div>
            </div>
          </PullToRefresh>
        </VenuesProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
