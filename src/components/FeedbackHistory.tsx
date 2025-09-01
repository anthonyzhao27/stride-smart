'use client';

import { useState, useEffect } from 'react';
import { Clock, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

interface FeedbackHistoryItem {
  id: string;
  timestamp: string;
  message: string;
  status: 'success' | 'error' | 'pending';
  warnings?: string[];
  changes?: string[];
}

interface FeedbackHistoryProps {
  planId?: string;
  userId?: string;
  className?: string;
}

export default function FeedbackHistory({ planId, userId, className = '' }: FeedbackHistoryProps) {
  const [history, setHistory] = useState<FeedbackHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement actual API call to fetch feedback history
    // For now, using mock data
    const mockHistory: FeedbackHistoryItem[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        message: 'Move my long run from Sunday to Saturday',
        status: 'success',
        warnings: ['Consider that this may affect your recovery for the next week'],
        changes: ['Moved Long Run from 2024-01-14 to 2024-01-13']
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        message: 'Reduce the intensity of my Tuesday workout',
        status: 'success',
        changes: ['Reduced LT2 workout intensity to LT1']
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        message: 'Add an extra rest day this week',
        status: 'error',
        warnings: ['No rest days available in current week structure']
      }
    ];

    setHistory(mockHistory);
    setLoading(false);
  }, [planId, userId]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      default:
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white border border-gray-200 rounded-2xl shadow-sm dark:border-gray-700 dark:bg-gray-900 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feedback History</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg dark:bg-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white border border-gray-200 rounded-2xl shadow-sm dark:border-gray-700 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Feedback History</h3>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No feedback history yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Start by providing feedback on your training plan!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg ${getStatusColor(item.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.message}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(item.timestamp)}
                </span>
              </div>

              {item.changes && item.changes.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Changes made:
                  </h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {item.changes.map((change, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {item.warnings && item.warnings.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                    Warnings:
                  </h4>
                  <ul className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                    {item.warnings.map((warning, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-yellow-400 rounded-full"></span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
