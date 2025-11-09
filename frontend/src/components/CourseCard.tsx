// components/CourseCard.tsx
import React, { useState } from 'react';
import { Download, Edit, FileText, ThumbsUp } from 'lucide-react';
import { useSignInFlow } from '../hooks/useSignInFlow';
import SignInModal from './SignInModal';
import type { CourseCardProps, VoteType } from '../types';
import { notesApi } from '../api/notesApi';
import { useAuth } from '../contexts/AuthContext';

const CourseCard: React.FC<CourseCardProps> = ({ note, showEditButton = false, onEdit }) => {
    const { isAuthenticated, user } = useAuth();
    const {
        showSignInModal,
        triggerSignIn,
        handleSignInSuccess,
        handleSignInClose,
        modalOptions
    } = useSignInFlow();

    const convertVoteToString = (vote: boolean | null): 'upvote' | 'downvote' | null => {
        if (vote === true) return 'upvote';
        if (vote === false) return 'downvote';
        return null;
    };

    const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(
        convertVoteToString(note.user_vote)
    );
    const [upvoteCount, setUpvoteCount] = useState(note.upvotes || 0);
    const [downloadCount, setDownloadCount] = useState(note.downloads || 0);
    const [isVoting, setIsVoting] = useState(false);
    const [imageError, setImageError] = useState(false);

    const isOwner = user && note.uploader_user.id === user.id;
    const shouldShowEditButton = showEditButton && isOwner;

    const requireAuth = (actionName: string, action: () => void) => {
        if (!isAuthenticated) {
            triggerSignIn(
                action,
                {
                    title: `Sign In to ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}`,
                    message: `Please sign in to ${actionName} this content.`,
                    actionContext: actionName
                }
            );
            return;
        }
        action();
    };

    const truncateText = (text: string, maxLength: number = 100): string => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    };

    const getVisibleTags = (tags: string[], maxTags: number = 3) => {
        if (!tags || tags.length === 0) return { visibleTags: [], remainingCount: 0 };
        const visibleTags = tags.slice(0, maxTags);
        const remainingCount = Math.max(0, tags.length - maxTags);
        return { visibleTags, remainingCount };
    };

    const handleVote = async (voteType: 'upvote') => {
        if (isVoting) return;

        requireAuth(voteType, async () => {
            setIsVoting(true);
            const previousVote = userVote;

            try {
                const actualVoteType: VoteType = userVote === voteType ? 'remove' : voteType;

                if (actualVoteType === 'remove') {
                    setUserVote(null);
                    if (previousVote === 'upvote') setUpvoteCount(prev => Math.max(0, prev - 1));
                } else if (actualVoteType === 'upvote') {
                    setUserVote('upvote');
                    setUpvoteCount(prev => prev + 1);
                }

                await notesApi.voteOnNote(note.id, actualVoteType);
            } catch (error) {
                setUserVote(previousVote);
                setUpvoteCount(upvoteCount);
                console.error('Vote failed:', error);
                alert('Failed to vote. Please try again.');
            } finally {
                setIsVoting(false);
            }
        });
    };

    const handleDownload = async () => {
        try {
            await notesApi.downloadNote(note);
            setDownloadCount(prev => prev + 1);
            window.open(note.file_url, '_blank');
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download file. Please try again.');
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit();
        } else {
            console.log(`Editing notes for ${note.course_name}`);
        }
    };

    const { visibleTags, remainingCount } = getVisibleTags(note.tags, 3);
    const shouldShowPlaceholder = !note.preview_image_url || imageError;

    const semesterLabel = (note.semester ?? '').trim() || 'Semester';
    const yearLabel = Number.isFinite(note.year) ? String(note.year) : '—';

    return (
        <>
            <div className="bg-surface rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
                {/* --- Card Image Preview --- */}
                <div className="relative w-full h-48 bg-gray-900">
                    {shouldShowPlaceholder ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                            <FileText className="text-gray-600 mb-2" size={40} />
                            <span className="text-gray-500 text-sm font-medium text-center">Notes Preview</span>
                        </div>
                    ) : (
                        <img
                            src={note.preview_image_url}
                            alt={`${note.course_name} preview`}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    )}
                    {shouldShowEditButton && (
                        <button
                            onClick={handleEdit}
                            className="absolute top-3 right-3 bg-surface bg-opacity-80 backdrop-blur-sm text-text-muted hover:text-primary p-2 rounded-full shadow-lg transition-colors duration-200"
                            title="Edit note"
                        >
                            <Edit size={18} />
                        </button>
                    )}
                </div>

                {/* --- Card Content --- */}
                <div className="p-5 flex flex-col flex-grow">
                    {/* Course Header Pills */}
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold text-primary uppercase tracking-wider bg-gray-800 px-3 py-1 rounded-md">
                            {note.course_code}
                        </span>
                        <span className="text-xs font-medium text-secondary bg-gray-800/80 px-2 py-1 rounded-full">
                            {semesterLabel}
                        </span>
                        <span className="text-xs font-medium text-secondary bg-gray-800/80 px-2 py-1 rounded-full">
                            {yearLabel}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-text-base leading-tight mb-2">
                        {note.course_name}
                    </h3>

                    {/* Description */}
                    <div className="mb-4 flex-grow">
                        {note.description ? (
                            <p className="text-text-muted text-sm leading-relaxed">
                                {truncateText(note.description)}
                            </p>
                        ) : (
                            <p className="text-gray-600 text-sm italic">No description provided</p>
                        )}
                    </div>

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {visibleTags.map((tag, index) => (
                                <span key={index} className="px-2.5 py-1 bg-gray-800 text-secondary text-xs rounded-full">
                                    {tag}
                                </span>
                            ))}
                            {remainingCount > 0 && (
                                <span className="px-2.5 py-1 bg-gray-700 text-text-muted text-xs rounded-full">
                                    +{remainingCount}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Professors & Uploader */}
                    <div className="text-sm text-text-muted mb-4 space-y-1">
                        {note.professor_names && note.professor_names.length > 0 && (
                            <p>
                                <span className="font-semibold text-gray-500">Prof:</span> {note.professor_names.join(', ')}
                            </p>
                        )}
                        <p>
                            <span className="font-semibold text-gray-500">By:</span> {note.uploader_user.full_name}
                        </p>
                    </div>

                    {/* Spacer to push footer to the bottom */}
                    <div className="flex-grow" />

                    {/* --- Card Footer --- */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => handleVote('upvote')}
                                disabled={isVoting}
                                className={`flex items-center space-x-1.5 text-sm font-medium transition-colors duration-200 ${
                                    userVote === 'upvote'
                                        ? 'text-green-400'
                                        : 'text-text-muted hover:text-green-400'
                                } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Upvote"
                                aria-pressed={userVote === 'upvote'}
                            >
                                <ThumbsUp size={18} fill={userVote === 'upvote' ? 'currentColor' : 'none'} />
                                <span>{upvoteCount}</span>
                            </button>
                            <div className="flex items-center space-x-1 text-text-muted" title="Total Downloads">
                                <Download size={16} />
                                <span>{downloadCount}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleDownload}
                            className="bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-hover transition-colors duration-200 text-sm font-semibold shadow-md"
                        >
                            View PDF
                        </button>
                    </div>
                </div>
            </div>

            <SignInModal
                isOpen={showSignInModal}
                onClose={handleSignInClose}
                onSuccess={handleSignInSuccess}
                title={modalOptions.title}
                message={modalOptions.message}
                actionContext={modalOptions.actionContext}
            />
        </>
    );
};

export default CourseCard;