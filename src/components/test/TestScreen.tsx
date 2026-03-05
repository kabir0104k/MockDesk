import { Question, TestConfig } from '@/types/test';
import { getPaletteStatus } from '@/lib/testEngine';
import { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
  questions: Question[];
  config: TestConfig;
  currentIndex: number;
  answers: Record<number, string>;
  marked: Record<number, boolean>;
  visited: Record<number, boolean>;
  timeRemaining: number;
  feedbackShown: number | null;
  onAnswer: (qId: number, answer: string) => void;
  onNavigate: (index: number) => void;
  onMark: (qId: number) => void;
  onClearAnswer: (qId: number) => void;
  onSubmit: () => void;
  tabSwitchCount: number;
}

export default function TestScreen({
  questions, config, currentIndex, answers, marked, visited,
  timeRemaining, feedbackShown, onAnswer, onNavigate, onMark,
  onClearAnswer, onSubmit, tabSwitchCount,
}: Props) {
  const [showPalette, setShowPalette] = useState(true);
  const [fillInput, setFillInput] = useState('');
  const q = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  // Sync fill input with existing answer
  useEffect(() => {
    if (config.mode === 'fill') {
      setFillInput(answers[q.id] || '');
    }
  }, [q.id, config.mode, answers]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const isCorrect = (qId: number) => {
    const ua = answers[qId];
    if (!ua) return null;
    const q2 = questions.find((x) => x.id === qId);
    return ua.trim().toLowerCase() === q2?.answer.trim().toLowerCase();
  };

  const showFeedbackFor = feedbackShown === q.id;
  const answeredCount = Object.values(answers).filter((a) => a && a.trim() !== '').length;

  // Palette counts
  const counts = { notVisited: 0, notAnswered: 0, answered: 0, review: 0, answeredReview: 0 };
  questions.forEach((qq) => {
    const s = getPaletteStatus(qq.id, answers, marked, visited);
    if (s === 'not-visited') counts.notVisited++;
    else if (s === 'not-answered') counts.notAnswered++;
    else if (s === 'answered') counts.answered++;
    else if (s === 'review') counts.review++;
    else if (s === 'answered-review') counts.answeredReview++;
  });

  const timerDanger = timeRemaining < 60;
  const timerWarning = timeRemaining < 300 && !timerDanger;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg">
            <span className="text-gradient-primary">CBT</span> Mock Test
          </h2>
          <span className="text-sm text-muted-foreground font-mono">
            {config.mode.toUpperCase()} • {answeredCount}/{questions.length}
          </span>
          {tabSwitchCount > 0 && (
            <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded font-semibold">
              ⚠ {tabSwitchCount} tab switch{tabSwitchCount > 1 ? 'es' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`font-mono text-xl font-bold px-4 py-1 rounded-lg ${
              timerDanger
                ? 'text-destructive bg-destructive/10 animate-pulse-soft'
                : timerWarning
                ? 'text-warning bg-warning/10'
                : 'text-foreground bg-muted'
            }`}
          >
            {formatTime(timeRemaining)}
          </div>
          <button
            onClick={() => setShowPalette(!showPalette)}
            className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg bg-muted transition-colors"
          >
            {showPalette ? 'Hide' : 'Show'} Palette
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Main Question Area */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto animate-fade-in-up" key={q.id}>
            <div className="card-3d-elevated p-5 lg:p-8">
              {/* Question Header */}
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-lg">
                  Q{currentIndex + 1}
                </span>
                {marked[q.id] && (
                  <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded">
                    📌 Marked
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h3 className="text-xl font-semibold leading-relaxed mb-8">
                {q.question}
              </h3>

              {/* Study Mode */}
              {config.mode === 'study' && (
                <div className="p-4 rounded-lg bg-success/10 border border-success/30">
                  <span className="text-sm text-muted-foreground">Answer:</span>
                  <p className="text-lg font-bold text-success mt-1">{q.answer}</p>
                </div>
              )}

              {/* MCQ Options */}
              {config.mode === 'mcq' && q.options && (
                <div className="space-y-3">
                  {q.options.map((opt, i) => {
                    const selected = answers[q.id] === opt;
                    const optCorrect = opt.trim().toLowerCase() === q.answer.trim().toLowerCase();
                    let optClass = 'border-border hover:border-primary/50';
                    if (selected) optClass = 'border-primary bg-primary/10';
                    if (showFeedbackFor) {
                      if (optCorrect) optClass = 'border-success bg-success/10';
                      else if (selected && !optCorrect)
                        optClass = 'border-destructive bg-destructive/10';
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => onAnswer(q.id, opt)}
                    disabled={feedbackShown !== null && feedbackShown === q.id}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${optClass}`}
                      >
                        <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-base">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fill Mode */}
              {config.mode === 'fill' && (
                <div>
                  <input
                    type="text"
                    value={fillInput}
                    onChange={(e) => setFillInput(e.target.value)}
                    onBlur={() => onAnswer(q.id, fillInput)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onAnswer(q.id, fillInput);
                    }}
                    placeholder="Type your answer..."
                    className="w-full bg-muted border border-border rounded-lg p-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
                    disabled={feedbackShown !== null && feedbackShown === q.id}
                  />
                  {showFeedbackFor && (
                    <div className={`mt-3 p-3 rounded-lg ${
                      isCorrect(q.id) ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {isCorrect(q.id) ? '✓ Correct!' : `✗ Wrong. Answer: ${q.answer}`}
                    </div>
                  )}
                </div>
              )}

              {/* Feedback for MCQ */}
              {config.mode === 'mcq' && showFeedbackFor && (
                <div className={`mt-4 p-3 rounded-lg text-sm font-semibold ${
                  isCorrect(q.id) ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                }`}>
                  {isCorrect(q.id) ? '✓ Correct!' : `✗ Wrong. Answer: ${q.answer}`}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 gap-4">
              <div className="flex gap-3">
                <button
                  onClick={() => onMark(q.id)}
                  className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all border-2 ${
                    marked[q.id]
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted-foreground hover:border-accent/50'
                  }`}
                >
                  {marked[q.id] ? '📌 Unmark' : '📌 Mark for Review'}
                </button>
                {answers[q.id] && (
                  <button
                    onClick={() => onClearAnswer(q.id)}
                    className="px-5 py-3 rounded-lg text-sm font-semibold border-2 border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => onNavigate(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="px-5 py-3 rounded-lg text-sm font-semibold bg-muted text-foreground hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                {isLast ? (
                  <button
                    onClick={onSubmit}
                    className="px-8 py-3 rounded-lg text-sm font-bold bg-warning text-warning-foreground hover:opacity-90 transition-all glow-submit"
                  >
                    Submit Test
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigate(currentIndex + 1)}
                    className="px-5 py-3 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Palette Sidebar */}
        {showPalette && (
          <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border bg-card/50 p-6 overflow-y-auto shrink-0">
            {/* Legend */}
            <div className="space-y-2 mb-6 text-xs">
              {[
                { color: 'bg-palette-not-visited', label: 'Not Visited', count: counts.notVisited },
                { color: 'bg-palette-not-answered', label: 'Not Answered', count: counts.notAnswered },
                { color: 'bg-palette-answered', label: 'Answered', count: counts.answered },
                { color: 'bg-palette-review', label: 'Review', count: counts.review },
                { color: 'bg-palette-answered-review', label: 'Answered+Review', count: counts.answeredReview },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded ${l.color}`} />
                  <span className="text-muted-foreground">{l.label}</span>
                  <span className="ml-auto font-mono font-bold">{l.count}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 gap-2">
              {questions.map((qq, i) => {
                const status = getPaletteStatus(qq.id, answers, marked, visited);
                const colorMap: Record<string, string> = {
                  'not-visited': 'bg-palette-not-visited text-foreground',
                  'not-answered': 'bg-palette-not-answered text-white',
                  'answered': 'bg-palette-answered text-white',
                  'review': 'bg-palette-review text-white',
                  'answered-review': 'bg-palette-answered-review text-black',
                };
                return (
                  <button
                    key={qq.id}
                    onClick={() => onNavigate(i)}
                    className={`w-10 h-10 rounded-lg text-xs font-bold transition-all hover:scale-110 ${
                      colorMap[status]
                    } ${currentIndex === i ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Submit from palette */}
            <button
              onClick={onSubmit}
              className={`w-full mt-6 py-3 rounded-lg text-sm font-bold transition-all ${
                isLast
                  ? 'bg-warning text-warning-foreground glow-submit'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Submit Test
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
