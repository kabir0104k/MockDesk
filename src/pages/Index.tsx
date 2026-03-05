import { useState, useEffect, useCallback, useRef } from 'react';
import { RawQuestion, TestConfig, TestState, DEFAULT_CONFIG, Phase } from '@/types/test';
import { prepareQuestions, calculateScore, saveAttempt, saveMistakes, calculateMaxStreak } from '@/lib/testEngine';
import QuestionInput from '@/components/test/QuestionInput';
import TestConfigPanel from '@/components/test/TestConfigPanel';
import TestScreen from '@/components/test/TestScreen';
import SummaryModal from '@/components/test/SummaryModal';
import ResultsDashboard from '@/components/test/ResultsDashboard';

const Index = () => {
  const [isDark, setIsDark] = useState(true);

  // Central state
  const [phase, setPhase] = useState<Phase>('input');
  const [rawQuestions, setRawQuestions] = useState<RawQuestion[]>([]);
  const [state, setState] = useState<TestState>({
    phase: 'input',
    rawQuestions: [],
    questions: [],
    config: DEFAULT_CONFIG,
    currentIndex: 0,
    answers: {},
    marked: {},
    visited: {},
    questionStartTime: Date.now(),
    questionTimes: {},
    results: [],
    timeRemaining: 0,
    tabSwitchCount: 0,
    currentStreak: 0,
    maxStreak: 0,
    feedbackShown: null,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Initialize dark mode on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Timer
  useEffect(() => {
    if (phase === 'test') {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.timeRemaining <= 1) {
            // Auto submit
            clearInterval(timerRef.current!);
            submitTest(prev);
            return prev;
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Strict fullscreen detection
  useEffect(() => {
    if (phase !== 'test' || !state.config.strictFullscreen) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setState((p) => {
          const count = p.tabSwitchCount + 1;
          if (count >= 3) {
            submitTest(p);
          }
          return { ...p, tabSwitchCount: count };
        });
      }
    };

    const handleBlur = () => {
      setState((p) => ({ ...p, tabSwitchCount: p.tabSwitchCount + 1 }));
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [phase, state.config.strictFullscreen]);

  const handleQuestionsSubmit = (questions: RawQuestion[]) => {
    setRawQuestions(questions);
    setPhase('config');
  };

  const handleStartTest = (config: TestConfig) => {
    const questions = prepareQuestions(rawQuestions, config.mode, config.order);
    setState({
      phase: 'test',
      rawQuestions,
      questions,
      config,
      currentIndex: 0,
      answers: {},
      marked: {},
      visited: { [questions[0]?.id]: true },
      questionStartTime: Date.now(),
      questionTimes: {},
      results: [],
      timeRemaining: config.timerMinutes * 60,
      tabSwitchCount: 0,
      currentStreak: 0,
      maxStreak: 0,
      feedbackShown: null,
    });
    setPhase('test');

    if (config.strictFullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleAnswer = useCallback((qId: number, answer: string) => {
    setState((prev) => {
      const newAnswers = { ...prev.answers, [qId]: answer };
      const q = prev.questions.find((x) => x.id === qId);
      const isCorrect = q && answer.trim().toLowerCase() === q.answer.trim().toLowerCase();
      
      let newStreak = isCorrect ? prev.currentStreak + 1 : 0;
      let newMaxStreak = Math.max(prev.maxStreak, newStreak);

      const newState: TestState = {
        ...prev,
        answers: newAnswers,
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
      };

      // Instant feedback
      if (prev.config.instantFeedback && prev.config.mode !== 'study') {
        newState.feedbackShown = qId;
      }

      return newState;
    });

    // Auto-next after feedback
    if (state.config.autoNext && !state.config.instantFeedback) {
      setTimeout(() => {
        handleNavigate(state.currentIndex + 1);
      }, 300);
    }
  }, [state.config, state.currentIndex]);

  const handleNavigate = useCallback((index: number) => {
    setState((prev) => {
      if (index < 0 || index >= prev.questions.length) return prev;
      // Track time on current question
      const elapsed = Date.now() - prev.questionStartTime;
      const prevQId = prev.questions[prev.currentIndex].id;
      const newTimes = {
        ...prev.questionTimes,
        [prevQId]: (prev.questionTimes[prevQId] || 0) + elapsed,
      };
      return {
        ...prev,
        currentIndex: index,
        questionStartTime: Date.now(),
        questionTimes: newTimes,
        visited: { ...prev.visited, [prev.questions[index].id]: true },
        feedbackShown: null,
      };
    });
  }, []);

  const handleMark = useCallback((qId: number) => {
    setState((prev) => ({
      ...prev,
      marked: { ...prev.marked, [qId]: !prev.marked[qId] },
    }));
  }, []);

  const handleClearAnswer = useCallback((qId: number) => {
    setState((prev) => {
      const newAnswers = { ...prev.answers };
      delete newAnswers[qId];
      return { ...prev, answers: newAnswers };
    });
  }, []);

  const handleShowSummary = () => {
    // Record time for current question
    setState((prev) => {
      const elapsed = Date.now() - prev.questionStartTime;
      const qId = prev.questions[prev.currentIndex].id;
      return {
        ...prev,
        questionTimes: {
          ...prev.questionTimes,
          [qId]: (prev.questionTimes[qId] || 0) + elapsed,
        },
        questionStartTime: Date.now(),
      };
    });
    setPhase('summary');
  };

  const submitTest = useCallback((st?: TestState) => {
    const s = st || state;
    if (timerRef.current) clearInterval(timerRef.current);

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Save attempt
    const { correct, wrong, unanswered, score, accuracy } = calculateScore(
      s.questions, s.answers, s.config.negativeMarking
    );
    saveAttempt({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      totalQuestions: s.questions.length,
      correct,
      wrong,
      unanswered,
      score,
      accuracy,
      mode: s.config.mode,
    });
    saveMistakes(s.questions, s.answers);

    setPhase('results');
  }, [state]);

  const handleRestart = () => {
    setPhase('input');
    setRawQuestions([]);
    setState((prev) => ({
      ...prev,
      phase: 'input',
      questions: [],
      currentIndex: 0,
      answers: {},
      marked: {},
      visited: {},
      questionTimes: {},
      timeRemaining: 0,
      tabSwitchCount: 0,
      feedbackShown: null,
    }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Theme Toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed top-4 right-4 z-[200] w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-lg hover:bg-muted transition-colors"
        title="Toggle theme"
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      {phase === 'input' && (
        <QuestionInput onSubmit={handleQuestionsSubmit} />
      )}

      {phase === 'config' && (
        <TestConfigPanel
          totalQuestions={rawQuestions.length}
          onStart={handleStartTest}
          onBack={() => setPhase('input')}
        />
      )}

      {phase === 'test' && (
        <TestScreen
          questions={state.questions}
          config={state.config}
          currentIndex={state.currentIndex}
          answers={state.answers}
          marked={state.marked}
          visited={state.visited}
          timeRemaining={state.timeRemaining}
          feedbackShown={state.feedbackShown}
          onAnswer={handleAnswer}
          onNavigate={handleNavigate}
          onMark={handleMark}
          onClearAnswer={handleClearAnswer}
          onSubmit={handleShowSummary}
          tabSwitchCount={state.tabSwitchCount}
        />
      )}

      {phase === 'summary' && (
        <SummaryModal
          questions={state.questions}
          answers={state.answers}
          marked={state.marked}
          visited={state.visited}
          onConfirm={() => submitTest()}
          onCancel={() => setPhase('test')}
        />
      )}

      {phase === 'results' && (
        <ResultsDashboard
          questions={state.questions}
          answers={state.answers}
          questionTimes={state.questionTimes}
          config={state.config}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default Index;
