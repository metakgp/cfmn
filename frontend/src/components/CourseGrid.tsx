import React from 'react';
import CourseCard from './CourseCard';
import type { CourseGridProps } from '../types';

const CourseGrid: React.FC<CourseGridProps> = ({ notes }) => {
    if (notes.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No notes found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search query</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
                {notes.map((note) => (
                    <CourseCard key={note.id} note={note} />
                ))}
            </div>
        </div>
    );
};
export default CourseGrid;