export interface RawQuestion {
  question: string;
  answer: string;
}

export interface Question {
  id: number;
  question: string;
  answer: string;
  options?: string[];
}

export type TestMode = 'mcq' | 'fill' | 'study';
export type TestOrder = 'sequential' | 'random';
export type Phase = 'input' | 'config' | 'test' | 'summary' | 'results';

export type PaletteStatus =
  | 'not-visited'
  | 'not-answered'
  | 'answered'
  | 'review'
  | 'answered-review';

export interface TestConfig {
  mode: TestMode;
  order: TestOrder;
  timerMinutes: number;
  negativeMarking: number;
  instantFeedback: boolean;
  autoNext: boolean;
  speedMode: boolean;
  strictFullscreen: boolean;
}

export interface QuestionResult {
  questionId: number;
  userAnswer: string;
  correct: boolean;
  timeSpent: number; // ms
}

export interface AttemptRecord {
  id: string;
  date: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
  accuracy: number;
  mode: TestMode;
}

export interface TestState {
  phase: Phase;
  rawQuestions: RawQuestion[];
  questions: Question[];
  config: TestConfig;
  currentIndex: number;
  answers: Record<number, string>;
  marked: Record<number, boolean>;
  visited: Record<number, boolean>;
  questionStartTime: number;
  questionTimes: Record<number, number>;
  results: QuestionResult[];
  timeRemaining: number;
  tabSwitchCount: number;
  currentStreak: number;
  maxStreak: number;
  feedbackShown: number | null; // question id showing feedback for
}

export const DEFAULT_CONFIG: TestConfig = {
  mode: 'mcq',
  order: 'sequential',
  timerMinutes: 30,
  negativeMarking: 0,
  instantFeedback: false,
  autoNext: false,
  speedMode: false,
  strictFullscreen: false,
};
