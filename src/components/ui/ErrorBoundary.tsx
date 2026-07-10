import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import { Capacitor } from '@capacitor/core';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Report to Firebase Crashlytics if native
    if (Capacitor.isNativePlatform()) {
      FirebaseCrashlytics.recordException({
        message: error.message,
      }).catch(console.error);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Determine language from localStorage or default to Arabic
      let isArabic = true;
      try {
        const lang = localStorage.getItem('metysara_lang');
        if (lang === 'en') isArabic = false;
      } catch (e) {}

      return (
        <div 
          className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {isArabic ? 'عذراً، حدث خطأ غير متوقع.' : 'Oops! Something went wrong.'}
          </h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            {isArabic 
              ? 'لقد واجهنا مشكلة فنية. تم إرسال تقرير بالخطأ إلى فريقنا. يرجى إعادة تحميل التطبيق.' 
              : 'We encountered a technical issue. An error report has been sent to our team. Please reload the app.'}
          </p>
          <Button 
            onClick={this.handleReload} 
            size="lg" 
            className="rounded-full px-8 flex items-center gap-2 font-bold shadow-lg shadow-primary/20"
          >
            <RefreshCw className="w-5 h-5" />
            {isArabic ? 'إعادة التحميل' : 'Reload App'}
          </Button>
          
          {/* Detailed error in dev mode */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-12 p-4 bg-muted/50 rounded-xl text-left rtl:text-right overflow-auto max-w-full text-xs text-muted-foreground w-full">
              <p className="font-mono font-bold text-red-500 mb-2">{this.state.error.toString()}</p>
              <pre className="font-mono">{this.state.error.stack}</pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
