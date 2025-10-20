// components/UploadModal.tsx
import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { notesApi } from '../api/notesApi';
import type { ResponseNote } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (note: ResponseNote) => void;
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

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

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
    if (!formData.file) {
      setError('Please select a PDF file');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsUploading(true);
    setError(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('course_name', formData.courseName.trim());
      uploadFormData.append('course_code', formData.courseCode.trim());
      uploadFormData.append('year', formData.year);
      uploadFormData.append('semester', formData.semester);
      if (formData.description.trim()) uploadFormData.append('description', formData.description.trim());
      if (formData.professorNames.trim()) uploadFormData.append('professor_names', formData.professorNames.trim());
      if (formData.tags.trim()) uploadFormData.append('tags', formData.tags.trim());
      uploadFormData.append('file', formData.file!);

      const newNote = await notesApi.uploadNote(uploadFormData);
      onSuccess(newNote);
      onClose();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
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
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-surface rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-2xl font-bold text-text-base">Upload Notes</h2>
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
                  placeholder="e.g., Programming and Data Structures"
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
                  placeholder="e.g., CS10003"
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
                  placeholder="e.g., Pralay Mitra, Abhijit Das (comma-separated)"
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
              <label className="block text-sm font-medium text-text-muted mb-2">PDF File *</label>
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
                        Drag and drop your PDF file here, or{' '}
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

            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={resetAndClose} className="px-6 py-2 text-text-muted hover:text-text-base font-medium">
                Cancel
              </button>
              <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center space-x-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading...</span>
                    </>
                ) : (
                    <>
                      <Upload size={16} />
                      <span>Upload Notes</span>
                    </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default UploadModal;