import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, FileText, ThumbsUp, Download, TrendingUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userApi, type LeaderboardEntry } from '../api/userApi';
import { notesApi } from '../api/notesApi';
import type { ResponseNote } from '../types';
import CourseCard from '../components/CourseCard';
import EditNoteModal from '../components/EditNoteModal';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<LeaderboardEntry | null>(null);
  const [userNotes, setUserNotes] = useState<ResponseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<ResponseNote | null>(null);

  // Determine which user profile to show
  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = isAuthenticated && currentUser?.id === targetUserId;

  useEffect(() => {
    if (targetUserId) {
      loadProfileData();
    } else {
      // Not authenticated and no userId in URL
      navigate('/');
    }
  }, [targetUserId]);

  const loadProfileData = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user stats from leaderboard
      const stats = await userApi.getUserLeaderboardPosition(targetUserId);
      setProfileData(stats);

      // Fetch user's notes
      const notes = await notesApi.getUserNotes(targetUserId);
      setUserNotes(notes);
    } catch (err) {
      setError('Failed to load profile. Please try again later.');
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteUpdate = (updatedNote: ResponseNote) => {
    setUserNotes(prev => prev.map(note => note.id === updatedNote.id ? updatedNote : note));
    setEditingNote(null);
  };

  const handleNoteDelete = () => {
    if (editingNote) {
      setUserNotes(prev => prev.filter(note => note.id !== editingNote.id));
      setEditingNote(null);
      // Reload profile data to update stats
      loadProfileData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 text-lg mb-4">{error || 'User not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft size={20} />
          Go back home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text-base mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Profile Header */}
        <div className="bg-surface rounded-xl p-8 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture */}
            {profileData.picture ? (
              <img
                src={profileData.picture}
                alt={profileData.full_name}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center border-4 border-primary">
                <User size={64} className="text-gray-300" />
              </div>
            )}

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-text-base mb-2">
                {profileData.full_name}
                {isOwnProfile && (
                  <span className="ml-3 text-sm bg-primary text-white px-3 py-1 rounded-full">
                    Your Profile
                  </span>
                )}
              </h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-background rounded-lg p-4">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <TrendingUp size={18} className="text-primary" />
                    <span className="text-sm text-text-muted">Reputation</span>
                  </div>
                  <p className="text-2xl font-bold text-text-base text-center md:text-left">
                    {profileData.reputation.toFixed(0)}
                  </p>
                </div>

                <div className="bg-background rounded-lg p-4">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <FileText size={18} className="text-blue-500" />
                    <span className="text-sm text-text-muted">Notes</span>
                  </div>
                  <p className="text-2xl font-bold text-text-base text-center md:text-left">
                    {profileData.total_notes}
                  </p>
                </div>

                <div className="bg-background rounded-lg p-4">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <ThumbsUp size={18} className="text-green-500" />
                    <span className="text-sm text-text-muted">Upvotes</span>
                  </div>
                  <p className="text-2xl font-bold text-text-base text-center md:text-left">
                    {profileData.total_upvotes}
                  </p>
                </div>

                <div className="bg-background rounded-lg p-4">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <Download size={18} className="text-purple-500" />
                    <span className="text-sm text-text-muted">Downloads</span>
                  </div>
                  <p className="text-2xl font-bold text-text-base text-center md:text-left">
                    {profileData.total_downloads}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Notes Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-base mb-6">
            {isOwnProfile ? 'Your Uploaded Notes' : `Notes by ${profileData.full_name.split(' ')[0]}`}
            <span className="ml-3 text-lg text-text-muted font-normal">
              ({userNotes.length})
            </span>
          </h2>

          {userNotes.length === 0 ? (
            <div className="bg-surface rounded-xl p-12 text-center">
              <FileText size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400 text-lg">
                {isOwnProfile ? "You haven't uploaded any notes yet" : 'No notes uploaded yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {userNotes.map((note) => (
                <CourseCard
                  key={note.id}
                  note={note}
                  showEditButton={isOwnProfile}
                  onEdit={() => setEditingNote(note)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Note Modal */}
      {editingNote && (
        <EditNoteModal
          isOpen={true}
          onClose={() => setEditingNote(null)}
          onSuccess={handleNoteUpdate}
          onDelete={handleNoteDelete}
          note={editingNote}
        />
      )}
    </div>
  );
};

export default ProfilePage;
