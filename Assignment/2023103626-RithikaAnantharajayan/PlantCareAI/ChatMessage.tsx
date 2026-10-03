import React, { useState } from 'react';
import { AgentChatMessage } from '../../types/agent';
import { Bot, User, Wrench, ChevronDown, ChevronUp, AlertCircle, Sparkles } from 'lucide-react';
import { AgentActionConfirmation } from './AgentActionConfirmation';

interface ChatMessageProps {
  message: AgentChatMessage;
  onActionComplete: (actionId: string, status: 'confirmed' | 'cancelled', resultMsg: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onActionComplete }) => {
  const isUser = message.role === 'user';
  const [showTools, setShowTools] = useState(false);

  // Render markdown-like simple line breaks and bullets
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-sm font-bold text-slate-900 mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={idx} className="font-semibold text-slate-900 my-1">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      }
      if (line.startsWith('- ')) {
        const bulletContent = line.replace('- ', '');
        // handle inline bold
        const parts = bulletContent.split(/(\*\*.*?\*\*)/g);
        return (
          <li key={idx} className="ml-4 list-disc text-xs sm:text-sm my-0.5 leading-relaxed text-slate-700">
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={pIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className="text-xs sm:text-sm leading-relaxed text-slate-700 my-0.5">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-forest-600 text-white flex items-center justify-center flex-shrink-0 shadow-soft mt-1">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-soft ${
        isUser
          ? 'bg-forest-600 text-white rounded-tr-xs'
          : 'bg-white border border-slate-200/80 rounded-tl-xs'
      }`}>
        {/* User Message */}
        {isUser ? (
          <p className="text-xs sm:text-sm leading-relaxed font-normal">{message.content}</p>
        ) : (
          <div>
            {/* Header: Agent Tag */}
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">PlantCare AI</span>
                <span className="text-[10px] bg-forest-100 text-forest-800 font-semibold px-1.5 py-0.2 rounded">
                  Agentic Mode
                </span>
              </div>
              <span className="text-[10px] text-slate-400">{message.timestamp}</span>
            </div>

            {/* Diagnostic Alert Banner if applicable */}
            {message.isDiagnostic && (
              <div className="mb-3 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/70 text-amber-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>Cautious Botanical Assessment � Non-definitive guidance based on typical symptoms.</span>
              </div>
            )}

            {/* Tool Executions Badge */}
            {message.toolsExecuted && message.toolsExecuted.length > 0 && (
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setShowTools(!showTools)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200/70 text-[11px] font-medium transition-colors"
                >
                  <Wrench className="w-3 h-3 text-forest-600" />
                  <span>Tools Executed ({message.toolsExecuted.length})</span>
                  {showTools ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showTools && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5 text-[11px]">
                    {message.toolsExecuted.map((t, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-600">
                        <span className="font-mono text-forest-700 font-semibold bg-forest-50 px-1 py-0.2 rounded">
                          {t.tool}()
                        </span>
                        <span>� {t.resultSummary}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Main Markdown Body */}
            <div>{renderFormattedText(message.content)}</div>

            {/* Interactive Human Confirmation if Pending Action exists */}
            {message.pendingAction && (
              <AgentActionConfirmation
                action={message.pendingAction}
                onActionComplete={onActionComplete}
              />
            )}
          </div>
        )}

        {isUser && (
          <div className="text-right mt-1">
            <span className="text-[10px] text-forest-100/80">{message.timestamp}</span>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
