// components/SignInModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    title?: string;
    message?: string;
    actionContext?: string;
}

const SignInModal: React.FC<SignInModalProps> = ({
                                                     isOpen,
                                                     onClose,
                                                     onSuccess,
                                                     title = "Sign In Required",
                                                     message,
                                                     actionContext = "continue"
                                                 }) => {
    const { user, googleInitialized, googleScriptLoaded, isLoading, cancelOneTap } = useAuth();
    const buttonRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [buttonRendered, setButtonRendered] = useState(false);
    const [renderAttempts, setRenderAttempts] = useState(0);
    const maxRenderAttempts = 3;

    const defaultMessage = message || `Please sign in to ${actionContext === "continue" ? "continue" : actionContext}.`;

    // Handle successful authentication
    useEffect(() => {
        if (user && onSuccess) {
            onSuccess();
            onClose();
        }
    }, [user, onSuccess, onClose]);

    // Render Google Sign-In button
    useEffect(() => {
        if (!isOpen || !buttonRef.current || user || buttonRendered || renderAttempts >= maxRenderAttempts) {
            return;
        }

        const renderButton = () => {
            if (!window.google || !googleInitialized || !googleScriptLoaded) {
                console.log('Google Auth not ready, retrying...', {
                    googleExists: !!window.google,
                    googleInitialized,
                    googleScriptLoaded
                });
                return false;
            }

            try {
                // Clear any existing button content
                if (buttonRef.current) {
                    buttonRef.current.innerHTML = '';

                    window.google.accounts.id.renderButton(buttonRef.current, {
                        text: 'signin_with',
                        size: 'large',
                        theme: 'outline',
                        shape: 'rectangular',
                        width: 320, // Fixed width to prevent size changes
                        logo_alignment: 'center', // Keep logo centered
                    });

                    setButtonRendered(true);
                    console.log('Google Sign-In button rendered successfully');
                    return true;
                }
            } catch (error) {
                console.error('Failed to render Google Sign-In button:', error);
            }
            return false;
        };

        // Try to render immediately
        if (renderButton()) {
            return;
        }

        // If immediate render fails, set up retry logic
        const retryInterval = setInterval(() => {
            if (renderAttempts >= maxRenderAttempts) {
                clearInterval(retryInterval);
                return;
            }

            if (renderButton()) {
                clearInterval(retryInterval);
            } else {
                setRenderAttempts(prev => prev + 1);
            }
        }, 500);

        return () => {
            clearInterval(retryInterval);
        };
    }, [isOpen, googleInitialized, googleScriptLoaded, user, buttonRendered, renderAttempts]);

    // Reset button state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setButtonRendered(false);
            setRenderAttempts(0);
        }
    }, [isOpen]);

    // Handle modal interactions
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleClose = () => {
        // Cancel One Tap if it's active when modal closes
        if (cancelOneTap) {
            cancelOneTap();
        }
        onClose();
    };

    const handleFallbackSignIn = () => {
        // Show error message or try to trigger One Tap manually
        console.log('Fallback sign-in clicked');
        alert('Please wait for Google Sign-In to load, or refresh the page and try again.');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div
                ref={modalRef}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="signin-modal-title"
            >
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="signin-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        aria-label="Close modal"
                        disabled={isLoading}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                        {defaultMessage}
                    </p>

                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex justify-center items-center mb-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-600 dark:text-gray-300">Signing you in...</span>
                        </div>
                    )}

                    {/* Google Sign-In Button */}
                    {!isLoading && (
                        <div className="flex justify-center mb-4">
                            <div ref={buttonRef} className="w-full max-w-xs min-h-[44px] flex items-center justify-center">
                                {/* Fallback button - only shown if Google button fails to render */}
                                {(!googleScriptLoaded || !googleInitialized || renderAttempts >= maxRenderAttempts) && (
                                    <button
                                        onClick={handleFallbackSignIn}
                                        disabled={!googleScriptLoaded && renderAttempts < maxRenderAttempts}
                                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        {renderAttempts >= maxRenderAttempts ? 'Sign in with Google' : 'Loading Google Sign-In...'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Status messages */}
                    {!googleScriptLoaded && !isLoading && (
                        <div className="text-center mb-4">
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                Loading Google Sign-In...
                            </p>
                        </div>
                    )}

                    {googleScriptLoaded && !googleInitialized && !isLoading && (
                        <div className="text-center mb-4">
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                Initializing Google Sign-In...
                            </p>
                        </div>
                    )}

                    {renderAttempts >= maxRenderAttempts && !isLoading && (
                        <div className="text-center mb-4">
                            <p className="text-sm text-red-600 dark:text-red-400">
                                Having trouble loading Google Sign-In. Please refresh the page and try again.
                            </p>
                        </div>
                    )}

                    {/* Help text */}
                    <div className="text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            We'll redirect you to Google's secure sign-in page
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="w-full px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignInModal;