export type VoteType = 'upvote' | 'remove'; // 'downvote' removed for optimism
export interface DBVote {
    id: string;
    user_id: string;
    note_id: string;
    is_upvote: boolean;
    created_at: string | null;
}

export interface ResponseUser {
    id: string;
    google_id: string;
    email: string;
    full_name: string;
    reputation: number;
    created_at: string;
    picture: string;
}

export interface ResponseNote {
    id: string;
    course_name: string;
    course_code: string;
    description?: string;
    professor_names?: string[];
    tags: string[];
    is_public: boolean;
    preview_image_url?: string;
    file_url: string;
    uploader_user: ResponseUser;
    created_at: string;
    upvotes: number;
    downvotes: number;
    user_vote: boolean | null;
    downloads: number;
}

// Keep existing types for component props
export interface SearchBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export interface CourseCardProps {
    note: ResponseNote;
}

export interface CourseGridProps {
    notes: ResponseNote[];
}
// API response types
export interface AuthUser {
    id: string;
    google_id: string;
    email: string;
    full_name: string;
    reputation: number;
    created_at: string;
    picture: string;
}

export interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: () => Promise<void>;
    signOut: () => void;
    googleInitialized: boolean;
    googleScriptLoaded: boolean;

    triggerOneTap?: () => void;
    cancelOneTap?: () => void;
    oneTapDisplayed?: boolean;
    oneTapDismissed?: boolean;
}
