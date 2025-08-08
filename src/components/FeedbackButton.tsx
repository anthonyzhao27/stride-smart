'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

interface FeedbackButtonProps {
  planId?: string;
  userId?: string;
  variant?: 'floating' | 'inline' | 'card';
  className?: string;
  children?: React.ReactNode;
}

export default function FeedbackButton({ 
  planId, 
  userId, 
  variant = 'floating',
  className = '',
  children 
}: FeedbackButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const baseClasses = {
    floating: "fixed z-50 flex items-center justify-center w-16 h-16 text-white transition-all duration-300 transform rounded-full shadow-lg bottom-6 right-6 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105 focus:outline-none ring-2 ring-green-300 dark:ring-green-700",
    inline: "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors",
    card: "flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 dark:text-green-300 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/30 transition-colors"
  };

  const buttonClasses = `${baseClasses[variant]} ${className}`;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={buttonClasses}
        aria-label="Provide plan feedback"
      >
        {children || (
          <>
            <MessageSquare className="w-4 h-4" />
            {variant !== 'floating' && <span>Feedback</span>}
          </>
        )}
      </button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planId={planId}
        userId={userId}
      />
    </>
  );
}
