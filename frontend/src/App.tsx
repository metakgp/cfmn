// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import CourseGrid from './components/CourseGrid';
import Leaderboard from './components/Leaderboard';
import ProfilePage from './pages/ProfilePage';
import { notesApi } from './api/notesApi';
import type { ResponseNote } from './types';

const HomePage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [notes, setNotes] = useState<ResponseNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNotes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedNotes = await notesApi.getNotes(12);
            setNotes(fetchedNotes);
        } catch (err) {
            setError('Failed to load notes. Please try again later.');
            console.error('Failed to load notes:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    const handleSearchChange = async (query: string): Promise<void> => {
        setSearchQuery(query);
        try {
            setLoading(true);
            setError(null);
            if (query.trim() === '') {
                const fetchedNotes = await notesApi.getNotes(12);
                setNotes(fetchedNotes);
            } else {
                const searchResults = await notesApi.searchNotes(query);
                setNotes(searchResults);
            }
        } catch (err) {
            setError('Search failed. Please try again.');
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNoteUploaded = (newNote: ResponseNote) => {
        setNotes(prevNotes => [newNote, ...prevNotes]);
        setSearchQuery('');
    };

    return (
        <>
            <Header onNoteUploaded={handleNoteUploaded} />

            <main className="flex-1 w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
                <div className="mb-8 max-w-3xl mx-auto">
                    <SearchBar searchQuery={searchQuery} onSearchChange={handleSearchChange} />
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-300 max-w-3xl mx-auto">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-text-muted">Loading notes...</span>
                    </div>
                ) : (
                    <CourseGrid notes={notes} />
                )}
            </main>
        </>
    );
};

const AppContent: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <div className="min-h-screen bg-background flex flex-col">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/profile/:userId" element={<ProfilePage />} />
                    </Routes>
                </div>
            </AuthProvider>
        </Router>
    );
};

const App: React.FC = () => {
    return <AppContent />;
};

export default App;