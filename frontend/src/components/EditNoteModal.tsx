import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle, Trash2 } from 'lucide-react';
import { notesApi } from '../api/notesApi';
import type { ResponseNote } from '../types';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (note: ResponseNote) => void;
  onDelete: () => void;
  note: ResponseNote;
}

interface FormData {
  courseName: string;
  courseCode: string;
  year: string;
  semester: 'Autumn' | 'Spring';
  description: string;
  professorNames: string;
  tags: string;
  file: File | null;
}

const EditNoteModal: React.FC<EditNoteModalProps> = ({ isOpen, onClose, onSuccess, onDelete, note }) => {
  const [formData, setFormData] = useState<FormData>({
    courseName: '',
    courseCode: '',
    year: new Date().getFullYear().toString(),
    semester: 'Autumn',
    description: '',
    professorNames: '',
    tags: '',
    file: null,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Populate form with current note data when modal opens
  useEffect(() => {
    if (isOpen && note) {
      setFormData({
        courseName: note.course_name,
        courseCode: note.course_code,
        year: note.year.toString(),
        semester: note.semester as 'Autumn' | 'Spring',
        description: note.description || '',
        professorNames: note.professor_names?.join(', ') || '',
        tags: note.tags.join(', '),
        file: null, // Don't populate file - it's optional for updates
      });
    }
  }, [isOpen, note]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFileChange = (file: File | null) => {
    if (file && file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }
    setFormData(prev => ({ ...prev, file }));
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.courseName.trim()) {
      setError('Course name is required');
      return false;
    }
    if (!formData.courseCode.trim()) {
      setError('Course code is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsUpdating(true);
    setError(null);

    try {
      const updateFormData = new FormData();
      updateFormData.append('course_name', formData.courseName.trim());
      updateFormData.append('course_code', formData.courseCode.trim());
      updateFormData.append('year', formData.year);
      updateFormData.append('semester', formData.semester);
      if (formData.description.trim()) updateFormData.append('description', formData.description.trim());
      if (formData.professorNames.trim()) updateFormData.append('professor_names', formData.professorNames.trim());
      if (formData.tags.trim()) updateFormData.append('tags', formData.tags.trim());

      // Only append file if a new one was selected
      if (formData.file) {
        updateFormData.append('file', formData.file);
      }

      const updatedNote = await notesApi.updateNote(note.id, updateFormData);
      onSuccess(updatedNote);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await notesApi.deleteNote(note.id);
      setShowDeleteDialog(false);
      onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed. Please try again.');
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetAndClose = () => {
    setFormData({
      courseName: '',
      courseCode: '',
      year: new Date().getFullYear().toString(),
      semester: 'Autumn',
      description: '',
      professorNames: '',
      tags: '',
      file: null
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-surface rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-2xl font-bold text-text-base">Edit Note</h2>
            <button onClick={resetAndClose} className="p-2 text-text-muted hover:text-text-base hover:bg-gray-700 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="flex items-center space-x-2 p-4 bg-red-900 border border-red-700 rounded-lg text-red-300">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Course Name *</label>
              <input
                type="text"
                value={formData.courseName}
                onChange={(e) => handleInputChange('courseName', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Data Structures and Algorithms"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Course Code *</label>
              <input
                type="text"
                value={formData.courseCode}
                onChange={(e) => handleInputChange('courseCode', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., CS101"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Year *</label>
                <select
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-surface rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Semester *</label>
                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="semester"
                      value="Autumn"
                      checked={formData.semester === 'Autumn'}
                      onChange={(e) => handleInputChange('semester', e.target.value)}
                      className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-text-base">Autumn</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="semester"
                      value="Spring"
                      checked={formData.semester === 'Spring'}
                      onChange={(e) => handleInputChange('semester', e.target.value)}
                      className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-text-base">Spring</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border bg-surface rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Brief description of the notes content..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Professor Names</label>
              <input
                type="text"
                value={formData.professorNames}
                onChange={(e) => handleInputChange('professorNames', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Dr. Smith, Prof. Johnson (comma-separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., algorithms, sorting, trees (comma-separated)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">PDF File (optional - leave empty to keep current file)</label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? 'border-primary bg-gray-800' : 'border-border hover:border-primary'}`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              >
                {formData.file ? (
                  <div className="flex items-center justify-center space-x-2 text-green-400">
                    <FileText size={20} />
                    <span className="font-medium">{formData.file.name}</span>
                    <button type="button" onClick={() => handleFileChange(null)} className="text-red-400 hover:text-red-300">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={40} className="mx-auto text-gray-500 mb-2" />
                    <p className="text-text-muted mb-2">
                      Drag and drop a new PDF file here to replace, or{' '}
                      <label className="text-primary cursor-pointer hover:underline">
                        browse
                        <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} className="hidden" />
                      </label>
                    </p>
                    <p className="text-sm text-gray-500">Only PDF files are supported</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center space-x-2 text-red-500 hover:text-red-400 font-medium transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete Note</span>
              </button>

              <div className="flex space-x-4">
                <button type="button" onClick={resetAndClose} className="px-6 py-2 text-text-muted hover:text-text-base font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center space-x-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Update Note</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        noteTitle={`${note.course_code} - ${note.course_name}`}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default EditNoteModal;
