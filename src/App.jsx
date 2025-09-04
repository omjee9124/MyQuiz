import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * React Quiz App — Placement-Ready
 * ---------------------------------------------------------
 * - Functional components + hooks (useState, useEffect)
 * - Clean, responsive UI with Tailwind
 * - Single-question flow with 4 options
 * - Score tracking + results breakdown
 * - Restart flow, progress bar, optional timer
 * - Local JSON (inline) or Open Trivia DB API
 * - Accessibility: keyboard navigation, ARIA labels
 * - Persisted High scores via localStorage
 * ---------------------------------------------------------
 * How to use in a Vite React app:
 * 1) Create:  npm create vite@latest quiz-app -- --template react
 * 2) cd quiz-app && npm i && npm i framer-motion
 * 3) Replace src/App.jsx with this file's content.
 * 4) Start: npm run dev
 */

// ------- Local questions as fallback (Option B: Local JSON) -------
const LOCAL_QUESTIONS = [
  {
    id: 1,
    question: "What does CSS stand for?",
    correctAnswer: "Cascading Style Sheets",
    options: [
      "Cascading Style Sheets",
      "Computer Style Sheets",
      "Creative Style System",
      "Colorful Style Syntax",
    ],
    difficulty: "easy",
    category: "Frontend",
  },
  {
    id: 2,
    question: "Which HTML element is used to include JavaScript?",
    correctAnswer: "<script>",
    options: ["<js>", "<javascript>", "<script>", "<code>"],
    difficulty: "easy",
    category: "Frontend",
  },
  {
    id: 3,
    question:
      "In React, which hook is used to manage local component state?",
    correctAnswer: "useState",
    options: ["useProps", "useState", "useMemo", "useRef"],
    difficulty: "easy",
    category: "React",
  },
  {
    id: 4,
    question: "Which HTTP status code indicates 'Not Found'?",
    correctAnswer: "404",
    options: ["200", "301", "404", "500"],
    difficulty: "easy",
    category: "Web",
  },
  {
    id: 5,
    question: "Which of the following is NOT a JavaScript primitive?",
    correctAnswer: "Array",
    options: ["String", "Boolean", "Array", "Number"],
    difficulty: "medium",
    category: "JavaScript",
  },
  {
    id: 6,
    question: "What is the output type of Array.prototype.map()?",
    correctAnswer: "A new array",
    options: [
      "A mutated original array",
      "A NodeList",
      "A new array",
      "An iterator only",
    ],
    difficulty: "medium",
    category: "JavaScript",
  },
  {
    id: 7,
    question: "Which tag improves accessibility by indicating main content?",
    correctAnswer: "<main>",
    options: ["<primary>", "<main>", "<body>", "<content>"],
    difficulty: "medium",
    category: "HTML",
  },
  {
    id: 8,
    question: "Which React prop passes content between opening/closing tags?",
    correctAnswer: "children",
    options: ["slot", "content", "children", "innerHTML"],
    difficulty: "medium",
    category: "React",
  },
  {
    id: 9,
    question: "Which CSS property creates a stacking context?",
    correctAnswer: "z-index",
    options: ["position", "z-index", "display", "float"],
    difficulty: "hard",
    category: "CSS",
  },
  {
    id: 10,
    question: "Which API prevents XSS by setting HTTP headers?",
    correctAnswer: "Content-Security-Policy",
    options: [
      "Cross-Origin Resource Sharing",
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "Referrer-Policy",
    ],
    difficulty: "hard",
    category: "Security",
  },
];

// Utility: shuffle an array
const shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);

function normalizeOTDB(results) {
  return results.map((item, idx) => {
    const decoded = (s) =>
      // decode common HTML entities from API
      s
        .replaceAll("&quot;", '"')
        .replaceAll("&#039;", "'")
        .replaceAll("&amp;", "&")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">");

    const options = shuffle([
      ...item.incorrect_answers.map(decoded),
      decoded(item.correct_answer),
    ]);

    return {
      id: idx + 1,
      question: decoded(item.question),
      correctAnswer: decoded(item.correct_answer),
      options,
      difficulty: item.difficulty,
      category: item.category,
    };
  });
}

async function fetchOpenTrivia(amount = 10, difficulty = "easy") {
  const url = `https://opentdb.com/api.php?amount=${amount}&type=multiple&difficulty=${difficulty}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch questions");
  const data = await res.json();
  if (data.response_code !== 0) throw new Error("No questions returned");
  return normalizeOTDB(data.results);
}

function useHighScores(key = "quiz_high_scores") {
  const [scores, setScores] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  });

  const addScore = (entry) => {
    const next = [...scores, entry].sort((a, b) => b.percent - a.percent).slice(0, 10);
    setScores(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const reset = () => {
    setScores([]);
    localStorage.removeItem(key);
  };

  return { scores, addScore, reset };
}

function Header({ onReset }) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-white/70 dark:bg-neutral-900/70 border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-neutral-900 dark:bg-white" aria-hidden />
          <h1 className="text-xl font-semibold">My Quiz</h1>
        </div>
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-sm"
        >
          Restart
        </button>
      </div>
    </header>
  );
}

function ProgressBar({ current, total }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span>
          Question {current + 1} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-2 bg-neutral-900 dark:bg-white transition-all"
          style={{ width: `${pct}%` }}
          aria-valuemin={0}
          aria-valuenow={pct}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>
    </div>
  );
}

function Timer({ seconds, running, onElapsed, keySeed }) {
  const [time, setTime] = useState(seconds);
  const ref = useRef(null);

  useEffect(() => {
    setTime(seconds);
  }, [seconds, keySeed]);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(ref.current);
          onElapsed?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running, onElapsed]);

  const pct = Math.round((time / seconds) * 100);

  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <div className="text-sm tabular-nums w-12 text-right">{time}s</div>
      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden" title={`${time}s left`}>
        <div className="h-2 bg-neutral-900 dark:bg-white" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QuestionCard({
  q,
  index,
  total,
  selected,
  onSelect,
  locked,
}) {
  // Keyboard support: arrow keys to move, Enter to confirm happens in parent
  return (
    <motion.div
      key={q.id + String(index)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <ProgressBar current={index} total={total} />

      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-neutral-500">
          {q.category} • {q.difficulty}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold leading-snug">{q.question}</h2>
      </div>

      <fieldset className="grid gap-3" aria-label="Answer choices">
        {q.options.map((opt, i) => {
          const id = `q${q.id}_opt${i}`;
          const isSel = selected === opt;
          return (
            <label
              htmlFor={id}
              key={id}
              className={`border rounded-2xl px-4 py-3 cursor-pointer transition shadow-sm focus-within:ring-2 focus-within:ring-neutral-400 outline-none ${
                isSel
                  ? "border-neutral-900 bg-neutral-50 dark:bg-neutral-800"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700"
              } ${locked ? "opacity-70 pointer-events-none" : ""}`}
            >
              <input
                type="radio"
                id={id}
                name={`q_${q.id}`}
                className="sr-only"
                checked={isSel}
                onChange={() => onSelect(opt)}
                disabled={locked}
                aria-checked={isSel}
                aria-label={opt}
              />
              <div className="flex items-center gap-3">
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                    isSel
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300"
                  }`}
                >
                  {isSel ? "✓" : ""}
                </span>
                <span className="text-sm sm:text-base">{opt}</span>
              </div>
            </label>
          );
        })}
      </fieldset>
    </motion.div>
  );
}

function Controls({
  canPrev,
  canNext,
  onPrev,
  onNext,
  onFinish,
  isLast,
  disabled,
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 disabled:opacity-40"
      >
        Previous
      </button>

      {!isLast ? (
        <button
          onClick={onNext}
          disabled={!canNext || disabled}
          className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black disabled:opacity-40"
        >
          Next
        </button>
      ) : (
        <button
          onClick={onFinish}
          disabled={!canNext || disabled}
          className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black disabled:opacity-40"
        >
          Submit
        </button>
      )}
    </div>
  );
}

function ResultsView({ summary, onRestart, meta, highScores, onClearScores }) {
  const { correctCount, total } = meta;
  const percent = Math.round((correctCount / total) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Results</h2>
        <p className="text-neutral-600">
          You scored <span className="font-semibold">{correctCount}/{total}</span> ({percent}%).
        </p>
        <button
          onClick={onRestart}
          className="mt-2 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black"
        >
          Restart Quiz
        </button>
      </div>

      <div className="border rounded-2xl p-4 bg-neutral-50 dark:bg-neutral-900/40">
        <h3 className="font-semibold mb-3">Answer Breakdown</h3>
        <ul className="space-y-3">
          {summary.map((row, i) => (
            <li key={i} className="border rounded-xl p-3 bg-white dark:bg-neutral-900">
              <div className="text-sm text-neutral-500 mb-1">
                {row.category} • {row.difficulty}
              </div>
              <div className="font-medium mb-2">{row.question}</div>
              <div className="text-sm flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded-lg ${
                  row.correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {row.correct ? "Correct" : "Incorrect"}
                </span>
                <span className="px-2 py-1 rounded-lg bg-neutral-100">Your answer: {row.selected ?? "—"}</span>
                {!row.correct && (
                  <span className="px-2 py-1 rounded-lg bg-neutral-100">Correct: {row.correctAnswer}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">High Scores (local)</h3>
          <button onClick={onClearScores} className="text-sm underline">Clear</button>
        </div>
        {highScores.length === 0 ? (
          <p className="text-sm text-neutral-600">No high scores yet. Finish a quiz to add one!</p>
        ) : (
          <ol className="grid gap-2 list-decimal list-inside">
            {highScores.map((s, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="tabular-nums">{s.correct}/{s.total} ({s.percent}%)</span>
                <span className="text-neutral-500">{new Date(s.date).toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </motion.div>
  );
}

export default function App() {
  // App-level state
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selections, setSelections] = useState({}); // id -> selected option
  const [locked, setLocked] = useState(false); // when timer elapses
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("idle"); // idle | quiz | results

  // settings
  const [useAPI, setUseAPI] = useState(false);
  const [amount, setAmount] = useState(10);
  const [difficulty, setDifficulty] = useState("easy");
  const [timerOn, setTimerOn] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(30);

  const { scores, addScore, reset: resetScores } = useHighScores();

  const total = questions.length;
  const currentQ = questions[current];
  const selected = currentQ ? selections[currentQ.id] : undefined;

  // Derived analytics
  const summary = useMemo(() => {
    return questions.map((q) => {
      const sel = selections[q.id];
      return {
        id: q.id,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        selected: sel ?? null,
        correctAnswer: q.correctAnswer,
        correct: sel === q.correctAnswer,
      };
    });
  }, [questions, selections]);

  const correctCount = useMemo(
    () => summary.filter((r) => r.correct).length,
    [summary]
  );

  // Fetch or load questions
  const loadQuestions = async () => {
    setError("");
    setLoading(true);
    setSelections({});
    setLocked(false);
    setCurrent(0);
    try {
      const data = useAPI
        ? await fetchOpenTrivia(amount, difficulty)
        : shuffle(LOCAL_QUESTIONS)
            .filter((q) => (difficulty === "any" ? true : q.difficulty === difficulty))
            .slice(0, amount);
      // Ensure 4 options always
      const normalized = data.map((q, idx) => ({
        ...q,
        id: idx + 1,
        options: q.options.length === 4 ? q.options : shuffle([...q.options]).slice(0, 4),
      }));
      setQuestions(normalized);
      setMode("quiz");
    } catch (e) {
      setError(e.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (opt) => {
    if (!currentQ || locked) return;
    setSelections((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  const next = () => {
    if (current < total - 1) {
      setCurrent((c) => c + 1);
      setLocked(false);
    }
  };
  const prev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const finish = () => {
    setMode("results");
    addScore({
      name: "Attempt",
      correct: correctCount,
      total,
      percent: Math.round((correctCount / (total || 1)) * 100),
      date: Date.now(),
    });
  };

  // Timer auto-lock behavior
  // Timer auto-lock behavior
// Timer auto-lock behavior
const onElapsed = () => {
  if (!currentQ) return;

  if (!selected) {
    // if no answer selected, mark as incorrect automatically
    setSelections((prev) => ({ ...prev, [currentQ.id]: null }));
  }

  if (current < total - 1) {
    setCurrent((c) => c + 1);
    setLocked(false); // reset lock for next question
  } else {
    finish();
  }
};

  const canNext = !!selected; // prevent progressing without a selection (unless Skip added)

  const restartAll = () => {
    setMode("idle");
    setQuestions([]);
    setSelections({});
    setCurrent(0);
    setLocked(false);
    setLoading(false);
    setError("");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
      <Header onReset={restartAll} />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Setup / Idle Screen */}
        {mode === "idle" && (
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Know your Potential</h2>
              <p className="text-neutral-600">
                Choose source, difficulty and number of questions. Then start your quiz!
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border rounded-2xl p-4">
                <h3 className="font-semibold mb-3">Data Source</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setUseAPI(false)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      !useAPI
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300"
                    }`}
                    aria-pressed={!useAPI}
                  >
                    Local JSON
                  </button>
                  <button
                    onClick={() => setUseAPI(true)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      useAPI
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300"
                    }`}
                    aria-pressed={useAPI}
                  >
                    Open Trivia DB
                  </button>
                </div>
                {useAPI && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Handles loading & error states. Works offline? Switch back to Local JSON.
                  </p>
                )}
              </div>

              <div className="border rounded-2xl p-4 grid gap-3">
                <div>
                  <label className="text-sm font-medium">Difficulty</label>
                  <select
                    className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="any">Any (local only)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Questions</label>
                  <input
                    type="number"
                    min={5}
                    max={10}
                    value={amount}
                    onChange={(e) => setAmount(Math.max(5, Math.min(10, Number(e.target.value) || 10)))}
                    className="mt-1 w-full border rounded-xl px-3 py-2 bg-white dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div className="border rounded-2xl p-4 grid gap-3 sm:col-span-2">
                <div className="flex items-center gap-3">
                  <input
                    id="timer"
                    type="checkbox"
                    checked={timerOn}
                    onChange={(e) => setTimerOn(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="timer" className="font-medium">30s Timer Per Question</label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm">Seconds</label>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={5}
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-10 text-right tabular-nums">{timerSeconds}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={loadQuestions}
                disabled={loading}
                className="px-5 py-2.5 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-black"
              >
                {loading ? "Loading..." : "Start Quiz"}
              </button>
              {error && <span className="text-red-600 self-center">{error}</span>}
            </div>

            {scores.length > 0 && (
              <div className="border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">High Scores</h3>
                  <button onClick={resetScores} className="text-sm underline">Clear</button>
                </div>
                <ol className="grid gap-1 list-decimal list-inside text-sm">
                  {scores.map((s, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="font-medium">{s.name}</span>
                      <span className="tabular-nums">{s.correct}/{s.total} ({s.percent}%)</span>
                      <span className="text-neutral-500">{new Date(s.date).toLocaleString()}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {/* Quiz Screen */}
        {mode === "quiz" && currentQ && (
          <section className="space-y-4">
            {timerOn && (
              <Timer
                seconds={timerSeconds}
                running={!locked}
                onElapsed={onElapsed}
                keySeed={currentQ.id}
              />
            )}

            <AnimatePresence mode="wait">
              <QuestionCard
                key={currentQ.id}
                q={currentQ}
                index={current}
                total={total}
                selected={selected}
                onSelect={handleSelect}
                locked={locked}
              />
            </AnimatePresence>

            <Controls
              canPrev={current > 0}
              canNext={!!selected}
              onPrev={prev}
              onNext={next}
              onFinish={finish}
              isLast={current === total - 1}
              disabled={locked}
            />
          </section>
        )}

        {/* Results Screen */}
        {mode === "results" && (
          <ResultsView
            summary={summary}
            meta={{ correctCount, total }}
            onRestart={restartAll}
            highScores={scores}
            onClearScores={resetScores}
          />
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-4 pb-10 pt-4 text-xs text-neutral-500">
        Built By <b>Om Ji Dubey</b> with React Hooks • Tailwind • Framer Motion • LocalStorage
      </footer>
    </div>
  );
}
