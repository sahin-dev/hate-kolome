import { useState } from 'react';
import type { QuizQuestion } from '../core/types';
import { bn } from '../core/util';

interface Props {
  questions: QuizQuestion[];
  best?: number;
  onFinish: (score: number) => void;
}

export function Quiz({ questions, best, onFinish }: Props) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const answered = Object.keys(picked).length;
  const correct = questions.filter((q, i) => picked[i] === q.answer).length;
  const done = answered === questions.length;

  const choose = (qi: number, option: number) => {
    if (picked[qi] !== undefined) return;
    const next = { ...picked, [qi]: option };
    setPicked(next);
    if (Object.keys(next).length === questions.length) {
      const right = questions.filter((q, i) => next[i] === q.answer).length;
      onFinish(right / questions.length);
    }
  };

  return (
    <section className="quiz" aria-label="নিজেকে যাচাই করো">
      <div className="quiz-head">
        <h3>নিজেকে যাচাই করো</h3>
        {best !== undefined && <span className="chip">সেরা ফল {bn(Math.round(best * 100))}%</span>}
      </div>
      {questions.map((q, qi) => {
        const choice = picked[qi];
        return (
          <fieldset key={qi} className="quiz-q">
            <legend>
              {bn(qi + 1)}. {q.q}
            </legend>
            <div className="quiz-options">
              {q.options.map((opt, oi) => {
                let cls = 'quiz-option';
                if (choice !== undefined) {
                  if (oi === q.answer) cls += ' right';
                  else if (oi === choice) cls += ' wrong';
                }
                return (
                  <button key={oi} type="button" className={cls} disabled={choice !== undefined} onClick={() => choose(qi, oi)}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {choice !== undefined && (
              <p className="quiz-why">
                {choice === q.answer ? 'ঠিক! ' : 'হয়নি। '}
                {q.why}
              </p>
            )}
          </fieldset>
        );
      })}
      {done && (
        <div className="quiz-result" role="status">
          <strong>
            {bn(questions.length)}টির মধ্যে {bn(correct)}টি সঠিক
          </strong>
          <button type="button" className="btn btn-ghost" onClick={() => setPicked({})}>
            আবার চেষ্টা করো
          </button>
        </div>
      )}
    </section>
  );
}
