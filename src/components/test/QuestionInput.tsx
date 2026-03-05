import { useState } from 'react';
import { parseQuestions } from '@/lib/testEngine';
import { RawQuestion } from '@/types/test';

interface Props {
  onSubmit: (questions: RawQuestion[]) => void;
}

const SAMPLE = `What was the venue of the Cricket World Cup 2023?
India

Where is the headquarters of ISRO located?
Bengaluru

What is the validity time of a cheque?
3 Months

When is National Science Day celebrated?
February 28

Which was the first bank in India?
Bank of Hindustan

What percentage of Nitrogen is present in the air?
78%

Where were the first Olympic Games held?
Athens, Greece

Which team was the opponent in Sachin Tendulkar's first Test match in 1989?
Pakistan

What is the shortcut key to expand the browsing screen in a web browser?
F11

When did the Shimla Agreement take place?
1972

What does ASCII stand for?
American Standard Code for Information Interchange

Which gases are found on Saturn?
Hydrogen and Helium

What is the process called in which Zinc Oxide is applied to metals to stop them from rusting?
Galvanization

What is the full form of DBMS?
Database Management System

Which fundamental right is guaranteed even to non-citizens of India?
Article 21 – Right to Life & Personal Liberty

In which month was the Second Round Table Conference held in 1931?
September

Who was awarded the Nobel Prize in Literature in 2015?
Svetlana Alexievich

How many Fundamental Duties are there in the Indian Constitution?
11

What is the treatment for Leucoderma (Safed Daag)?
Pseudocatalase

Who received the Confucius Award in 2016?
Robert Mugabe of Zimbabwe`;

export default function QuestionInput({ onSubmit }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const questions = parseQuestions(text);
    if (questions.length < 2) {
      setError('Please enter at least 2 questions in the correct format.');
      return;
    }
    setError('');
    onSubmit(questions);
  };

  const loadSample = () => {
    setText(SAMPLE);
    setError('');
  };

  const count = text.trim() ? parseQuestions(text).length : 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl animate-fade-in-up">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tight mb-3">
            <span className="text-gradient-primary">MockDesk</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Paste your questions below to get started
          </p>
        </div>

        <div className="card-3d-elevated p-8">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Questions
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono text-primary font-semibold">
                {count} Parsed
              </span>
              <button
                onClick={loadSample}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Load Sample
              </button>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setError(''); }}
            placeholder={`Paste questions in this format:\n\nQuestion line\nAnswer line\n\n(blank line between pairs)`}
            className="w-full h-72 bg-muted/50 border border-border rounded-lg p-4 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50 transition-all"
          />

          {error && (
            <p className="text-destructive text-sm mt-3 font-medium">{error}</p>
          )}

          

<button
  onClick={handleSubmit}
  disabled={count < 2}
  className="mt-6 w-full py-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-green-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
>
  Continue to Setup →
</button>
        </div>
      </div>
    </div>
  );
}
