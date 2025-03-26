import React, { useState, useEffect } from 'react';
import { saveTestState } from '../../utils/storage';

interface QuestionProps {
  id: string;
  content: string;
  options: string[];
  onAnswer: (questionId: string, answer: string) => void;
  testId: string;
  sectionId: string;
}

export const Question: React.FC<QuestionProps> = ({
  id,
  content,
  options,
  onAnswer,
  testId,
  sectionId,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  useEffect(() => {
    // Save question state whenever answer changes
    if (selectedAnswer) {
      saveTestState({
        testId,
        sectionId,
        questionId: id,
        answer: selectedAnswer,
        timestamp: Date.now(),
      });
    }
  }, [selectedAnswer, id, testId, sectionId]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    onAnswer(id, answer);
  };

  return (
    <div className="space-y-4">
      <div className="text-lg font-medium text-gray-900 dark:text-white">
        {content}
      </div>
      <div className="space-y-2">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(option)}
            className={`w-full p-4 text-left rounded-lg border ${
              selectedAnswer === option
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-gray-900 dark:text-white">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
};