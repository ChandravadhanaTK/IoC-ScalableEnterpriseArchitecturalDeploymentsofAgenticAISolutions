import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  HelpCircle, 
  Loader2, 
  Sparkles, 
  X, 
  ArrowRight, 
  SkipForward, 
  CheckCircle, 
  AlertCircle,
  Zap,
  ListChecks
} from 'lucide-react';
import { agentApi } from '../services/api';

interface StuckModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  taskTitle: string;
  onResolved: () => void;
}

export default function StuckModal({ isOpen, onClose, goalId, taskTitle, onResolved }: StuckModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [adaptationResult, setAdaptationResult] = useState<any>(null);
  const [error, setError] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCaptureAndAdapt = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await agentApi.action(goalId, 'stuck', message || 'Encountered roadblock on this step');
      if (res.data?.new_task || res.data?.stuck_analysis) {
        setAdaptationResult(res.data);
      } else {
        setError('Step adapted. You can close this modal to view your updated step.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to adapt step automatically. You can skip to the next task or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAndMoveNext = async () => {
    setSkipLoading(true);
    try {
      await agentApi.action(goalId, 'skip', 'Skipped from stuck modal');
      handleClose();
      onResolved();
    } catch (err) {
      console.error('Failed to skip task', err);
    } finally {
      setSkipLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setAdaptationResult(null);
    setError('');
    onClose();
  };

  const handleAdoptAndProceed = () => {
    handleClose();
    onResolved();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-navy-800 border border-white/20 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-navy-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-amber/20 border border-accent-amber/30 flex items-center justify-center text-accent-amber shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Roadblock Unblocker</h3>
              <p className="text-xs text-white/50">NextStep Agentic Replanning</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="px-2.5 py-1.5 rounded-lg text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>

        {/* Scrollable Center Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Blocked Task Indicator */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs">
            <span className="text-white/40 block mb-1 font-semibold uppercase text-[10px] tracking-wider">
              Currently Blocked On:
            </span>
            <span className="text-white font-semibold text-sm leading-snug">{taskTitle}</span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!adaptationResult ? (
            <div className="space-y-4">
              <div>
                <label className="label text-xs font-semibold text-white/80">
                  Describe what went wrong or why you are stuck:
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Getting connection timeout error with MongoDB, or don't know where to get the connection URI string..."
                  rows={3}
                  className="input text-xs sm:text-sm w-full min-h-[90px] resize-none"
                  autoFocus
                />
              </div>

              <div className="p-3.5 bg-electric-500/10 border border-electric-500/20 rounded-xl text-xs text-white/80 leading-relaxed">
                <span className="text-electric-300 font-semibold block mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-electric-400" />
                  What NextStep Will Do:
                </span>
                The agent captures this roadblock in your learning profile, breaks down the obstacle, and <strong>immediately replaces this hurdle with a 10–15 minute doable micro-step</strong> so you never stay stuck.
              </div>
            </div>
          ) : (
            /* Successful Adaptation Result View */
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 rounded-xl bg-accent-green/15 border border-accent-green/30 text-accent-green text-xs flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Roadblock captured! The agent replanned and created an unblocker step.</span>
              </div>

              {/* Diagnosis */}
              {adaptationResult.stuck_analysis?.diagnosis && (
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs">
                  <span className="text-electric-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
                    Agent Diagnosis:
                  </span>
                  <p className="text-white/80 leading-relaxed">{adaptationResult.stuck_analysis.diagnosis}</p>
                </div>
              )}

              {/* New Adapted Step */}
              {adaptationResult.new_task && (
                <div className="p-4 bg-gradient-to-r from-electric-500/15 to-purple-500/15 border border-electric-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-electric-300 font-bold text-xs mb-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Your New Doable Step (15 mins):</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-2">
                    {adaptationResult.new_task.title}
                  </h4>
                  <div className="text-xs text-white/70 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto bg-navy-900/40 p-2.5 rounded-lg border border-white/5">
                    {adaptationResult.new_task.description}
                  </div>
                </div>
              )}

              {/* Checklist */}
              {adaptationResult.stuck_analysis?.checklist && adaptationResult.stuck_analysis.checklist.length > 0 && (
                <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-1.5 text-white/60 font-semibold text-xs mb-2">
                    <ListChecks className="w-3.5 h-3.5 text-accent-green" />
                    <span>Immediate Action Checklist:</span>
                  </div>
                  <ul className="space-y-1.5">
                    {adaptationResult.stuck_analysis.checklist.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-white/80 flex items-start gap-2">
                        <span className="text-accent-green font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pinned Bottom Footer with Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-navy-800 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary text-xs py-2.5 px-3.5 text-white/70 hover:text-white"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!adaptationResult ? (
              <>
                <button
                  type="button"
                  onClick={handleSkipAndMoveNext}
                  disabled={skipLoading || loading}
                  className="btn-secondary text-xs py-2.5 px-3.5 text-accent-amber hover:text-accent-amber bg-accent-amber/10 border-accent-amber/30 hover:bg-accent-amber/20 flex items-center gap-1.5"
                  title="Skip this blocked task and move directly to the next task in your goal"
                >
                  {skipLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SkipForward className="w-3.5 h-3.5" />}
                  <span>Skip Task</span>
                </button>

                <button
                  type="button"
                  onClick={handleCaptureAndAdapt}
                  disabled={loading || skipLoading}
                  className="btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 font-bold shadow-lg shadow-electric-500/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Adapting Step…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Capture Roadblock & Adapt Step</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleAdoptAndProceed}
                className="btn-primary text-xs sm:text-sm py-2.5 px-5 flex items-center gap-2 font-bold bg-accent-green hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Start This Doable Step (15 mins)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
