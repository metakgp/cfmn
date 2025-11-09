import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Google Identity Services API Types
interface GoogleCredentialResponse {
    credential: string;
    select_by?: string;
}

interface GooglePromptNotification {
    isNotDisplayed(): boolean;
    getNotDisplayedReason(): string;
    isSkippedMoment(): boolean;
    getSkippedReason(): string;
    isDismissedMoment(): boolean;
    getDismissedReason(): string;
}

interface GoogleInitConfig {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
    ux_mode?: 'popup' | 'redirect';
    context?: 'signin' | 'signup' | 'use';
    itp_support?: boolean;
    state_cookie_domain?: string;
}

interface GoogleButtonConfig {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: number;
    locale?: string;
}

interface GoogleRevokeResponse {
    successful: boolean;
    error?: string;
}

interface AuthProviderProps {
    children: ReactNode;
    onSignIn?: () => void;
    // One Tap configuration options
    enableOneTap?: boolean;
    oneTapAutoSelect?: boolean;
    oneTapCancelOnTapOutside?: boolean;
    oneTapMomentCallback?: (moment: GooglePromptNotification) => void;
}

declare global {
    interface Window {
        google: {
            accounts: {
                id: {
                    initialize: (config: GoogleInitConfig) => void;
                    prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
                    renderButton: (element: HTMLElement, config: GoogleButtonConfig) => void;
                    disableAutoSelect: () => void;
                    cancel: () => void;
                    revoke: (hint: string, callback: (response: GoogleRevokeResponse) => void) => void;
                };
            };
        };
        googleAuthReady?: boolean;
    }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const AuthProvider: React.FC<AuthProviderProps> = ({
                                                              children,
                                                              onSignIn,
                                                              enableOneTap = true,
                                                              oneTapAutoSelect = false,
                                                              oneTapCancelOnTapOutside = true,
                                                              oneTapMomentCallback
                                                          }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [googleInitialized, setGoogleInitialized] = useState(false);
    const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
    const [oneTapDisplayed, setOneTapDisplayed] = useState(false);
    const [oneTapDismissed, setOneTapDismissed] = useState(false);
    const isAuthenticated = !!user;

    // Check authentication status on mount
    useEffect(() => {
        let isMounted = true;

        const runAuthCheck = async () => {
            if (isMounted) {
                await checkAuthStatus();
            }
        };

        runAuthCheck();

        return () => {
            isMounted = false;
        };
    }, []);

    // Initialize Google OAuth and One Tap
    useEffect(() => {
        let isMounted = true;
        let initTimeout: NodeJS.Timeout | null = null;

        const initializeGoogleAuth = () => {
            if (!window.google?.accounts?.id) {
                console.log('Google accounts.id not available yet');
                return false;
            }

            if (!GOOGLE_CLIENT_ID) {
                console.error('GOOGLE_CLIENT_ID not configured');
                return false;
            }

            if (googleInitialized) {
                console.log('Google Auth already initialized');
                return true;
            }

            try {
                console.log('Initializing Google Auth with client ID:', GOOGLE_CLIENT_ID);

                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleCredentialResponse,
                    auto_select: oneTapAutoSelect,
                    cancel_on_tap_outside: oneTapCancelOnTapOutside,
                    use_fedcm_for_prompt: false,
                    ux_mode: 'popup',
                    context: 'signin',
                    // Restrict to @kgpian.iitkgp.ac.in domain only
                    hd: 'kgpian.iitkgp.ac.in',
                    // One Tap specific configurations
                    itp_support: true,
                    state_cookie_domain: window.location.hostname,
                });

                if (isMounted) {
                    setGoogleInitialized(true);
                    window.googleAuthReady = true;
                    console.log('Google Auth initialized successfully');
                    window.dispatchEvent(new CustomEvent('googleAuthReady'));
                }
                return true;
            } catch (error) {
                console.error('Failed to initialize Google Auth:', error instanceof Error ? error.message : String(error));
                return false;
            }
        };

        const loadGoogleScript = () => {
            if (!isMounted) return;

            // Check if script is already loaded and Google API is available
            if (window.google?.accounts?.id) {
                console.log('Google API already available');
                setGoogleScriptLoaded(true);
                // Try to initialize immediately
                if (!initializeGoogleAuth()) {
                    // If immediate initialization fails, retry after a short delay
                    initTimeout = setTimeout(() => {
                        if (isMounted) {
                            initializeGoogleAuth();
                        }
                    }, 100);
                }
                return;
            }

            const existingScript = document.querySelector('script[src*="gsi/client"]');
            if (existingScript) {
                console.log('Google script element exists, but API not ready. Removing and reloading...');
                // Remove existing script and reload fresh
                existingScript.remove();
                // Clear any Google global state
                if (window.google) {
                    delete window.google;
                }
                if (window.googleAuthReady) {
                    delete window.googleAuthReady;
                }
                // Fall through to load fresh script
            }

            console.log('Loading Google Identity Services script');
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;

            script.onload = () => {
                console.log('Google script loaded successfully');
                if (isMounted) {
                    setGoogleScriptLoaded(true);
                    // Wait a bit for the API to be fully available
                    initTimeout = setTimeout(() => {
                        if (isMounted) {
                            initializeGoogleAuth();
                        }
                    }, 200);
                }
            };

            script.onerror = (error) => {
                console.error('Failed to load Google Identity Services:', error instanceof Error ? error.message : String(error));
                if (isMounted) {
                    setGoogleScriptLoaded(false);
                }
            };

            document.head.appendChild(script);
        };

        loadGoogleScript();

        return () => {
            isMounted = false;
            if (initTimeout) {
                clearTimeout(initTimeout);
            }
        };
    }, []); // Remove dependencies to avoid re-initialization

    // Trigger One Tap when conditions are met
    useEffect(() => {
        if (
            enableOneTap &&
            googleInitialized &&
            !isAuthenticated &&
            !isLoading &&
            !oneTapDisplayed &&
            !oneTapDismissed
        ) {
            showOneTap();
        }
    }, [enableOneTap, googleInitialized, isAuthenticated, isLoading, oneTapDisplayed, oneTapDismissed]);

    const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
        if (!response.credential) {
            console.error('No credential received from Google');
            return;
        }

        try {
            setIsLoading(true);
            console.log('Processing Google credential...');

            const result = await fetch(`${API_BASE_URL}/api/auth/google`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: response.credential
                }),
            });

            if (result.ok) {
                const data = await result.json() as { token: string; user: AuthUser };

                if (data.token && data.user) {
                    localStorage.setItem('auth_token', data.token);
                    setUser(data.user);
                    setOneTapDisplayed(false); // Reset for future sessions
                    setOneTapDismissed(false);

                    if (onSignIn) {
                        onSignIn();
                    }
                    console.log('Authentication successful:', data.user);
                } else {
                    throw new Error('Invalid response format from server');
                }
            } else {
                const errorText = await result.text();
                console.error('Authentication failed:', result.status, errorText);

                // Check if it's an email domain restriction error
                let errorMessage = `Authentication failed: ${result.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.error && errorData.error.includes('@kgpian.iitkgp.ac.in')) {
                        errorMessage = 'Only @kgpian.iitkgp.ac.in email addresses are allowed. Please sign in with your institutional email.';
                    } else if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch {
                    // If JSON parsing fails, use the status-based message
                }

                throw new Error(errorMessage);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error('Authentication error:', errorMsg);
            // Display user-friendly error message
            alert(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const showOneTap = () => {
        if (!window.google?.accounts?.id || !googleInitialized) {
            console.warn('Google Auth not initialized, cannot show One Tap');
            return;
        }

        console.log('Displaying Google One Tap prompt');
        setOneTapDisplayed(true);

        window.google.accounts.id.prompt((notification: GooglePromptNotification) => {
            console.log('One Tap notification:', notification);

            // Handle different notification moments
            if (notification.isNotDisplayed()) {
                console.log('One Tap not displayed:', notification.getNotDisplayedReason());
                setOneTapDisplayed(false);

                // Handle specific reasons why One Tap wasn't displayed
                const reason = notification.getNotDisplayedReason();
                if (reason === 'suppressed_by_user' || reason === 'unregistered_origin') {
                    setOneTapDismissed(true);
                }
            } else if (notification.isSkippedMoment()) {
                console.log('One Tap skipped:', notification.getSkippedReason());
                setOneTapDisplayed(false);
            } else if (notification.isDismissedMoment()) {
                console.log('One Tap dismissed:', notification.getDismissedReason());
                setOneTapDisplayed(false);
                setOneTapDismissed(true);

                // Store dismissal in session storage to prevent showing again in this session
                sessionStorage.setItem('oneTapDismissed', 'true');
            }

            // Call user-provided callback if available
            if (oneTapMomentCallback) {
                oneTapMomentCallback(notification);
            }
        });
    };

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setUser(null);
                setIsLoading(false);

                // Check if One Tap was dismissed in this session
                const dismissed = sessionStorage.getItem('oneTapDismissed');
                if (dismissed === 'true') {
                    setOneTapDismissed(true);
                }
                return;
            }

            console.log('Checking authentication status...', API_BASE_URL);

            if (!API_BASE_URL) {
                console.error('API_BASE_URL is not defined');
                setIsLoading(false);
                return;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const userData = await response.json() as AuthUser;
                setUser(userData);
                console.log('User authenticated:', userData);
                // Clear One Tap states if user is already authenticated
                setOneTapDisplayed(false);
                setOneTapDismissed(false);
            } else if (response.status === 401 || response.status === 403) {
                console.log('Token invalid or expired, clearing auth state');
                localStorage.removeItem('auth_token');
                setUser(null);
            } else if (response.status === 404) {
                console.error('Auth endpoint not found (404). Check if backend is running and endpoint exists.');
                setUser(null);
            } else {
                console.warn('Auth check failed with status:', response.status);
            }
        } catch (error) {
            console.error('Auth check failed:', error instanceof Error ? error.message : String(error));

            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.warn('Network error during auth check - keeping existing state');
            } else if (error instanceof Error && error.name === 'AbortError') {
                console.warn('Auth check timed out - keeping existing state');
            } else {
                localStorage.removeItem('auth_token');
                setUser(null);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async (): Promise<void> => {
        console.log('Sign-in should be triggered through Google Sign-In button');
        throw new Error('Please use the Google Sign-In button to authenticate');
    };

    const signOut = (): void => {
        try {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('oneTapDismissed');
            setUser(null);
            setOneTapDisplayed(false);
            setOneTapDismissed(false);

            if (window.google?.accounts?.id && googleInitialized) {
                window.google.accounts.id.disableAutoSelect();
            }

            console.log('Signed out successfully');
            window.location.reload();
        } catch (error) {
            console.error('Sign out error:', error instanceof Error ? error.message : String(error));
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('oneTapDismissed');
            setUser(null);
        }
    };

    // Method to manually trigger One Tap (useful for retry scenarios)
    const triggerOneTap = (): void => {
        if (!isAuthenticated) {
            setOneTapDismissed(false);
            setOneTapDisplayed(false);
            sessionStorage.removeItem('oneTapDismissed');
            showOneTap();
        }
    };

    // Method to cancel One Tap
    const cancelOneTap = (): void => {
        if (window.google?.accounts?.id && googleInitialized) {
            window.google.accounts.id.cancel();
            setOneTapDisplayed(false);
            setOneTapDismissed(true);
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        signIn,
        signOut,
        googleInitialized,
        googleScriptLoaded,
        // One Tap specific methods and states
        triggerOneTap,
        cancelOneTap,
        oneTapDisplayed,
        oneTapDismissed,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};