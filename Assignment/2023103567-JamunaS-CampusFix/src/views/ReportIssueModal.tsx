import React, { useState } from 'react';
import { IssueCategory, IssuePriority, AIClassificationResult, Issue } from '../types';
import { api } from '../services/api';
import {
  X,
  Sparkles,
  AlertCircle,
  Upload,
  Check,
  Building,
  Loader2,
  FileText,
  MapPin,
  Tag,
  Flame,
  Info,
} from 'lucide-react';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (issue: Issue) => void;
}

const CATEGORIES: IssueCategory[] = [
  'Hostel',
  'Classroom',
  'Laboratory',
  'Library',
  'Canteen',
  'Transport',
  'Electricity',
  'Water',
  'Internet',
  'Cleanliness',
  'Other',
];

const PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical'];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Hostel');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [imageUrl, setImageUrl] = useState('');

  // AI Classification state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIClassificationResult | null>(null);
  const [appliedAi, setAppliedAi] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAIClassify = async () => {
    if (!title && !description) {
      setError('Please enter an issue title or description for AI classification.');
      return;
    }

    try {
      setAiLoading(true);
      setError(null);
      const res = await api.ai.classify({
        title,
        description,
        category,
        priority,
      });

      if (res.result) {
        setAiSuggestion(res.result);
        setAppliedAi(false);
      }
    } catch (err) {
      console.warn('AI classification failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setCategory(aiSuggestion.category);
    setPriority(aiSuggestion.priority);
    setAppliedAi(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !location.trim()) {
      setError('Please fill all required fields (Title, Description, and Location).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.issues.create({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        priority,
        imageUrl: imageUrl.trim() || undefined,
      });

      // Reset
      setTitle('');
      setDescription('');
      setLocation('');
      setImageUrl('');
      setAiSuggestion(null);

      onSuccess(res.issue);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Unable to submit issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              Report New Campus Issue
            </h2>
            <p className="text-xs text-slate-500">
              Submit your maintenance, technical, or facility concern for rapid resolution.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Water leaking in hostel 3rd floor bathroom or Wi-Fi offline in Library"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Detailed Description <span className="text-red-500">*</span>
              </label>

              {/* AI Suggest Button */}
              <button
                type="button"
                onClick={handleAIClassify}
                disabled={aiLoading || (!title && !description)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 hover:bg-blue-100"
              >
                {aiLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>AI Auto-Detect & Route</span>
              </button>
            </div>

            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details of the defect, symptoms, when it was noticed, and how it impacts students..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* AI Suggestion Banner if generated */}
          {aiSuggestion && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-4 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">AI Classification Suggestion</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 text-blue-800 font-semibold">
                        {Math.round(aiSuggestion.confidence * 100)}% match
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{aiSuggestion.reasoning}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-medium">
                        Category: <strong className="text-blue-600">{aiSuggestion.category}</strong>
                      </span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-medium">
                        Priority: <strong className="text-amber-600">{aiSuggestion.priority}</strong>
                      </span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-medium">
                        Department: <strong className="text-indigo-600">{aiSuggestion.department}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {!appliedAi ? (
                  <button
                    type="button"
                    onClick={applyAiSuggestion}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shrink-0 shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply
                  </button>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 shrink-0 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <Check className="w-3.5 h-3.5" />
                    Applied
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Category & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p} {p === 'Critical' ? '⚠️ (Immediate Hazard)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Specific Location on Campus <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Block B Hostel, 3rd Floor East Wing, Room 314"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Optional Image URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Photo Evidence / Image URL (Optional)</span>
              <span className="text-[11px] text-slate-400 font-normal">Direct link or image URL</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
            {imageUrl && (
              <div className="mt-2 w-28 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setError('Image URL appears broken or inaccessible.')}
                />
              </div>
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Database...</span>
                </>
              ) : (
                <span>Submit Campus Issue</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
