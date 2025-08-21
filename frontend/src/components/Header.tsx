// components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSignInFlow } from '../hooks/useSignInFlow';
import SignInModal from './SignInModal';
import UploadModal from './UploadModal';
import { LogOut, Upload, Plus, ChevronDown, User } from 'lucide-react';
import type { ResponseNote } from '../types';

interface HeaderProps {
    onNoteUploaded?: (note: ResponseNote) => void;
}

const Header: React.FC<HeaderProps> = ({ onNoteUploaded }) => {
    const { user, isAuthenticated, isLoading, signOut } = useAuth();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const {
        showSignInModal,
        triggerSignIn,
        handleSignInSuccess,
        handleSignInClose,
        modalOptions
    } = useSignInFlow();

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    const handleUploadClick = () => {
        if (!isAuthenticated) {
            triggerSignIn(
                () => setIsUploadModalOpen(true),
                {
                    title: "Sign In to Upload",
                    message: "Please sign in to upload your notes and share them with the community.",
                    actionContext: "upload notes"
                }
            );
            return;
        }
        setIsUploadModalOpen(true);
    };

    const handleDirectSignIn = () => {
        triggerSignIn(
            undefined,
            {
                title: "Welcome to CFMN",
                message: "Please sign in to access all features and connect with the community.",
                actionContext: "continue"
            }
        );
    };

    const handleUploadSuccess = (note: ResponseNote) => {
        if (onNoteUploaded) {
            onNoteUploaded(note);
        }
    };

    const handleSignOut = () => {
        setShowUserMenu(false);
        signOut();
    };

    // Get user's first name
    const firstName = user?.full_name?.split(' ')[0] || 'User';

    // Get user's profile picture (if available from Google)
    const profilePicture = user?.picture;

    return (
        <>
            <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">CFMN</h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        {isLoading ? (
                            <div className="animate-pulse flex items-center space-x-4">
                                <div className="h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                <div className="h-8 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                            </div>
                        ) : isAuthenticated ? (
                            <>
                                <button
                                    onClick={handleUploadClick}
                                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                                >
                                    <Upload size={18} />
                                    <span>Upload</span>
                                </button>

                                {/* User Profile Dropdown */}
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        {profilePicture ? (
                                            <img
                                                src={profilePicture}
                                                alt={user?.full_name || 'User'}
                                                className="w-8 h-8 rounded-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                                <User size={16} className="text-white" />
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                                            {firstName}
                                        </span>
                                        <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                                            {/* User Info */}
                                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center space-x-3">
                                                    {profilePicture ? (
                                                        <img
                                                            src={profilePicture}
                                                            alt={user?.full_name || 'User'}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                                                            <User size={20} className="text-white" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {user?.full_name || 'User'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {user?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Menu Items */}
                                            <div className="py-2">
                                                <button
                                                    onClick={handleSignOut}
                                                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <LogOut size={16} />
                                                    <span>Sign Out</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={handleUploadClick}
                                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                                >
                                    <Plus size={18} />
                                    <span>Upload</span>
                                </button>

                                {/* Simple Sign-In Button - Opens Modal with Google Button */}
                                <button
                                    onClick={handleDirectSignIn}
                                    className="flex items-center space-x-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-colors font-medium"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    <span>Sign In</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <SignInModal
                isOpen={showSignInModal}
                onClose={handleSignInClose}
                onSuccess={handleSignInSuccess}
                title={modalOptions.title}
                message={modalOptions.message}
                actionContext={modalOptions.actionContext}
            />

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={handleUploadSuccess}
            />
        </>
    );
};

export default Header;