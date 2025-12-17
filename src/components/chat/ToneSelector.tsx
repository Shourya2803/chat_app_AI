'use client';

import { useUIStore, ToneType } from '@/store/uiStore';
import { Briefcase, Heart, GraduationCap } from 'lucide-react';

const toneOptions: { value: ToneType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'professional',
    label: 'Professional',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Business-appropriate language',
  },
  {
    value: 'polite',
    label: 'Polite',
    icon: <Heart className="w-5 h-5" />,
    description: 'Courteous and respectful',
  },
  {
    value: 'formal',
    label: 'Formal',
    icon: <GraduationCap className="w-5 h-5" />,
    description: 'Sophisticated and proper',
  },
];

export default function ToneSelector() {
  const { selectedTone, setSelectedTone } = useUIStore();

  return (
    <div
      className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
    >
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Select AI Tone:
      </p>
      <div className="grid grid-cols-3 gap-2">
        {toneOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedTone(option.value)}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedTone === option.value
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
            }`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div
                className={`${
                  selectedTone === option.value
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {option.icon}
              </div>
              <div>
                <p
                  className={`font-semibold text-sm ${
                    selectedTone === option.value
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {option.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

