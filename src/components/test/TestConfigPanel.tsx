import { TestConfig, DEFAULT_CONFIG, TestMode, TestOrder } from '@/types/test';
import { useState } from 'react';

interface Props {
  totalQuestions: number;
  onStart: (config: TestConfig) => void;
  onBack: () => void;
}

export default function TestConfigPanel({ totalQuestions, onStart, onBack }: Props) {
  const [config, setConfig] = useState<TestConfig>(DEFAULT_CONFIG);

  const update = <K extends keyof TestConfig>(key: K, value: TestConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const modes: { value: TestMode; label: string; desc: string }[] = [
    { value: 'mcq', label: 'MCQ', desc: 'Multiple choice with auto-generated options' },
    { value: 'fill', label: 'Fill in Blank', desc: 'Type the answer manually' },
    { value: 'study', label: 'Study', desc: 'View questions with answers revealed' },
  ];

  const negOptions = [0, 0.25, 0.5, 1];
  const timerOptions = [5, 10, 15, 20, 30, 45, 60, 90, 120];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <button
          onClick={onBack}
          className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          ← Back to Questions
        </button>

<h2 className="text-3xl font-bold mb-2 text-center">
Test Configuration
</h2>

<p className="text-muted-foreground mb-8 text-center">
<span className="font-semibold text-primary">
{totalQuestions}
</span> Questions Loaded • Customize Your Mock Test
</p>

        <div className="space-y-6">
          {/* Mode */}
          <div className="card-3d p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Test Mode
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => update('mode', m.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    config.mode === m.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="font-bold text-sm">{m.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Order + Timer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-3d p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Order
              </h3>
              <div className="flex gap-2">
                {(['sequential', 'random'] as TestOrder[]).map((o) => (
                  <button
                    key={o}
                    onClick={() => update('order', o)}
                    className={`flex-1 py-3 rounded-lg border-2 text-sm font-semibold capitalize transition-all ${
                      config.order === o
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-3d p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Timer (min)
              </h3>
              <select
                value={config.timerMinutes}
                onChange={(e) => update('timerMinutes', Number(e.target.value))}
                className="w-full bg-muted border border-border rounded-lg p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {timerOptions.map((t) => (
                  <option key={t} value={t}>{t} minutes</option>
                ))}
              </select>
            </div>
          </div>

          {/* Negative Marking */}
          <div className="card-3d p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Negative Marking
            </h3>
            <div className="flex gap-2">
              {negOptions.map((n) => (
                <button
                  key={n}
                  onClick={() => update('negativeMarking', n)}
                  className={`flex-1 py-3 rounded-lg border-2 text-sm font-bold transition-all ${
                    config.negativeMarking === n
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  -{n}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="card-3d p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Options
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {([
                { key: 'instantFeedback' as const, label: 'Instant Feedback' },
                { key: 'autoNext' as const, label: 'Auto Next' },
              ]).map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <div
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      config[key] ? 'bg-primary' : 'bg-muted'
                    }`}
                    onClick={() => update(key, !config[key])}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-transform ${
                        config[key] ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => onStart(config)}
            className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg transition-all hover:opacity-90 glow-primary"
          >
            Start Test →
          </button>
        </div>
      </div>
    </div>
  );
}
