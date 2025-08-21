// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import CourseGrid from './components/CourseGrid';
import { notesApi } from './api/notesApi';
import type { ResponseNote } from './types';

const AppContent: React.FC = () => {
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
        <div className="min-h-screen bg-background flex flex-col">
            <AuthProvider onSignIn={loadNotes}>
                <Header onNoteUploaded={handleNoteUploaded} />

                <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <SearchBar searchQuery={searchQuery} onSearchChange={handleSearchChange} />
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-300">
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

            </AuthProvider>
        </div>
    );
};

const App: React.FC = () => {
    return <AppContent />;
};

export default App;
