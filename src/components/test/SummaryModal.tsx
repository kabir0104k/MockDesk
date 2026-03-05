import { Question } from '@/types/test';
import { getPaletteStatus } from '@/lib/testEngine';

interface Props {
  questions: Question[];
  answers: Record<number, string>;
  marked: Record<number, boolean>;
  visited: Record<number, boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SummaryModal({ questions, answers, marked, visited, onConfirm, onCancel }: Props) {
  const counts = { notVisited: 0, notAnswered: 0, answered: 0, review: 0, answeredReview: 0 };
  questions.forEach((q) => {
    const s = getPaletteStatus(q.id, answers, marked, visited);
    if (s === 'not-visited') counts.notVisited++;
    else if (s === 'not-answered') counts.notAnswered++;
    else if (s === 'answered') counts.answered++;
    else if (s === 'review') counts.review++;
    else if (s === 'answered-review') counts.answeredReview++;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="card-3d-elevated p-8 max-w-lg w-full mx-4 animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-2">Submit Test?</h2>
        <p className="text-muted-foreground mb-6">Review your attempt before final submission.</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Answered', value: counts.answered + counts.answeredReview, color: 'text-success' },
            { label: 'Not Answered', value: counts.notAnswered, color: 'text-destructive' },
            { label: 'Not Visited', value: counts.notVisited, color: 'text-muted-foreground' },
            { label: 'Marked for Review', value: counts.review + counts.answeredReview, color: 'text-accent' },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-lg bg-muted/50">
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mini grid */}
        <div className="grid grid-cols-10 gap-1 mb-6">
          {questions.map((q, i) => {
            const status = getPaletteStatus(q.id, answers, marked, visited);
            const colorMap: Record<string, string> = {
              'not-visited': 'bg-palette-not-visited',
              'not-answered': 'bg-palette-not-answered',
              'answered': 'bg-palette-answered',
              'review': 'bg-palette-review',
              'answered-review': 'bg-palette-answered-review',
            };
            return (
              <div key={q.id} className={`w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center ${colorMap[status]} text-white`}>
                {i + 1}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg border-2 border-border text-sm font-semibold hover:bg-muted transition-all"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-lg bg-warning text-warning-foreground text-sm font-bold hover:opacity-90 transition-all glow-submit"
          >
            Confirm Submit
          </button>
        </div>
      </div>
    </div>
  );
}
