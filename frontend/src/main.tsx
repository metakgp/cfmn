import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Ensure you have a .env.local file in your frontend directory with your client ID
// VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is not set. Please add it to your .env.local file.");
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={googleClientId}>
            <App />
        </GoogleOAuthProvider>
    </StrictMode>,
)
