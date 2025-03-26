import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

interface TestProgressProps {
  totalQuestions: number;
  answeredQuestions: number;
  currentSection: number;
  totalSections: number;
}

export const TestProgress: React.FC<TestProgressProps> = ({
  totalQuestions,
  answeredQuestions,
  currentSection,
  totalSections,
}) => {
  const progress = (answeredQuestions / totalQuestions) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Section {currentSection} of {totalSections}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {answeredQuestions} of {totalQuestions} questions answered
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700">
        <div
          className="h-2 bg-primary-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-4">
        {Array.from({ length: totalSections }).map((_, index) => (
          <div
            key={index}
            className="flex items-center space-x-1"
          >
            {index < currentSection ? (
              <CheckCircle className="w-5 h-5 text-primary-600" />
            ) : (
              <Circle className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Section {index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};