'use client';

import { MessageSquare, Lightbulb, ArrowRight } from 'lucide-react';
import FeedbackButton from './FeedbackButton';

interface FeedbackCardProps {
  planId?: string;
  userId?: string;
  className?: string;
}

export default function FeedbackCard({ planId, userId, className = '' }: FeedbackCardProps) {
  return (
    <div className={`p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-sm dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
              <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Plan Feedback
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Not happy with your current training plan? Let us know how we can improve it! 
            Use natural language to describe the changes you&apos;d like to make.
          </p>

          <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
            <p className="flex items-center gap-1">
              <span className="w-1 h-1 bg-green-400 rounded-full"></span>
              &quot;Move my long run from Sunday to Saturday&quot;
            </p>
            <p className="flex items-center gap-1">
              <span className="w-1 h-1 bg-green-400 rounded-full"></span>
              &quot;Reduce the intensity of my Tuesday workout&quot;
            </p>
            <p className="flex items-center gap-1">
              <span className="w-1 h-1 bg-green-400 rounded-full"></span>
              &quot;Add an extra rest day this week&quot;
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <FeedbackButton
          planId={planId}
          userId={userId}
          variant="card"
          className="group"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Provide Feedback</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </FeedbackButton>
      </div>
    </div>
  );
}
