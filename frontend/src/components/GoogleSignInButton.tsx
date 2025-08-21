// GoogleSignInButton.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface GoogleSignInButtonProps {
    onSuccess?: () => void;
    text?: string;
    size?: 'large' | 'medium' | 'small';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
                                                                   onSuccess,
                                                                   text = 'signin_with',
                                                                   size = 'large',
                                                                   theme = 'outline',
                                                                   shape = 'rectangular'
                                                               }) => {
    const { user, googleInitialized, googleScriptLoaded } = useAuth();
    const buttonRef = useRef<HTMLDivElement>(null);
    const [buttonRendered, setButtonRendered] = useState(false);
    const [showFallback, setShowFallback] = useState(false);

    // Render the Google button when everything is ready
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const renderGoogleButton = () => {
            if (window.google &&
                buttonRef.current &&
                !user &&
                googleInitialized &&
                googleScriptLoaded &&
                !buttonRendered) {

                try {
                    console.log('Rendering Google Sign-In button');
                    // Clear any existing button content
                    buttonRef.current.innerHTML = '';

                    window.google.accounts.id.renderButton(buttonRef.current, {
                        text,
                        size,
                        theme,
                        shape,
                        click_listener: () => {
                            console.log('Google Sign-In button clicked');
                        }
                    });

                    setButtonRendered(true);
                    setShowFallback(false);
                    console.log('Google Sign-In button rendered successfully');
                } catch (error) {
                    console.error('Failed to render Google button:', error);
                    setShowFallback(true);
                }
            }
        };

        if (googleInitialized && googleScriptLoaded && !user) {
            // Immediate attempt
            renderGoogleButton();
        } else if (googleScriptLoaded && !googleInitialized) {
            // Wait for initialization with event listener
            const handleGoogleAuthReady = () => {
                renderGoogleButton();
            };

            window.addEventListener('googleAuthReady', handleGoogleAuthReady);

            // Also set a timeout as fallback
            timeoutId = setTimeout(() => {
                if (!buttonRendered) {
                    setShowFallback(true);
                }
            }, 5000);

            return () => {
                window.removeEventListener('googleAuthReady', handleGoogleAuthReady);
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [text, size, theme, shape, user, googleInitialized, googleScriptLoaded, buttonRendered]);

    // Reset button rendered state when user changes
    useEffect(() => {
        if (user) {
            setButtonRendered(false);
        }
    }, [user]);

    // Listen for authentication changes
    useEffect(() => {
        if (user && onSuccess) {
            onSuccess();
        }
    }, [user, onSuccess]);

    // Show loading state while waiting for Google services
    if (!googleScriptLoaded && !showFallback) {
        return (
            <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-gray-600">Loading...</span>
            </div>
        );
    }

    return (
        <div>
            {/* Google button container */}
            <div ref={buttonRef} className={showFallback ? 'hidden' : ''}>
                {/* Google button will be rendered here */}
            </div>

            {/* Fallback button */}
            {showFallback && (
                <button
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                        alert('Google Sign-In is temporarily unavailable. Please refresh the page and try again.');
                    }}
                >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google (Retry)
                </button>
            )}
        </div>
    );
};

export default GoogleSignInButton;