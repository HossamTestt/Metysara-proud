import { RouterProvider } from 'react-router';
import { router } from './pages/routes';
import { LanguageProvider } from './context/LanguageContext';
import { VenuesProvider } from './context/VenuesContext';
import { AuthProvider } from './context/AuthContext';
import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { PullToRefresh } from './components/ui/PullToRefresh';
import { Toaster } from 'sonner';

import { ErrorBoundary } from './components/ui/ErrorBoundary';

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

    // CRITICAL: Block ALL text selection at the JavaScript level
    // to prevent Android WebView black screen crash on long-press
    const blockSelection = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow selection only inside input/textarea so cursor still works
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
    };
    document.addEventListener('selectstart', blockSelection);
    document.addEventListener('contextmenu', (e) => e.preventDefault());

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
      document.removeEventListener('selectstart', blockSelection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <VenuesProvider>
            <Toaster richColors position="top-center" toastOptions={{ style: { whiteSpace: 'pre-line', wordBreak: 'break-word', padding: '16px' } }} />
            <PullToRefresh>
              <div className="min-h-screen bg-background overscroll-none">
                {/* Mobile viewport container: responsive on mobile, centered on desktop */}
                <div className="mx-auto w-full md:max-w-[430px] min-h-screen bg-background md:shadow-2xl relative overflow-x-hidden">
                  <RouterProvider router={router} />
                </div>
              </div>
            </PullToRefresh>
          </VenuesProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
