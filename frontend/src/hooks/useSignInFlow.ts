// hooks/useSignInFlow.ts
import { useState, useCallback } from 'react';

interface SignInFlowOptions {
    title?: string;
    message?: string;
    actionContext?: string;
}

export const useSignInFlow = () => {
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);
    const [modalOptions, setModalOptions] = useState<SignInFlowOptions>({});

    const triggerSignIn = useCallback((
        successCallback?: () => void,
        options?: SignInFlowOptions
    ) => {
        setOnSuccessCallback(() => successCallback || (() => {}));
        setModalOptions(options || {});
        setShowSignInModal(true);
    }, []);

    const handleSignInSuccess = useCallback(() => {
        setShowSignInModal(false);
        if (onSuccessCallback) {
            onSuccessCallback();
        }
        // Clean up
        setOnSuccessCallback(null);
        setModalOptions({});
    }, [onSuccessCallback]);

    const handleSignInClose = useCallback(() => {
        setShowSignInModal(false);
        setOnSuccessCallback(null);
        setModalOptions({});
    }, []);

    return {
        showSignInModal,
        triggerSignIn,
        handleSignInSuccess,
        handleSignInClose,
        modalOptions
    };
};
