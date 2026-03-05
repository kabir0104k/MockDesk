import { Question, TestConfig, AttemptRecord } from '@/types/test';
import {
  calculateScore, calculateMaxStreak, getSimulatedPercentile,
  getSimulatedRank, getAttemptHistory, getTopMistakes,
} from '@/lib/testEngine';
import PerformanceChart from './PerformanceChart';

interface Props {
  questions: Question[];
  answers: Record<number, string>;
  questionTimes: Record<number, number>;
  config: TestConfig;
  onRestart: () => void;
}

export default function ResultsDashboard({ questions, answers, questionTimes, config, onRestart }: Props) {
  const { correct, wrong, unanswered, score, accuracy } = calculateScore(
    questions, answers, config.negativeMarking
  );
  const maxStreak = calculateMaxStreak(questions, answers);
  const percentile = getSimulatedPercentile(accuracy);
  const rank = getSimulatedRank(percentile);
  const totalTime = Object.values(questionTimes).reduce((a, b) => a + b, 0);
  const avgTime = questions.length > 0 ? totalTime / questions.length : 0;
  const history = getAttemptHistory();
  const topMistakes = getTopMistakes(10);

  const statCards = [
    { label: 'Total', value: questions.length, color: 'text-foreground' },
    { label: 'Correct', value: correct, color: 'text-success' },
    { label: 'Wrong', value: wrong, color: 'text-destructive' },
    { label: 'Unanswered', value: unanswered, color: 'text-muted-foreground' },
    { label: 'Score', value: score.toFixed(1), color: 'text-primary' },
    { label: 'Accuracy', value: `${accuracy.toFixed(1)}%`, color: 'text-primary' },
    { label: 'Avg Time', value: `${(avgTime / 1000).toFixed(1)}s`, color: 'text-foreground' },
    { label: 'Max Streak', value: maxStreak, color: 'text-warning' },
    { label: 'Percentile', value: `${percentile}th`, color: 'text-accent' },
    { label: 'Sim. Rank', value: `#${rank}`, color: 'text-accent' },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black mb-2">
            <span className="text-gradient-primary">Results</span>
          </h1>
          <p className="text-muted-foreground">
            {config.mode.toUpperCase()} • {questions.length} questions • Neg: -{config.negativeMarking}
          </p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="card-3d p-5 text-center">
              <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Score Bar */}
        <div className="card-3d p-6 mb-8">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm font-semibold text-muted-foreground">Score Breakdown</span>
          </div>
          <div className="h-6 rounded-full bg-muted flex overflow-hidden">
            {correct > 0 && (
              <div
                className="bg-success h-full transition-all"
                style={{ width: `${(correct / questions.length) * 100}%` }}
              />
            )}
            {wrong > 0 && (
              <div
                className="bg-destructive h-full transition-all"
                style={{ width: `${(wrong / questions.length) * 100}%` }}
              />
            )}
            {unanswered > 0 && (
              <div
                className="bg-muted-foreground/30 h-full transition-all"
                style={{ width: `${(unanswered / questions.length) * 100}%` }}
              />
            )}
          </div>
          <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success" /> Correct</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive" /> Wrong</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted-foreground/30" /> Unanswered</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Performance Trend */}
          <div className="card-3d p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Performance Trend
            </h3>
            <PerformanceChart history={history} />
          </div>

          {/* Attempt History */}
          <div className="card-3d p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Recent Attempts
            </h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No previous attempts.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.slice(0, 5).map((a, i) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                      <span className="ml-2 font-semibold">{a.correct}/{a.totalQuestions}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-bold">{a.accuracy.toFixed(0)}%</span>
                      <span className="ml-2 text-muted-foreground text-xs">{a.mode}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mistake Journal */}
        {topMistakes.length > 0 && (
          <div className="card-3d p-6 mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              🔴 Mistake Journal — Top Repeated Mistakes
            </h3>
            <div className="space-y-2">
              {topMistakes.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <span className="text-sm truncate max-w-[80%]">{m.question}</span>
                  <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded">
                    ×{m.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Review */}
        <div className="card-3d p-6 mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Question Review
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {questions.map((q, i) => {
              const ua = answers[q.id];
              const isCorrect = ua && ua.trim().toLowerCase() === q.answer.trim().toLowerCase();
              const isUnanswered = !ua || ua.trim() === '';
              return (
                <div key={q.id} className={`p-4 rounded-lg border ${
                  isUnanswered ? 'border-border bg-muted/30' :
                  isCorrect ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${
                      isUnanswered ? 'bg-muted text-muted-foreground' :
                      isCorrect ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{q.question}</p>
                      <div className="mt-2 text-xs space-y-1">
                        <div><span className="text-muted-foreground">Correct:</span> <span className="text-success font-semibold">{q.answer}</span></div>
                        {!isUnanswered && !isCorrect && (
                          <div><span className="text-muted-foreground">Your answer:</span> <span className="text-destructive font-semibold">{ua}</span></div>
                        )}
                        {isUnanswered && <div className="text-muted-foreground italic">Unanswered</div>}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {((questionTimes[q.id] || 0) / 1000).toFixed(1)}s
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg transition-all hover:opacity-90 glow-primary"
        >
          Start New Test
        </button>
      </div>
    </div>
  );
}
