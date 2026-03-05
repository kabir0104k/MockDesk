import { RawQuestion, Question, TestMode } from '@/types/test';

export function parseQuestions(text: string): RawQuestion[] {
  const lines = text.trim().split('\n');
  const questions: RawQuestion[] = [];
  let i = 0;
  while (i < lines.length) {
    const q = lines[i]?.trim();
    const a = lines[i + 1]?.trim();
    if (q && a) {
      questions.push({ question: q, answer: a });
      i += 2;
    } else {
      i++;
    }
    // skip blank lines
    while (i < lines.length && lines[i]?.trim() === '') i++;
  }
  return questions;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateMCQOptions(
  correctAnswer: string,
  allAnswers: string[],
  count: number = 4
): string[] {
  const distractors = allAnswers.filter(
    (a) => a.toLowerCase() !== correctAnswer.toLowerCase()
  );
  const shuffled = shuffleArray(distractors);
  const selected = shuffled.slice(0, count - 1);
  const options = shuffleArray([correctAnswer, ...selected]);
  return options;
}

export function prepareQuestions(
  raw: RawQuestion[],
  mode: TestMode,
  order: 'sequential' | 'random'
): Question[] {
  let ordered = raw.map((r, i) => ({ ...r, id: i }));
  if (order === 'random') ordered = shuffleArray(ordered);

  const allAnswers = raw.map((r) => r.answer);

  return ordered.map((q) => ({
    id: q.id,
    question: q.question,
    answer: q.answer,
    options: mode === 'mcq' ? generateMCQOptions(q.answer, allAnswers) : undefined,
  }));
}

export function calculateScore(
  questions: Question[],
  answers: Record<number, string>,
  negativeMarking: number
): {
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
  accuracy: number;
} {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;

  questions.forEach((q) => {
    const userAns = answers[q.id];
    if (!userAns || userAns.trim() === '') {
      unanswered++;
    } else if (userAns.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
      correct++;
    } else {
      wrong++;
    }
  });

  const score = correct - wrong * negativeMarking;
  const accuracy = correct + wrong > 0 ? (correct / (correct + wrong)) * 100 : 0;

  return { correct, wrong, unanswered, score, accuracy };
}

export function calculateMaxStreak(
  questions: Question[],
  answers: Record<number, string>
): number {
  let max = 0;
  let current = 0;
  questions.forEach((q) => {
    const userAns = answers[q.id];
    if (userAns && userAns.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  });
  return max;
}

export function getSimulatedPercentile(accuracy: number): number {
  if (accuracy >= 95) return 99;
  if (accuracy >= 90) return 95;
  if (accuracy >= 80) return 88;
  if (accuracy >= 70) return 75;
  if (accuracy >= 60) return 60;
  if (accuracy >= 50) return 45;
  if (accuracy >= 40) return 30;
  return 15;
}

export function getSimulatedRank(percentile: number, totalStudents: number = 10000): number {
  return Math.max(1, Math.round(totalStudents * (1 - percentile / 100)));
}

export function getPaletteStatus(
  qId: number,
  answers: Record<number, string>,
  marked: Record<number, boolean>,
  visited: Record<number, boolean>
): string {
  const isAnswered = answers[qId] && answers[qId].trim() !== '';
  const isMarked = marked[qId];
  const isVisited = visited[qId];

  if (isAnswered && isMarked) return 'answered-review';
  if (isMarked) return 'review';
  if (isAnswered) return 'answered';
  if (isVisited) return 'not-answered';
  return 'not-visited';
}

// localStorage helpers
const HISTORY_KEY = 'cbt_attempt_history';
const MISTAKES_KEY = 'cbt_mistake_journal';

export function saveAttempt(record: import('@/types/test').AttemptRecord) {
  const history = getAttemptHistory();
  history.unshift(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

export function getAttemptHistory(): import('@/types/test').AttemptRecord[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveMistakes(questions: Question[], answers: Record<number, string>) {
  const existing: Record<string, number> = getMistakes();
  questions.forEach((q) => {
    const userAns = answers[q.id];
    if (userAns && userAns.trim().toLowerCase() !== q.answer.trim().toLowerCase()) {
      const key = q.question;
      existing[key] = (existing[key] || 0) + 1;
    }
  });
  localStorage.setItem(MISTAKES_KEY, JSON.stringify(existing));
}

export function getMistakes(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(MISTAKES_KEY) || '{}');
  } catch {
    return {};
  }
}

export function getTopMistakes(count: number = 10): { question: string; count: number }[] {
  const mistakes = getMistakes();
  return Object.entries(mistakes)
    .map(([question, c]) => ({ question, count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, count);
}
