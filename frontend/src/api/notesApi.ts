import type { ResponseNote, DBVote, VoteType } from "../types.ts";
import { authenticatedFetch } from "./authApi.ts";

class NotesAPI {
    private async fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
        try {
            // Use authenticatedFetch instead of regular fetch
            const response = await authenticatedFetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // GET /api/notes?num=10
    async getNotes(num: number = 10): Promise<ResponseNote[]> {
        const url = `/api/notes?num=${num}`;  // Remove API_BASE_URL since authenticatedFetch handles it
        return this.fetchWithErrorHandling(url);
    }

    // GET /api/notes/:note_id
    async getNoteById(noteId: string): Promise<ResponseNote> {
        const url = `/api/notes/${noteId}`;
        return this.fetchWithErrorHandling(url);
    }

    // GET /api/notes/search?query=query
    async searchNotes(query: string): Promise<ResponseNote[]> {
        const url = `/api/notes/search?query=${encodeURIComponent(query)}`;
        return this.fetchWithErrorHandling(url);
    }

    // POST /api/notes/:note_id/vote?vote_type=type - Vote on a note
    async voteOnNote(noteId: string, voteType: VoteType): Promise<DBVote | null> {
        const url = `/api/notes/${noteId}/vote?vote_type=${voteType}`;

        try {
            const response = await authenticatedFetch(url, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`Vote failed: ${response.status}`);
            }

            // Check if the response has content
            const contentLength = response.headers.get('content-length');
            if (contentLength === '0' || response.status === 204) {
                // No content returned (successful vote with no data)
                return null;
            }

            // Try to parse JSON response
            const responseText = await response.text();
            if (!responseText.trim()) {
                return null;
            }

            return JSON.parse(responseText);
        } catch (error) {
            console.error('Vote request failed:', error);
            throw error;
        }
    }

    // POST /api/notes - Create a new note
    async uploadNote(formData: FormData): Promise<ResponseNote> {
        const url = `/api/notes/upload`;

        // Use authenticatedFetch but don't set Content-Type for multipart
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${url}`, {
            method: 'POST',
            headers, // Don't include Content-Type for multipart data
            body: formData,
        });

        // Handle token expiration
        if (response.status === 401 && token) {
            localStorage.removeItem('auth_token');
            window.location.reload();
        }

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${errorData}`);
        }

        return await response.json();
    }

    // PUT /api/notes/:note_id - Update a note
    async updateNote(noteId: string, noteData: Partial<ResponseNote>): Promise<ResponseNote> {
        const url = `/api/notes/${noteId}`;
        return this.fetchWithErrorHandling(url, {
            method: 'PUT',
            body: JSON.stringify(noteData),
        });
    }

    // DELETE /api/notes/:note_id - Delete a note
    async deleteNote(noteId: string): Promise<void> {
        const url = `/api/notes/${noteId}`;
        const response = await authenticatedFetch(url, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete note: ${response.status}`);
        }
    }
    async downloadNote(note: ResponseNote): Promise<void> {
        const url = `/api/notes/${note.id}/download`;
        await this.fetchWithErrorHandling(url);
        window.open(note.file_url, '_blank');
    }
}

export const notesApi = new NotesAPI();