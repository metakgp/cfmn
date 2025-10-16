import { authenticatedFetch } from "./authApi.ts";

export interface LeaderboardEntry {
    id: string;
    full_name: string;
    picture: string;
    reputation: number;
    total_notes: number;
    total_upvotes: number;
    total_downloads: number;
    rank: number;
}

class UserAPI {
    private async fetchWithErrorHandling(url: string, options?: RequestInit): Promise<any> {
        try {
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

    // GET /api/users/leaderboard?limit=20
    async getLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
        const url = `/api/users/leaderboard?limit=${limit}`;
        return this.fetchWithErrorHandling(url);
    }

    // GET /api/users/:user_id/leaderboard-position
    async getUserLeaderboardPosition(userId: string): Promise<LeaderboardEntry | null> {
        const url = `/api/users/${userId}/leaderboard-position`;
        try {
            return await this.fetchWithErrorHandling(url);
        } catch (error) {
            console.error('Failed to get user leaderboard position:', error);
            return null;
        }
    }
}

export const userApi = new UserAPI();