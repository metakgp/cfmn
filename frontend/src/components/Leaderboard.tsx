import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, FileText, Download, ThumbsUp, User } from 'lucide-react';
import { userApi, type LeaderboardEntry } from '../api/userApi';
import { useAuth } from '../contexts/AuthContext';

const Leaderboard: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [topEntries, setTopEntries] = useState<LeaderboardEntry[]>([]);
    const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadLeaderboard();
    }, [user]);

    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load top 20
            const top20 = await userApi.getLeaderboard(20);
            setTopEntries(top20);

            // Load user's position if authenticated
            if (isAuthenticated && user?.id) {
                const position = await userApi.getUserLeaderboardPosition(user.id);

                // Only set user position if they're not in top 20
                const isInTop20 = top20.some(entry => entry.id === user.id);
                if (!isInTop20 && position) {
                    setUserPosition(position);
                } else {
                    setUserPosition(null);
                }
            }
        } catch (err) {
            setError('Failed to load leaderboard. Please try again later.');
            console.error('Failed to load leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="text-yellow-500" size={24} />;
        if (rank === 2) return <Medal className="text-gray-400" size={24} />;
        if (rank === 3) return <Medal className="text-amber-600" size={24} />;
        return <Award className="text-gray-500" size={20} />;
    };

    const getRankBadgeColor = (rank: number) => {
        if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
        if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white';
        if (rank === 3) return 'bg-gradient-to-br from-amber-500 to-amber-700 text-white';
        return 'bg-gray-700 text-gray-300';
    };

    const LeaderboardRow: React.FC<{ entry: LeaderboardEntry; isCurrentUser?: boolean }> = ({
                                                                                                entry,
                                                                                                isCurrentUser = false
                                                                                            }) => (
        <div
            className={`flex items-center p-4 rounded-lg transition-all ${
                isCurrentUser
                    ? 'bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-surface hover:bg-gray-800'
            }`}
        >
            {/* Rank */}
            <div className="flex items-center justify-center w-16 flex-shrink-0">
                {entry.rank <= 3 ? (
                    getRankIcon(entry.rank)
                ) : (
                    <span className={`text-lg font-bold px-3 py-1 rounded-full ${getRankBadgeColor(entry.rank)}`}>
                        #{entry.rank}
                    </span>
                )}
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
                {entry.picture ? (
                    <img
                        src={entry.picture}
                        alt={entry.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                        <User size={24} className="text-gray-300" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-text-base truncate">
                        {entry.full_name}
                        {isCurrentUser && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                                You
                            </span>
                        )}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-text-muted mt-1">
                        <span className="flex items-center space-x-1">
                            <TrendingUp size={14} />
                            <span className="font-semibold text-primary">{entry.reputation.toFixed(1)}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2 text-text-muted">
                    <FileText size={16} />
                    <span>{entry.total_notes}</span>
                </div>
                <div className="flex items-center space-x-2 text-text-muted">
                    <ThumbsUp size={16} />
                    <span>{entry.total_upvotes}</span>
                </div>
                <div className="flex items-center space-x-2 text-text-muted">
                    <Download size={16} />
                    <span>{entry.total_downloads}</span>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center py-20">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-3 text-text-muted">Loading leaderboard...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="p-4 bg-red-900 border border-red-700 rounded-lg text-red-300 max-w-3xl mx-auto">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                        <Trophy className="text-yellow-500" size={40} />
                        <h1 className="text-4xl font-bold text-text-base">Leaderboard</h1>
                    </div>
                    <p className="text-text-muted">Top contributors in the CFMN community</p>
                </div>

                {/* Stats Legend */}
                <div className="flex items-center justify-center space-x-6 mb-6 p-4 bg-surface rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-text-muted">
                        <TrendingUp size={16} className="text-primary" />
                        <span>Reputation</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-text-muted">
                        <FileText size={16} />
                        <span>Notes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-text-muted">
                        <ThumbsUp size={16} />
                        <span>Upvotes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-text-muted">
                        <Download size={16} />
                        <span>Downloads</span>
                    </div>
                </div>

                {/* Top 20 */}
                <div className="space-y-3 mb-6">
                    {topEntries.map((entry) => (
                        <LeaderboardRow
                            key={entry.id}
                            entry={entry}
                            isCurrentUser={isAuthenticated && user?.id === entry.id}
                        />
                    ))}
                </div>

                {/* User's Position (if not in top 20) */}
                {userPosition && (
                    <div className="mt-8">
                        <div className="flex items-center justify-center space-x-2 mb-3">
                            <div className="flex-1 h-px bg-gray-700"></div>
                            <span className="text-sm text-text-muted px-4">Your Position</span>
                            <div className="flex-1 h-px bg-gray-700"></div>
                        </div>
                        <LeaderboardRow entry={userPosition} isCurrentUser />
                    </div>
                )}

                {/* Empty State */}
                {topEntries.length === 0 && (
                    <div className="text-center py-12">
                        <Trophy className="mx-auto text-gray-600 mb-4" size={64} />
                        <p className="text-text-muted text-lg">No leaderboard data available yet.</p>
                        <p className="text-text-muted text-sm mt-2">Be the first to upload notes and gain reputation!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;