'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { TrainingWeek } from '@/lib/types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: string;
  userId?: string;
}

interface FeedbackResponse {
  success: boolean;
  planId?: string;
  toVersion?: number;
  updatedWeeks?: TrainingWeek[];
  warnings?: string[];
  error?: string;
}

export default function FeedbackModal({ isOpen, onClose, planId, userId }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<FeedbackResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setResponse(null);

    try {
      const res = await fetch('/api/planFeedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          planId,
          userId,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process feedback');
      }

      setResponse(data);
      setMessage('');
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setResponse(null);
    onClose();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  Plan Feedback
                </Dialog.Title>
                <button
                  onClick={handleClose}
                  className="text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!response ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="feedback" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      How would you like to modify your training plan?
                    </label>
                    <textarea
                      id="feedback"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g., 'Move my long run from Sunday to Saturday', 'I want to reduce the intensity of my Tuesday workout', 'Add an extra rest day this week'"
                      className="w-full h-32 px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-lg resize-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                    <h4 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                      💡 Examples of what you can ask:
                    </h4>
                    <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <li>• &quot;Move my long run from Sunday to Saturday&quot;</li>
                      <li>• &quot;Reduce the intensity of my Tuesday workout&quot;</li>
                      <li>• &quot;Add an extra rest day this week&quot;</li>
                      <li>• &quot;Swap my Wednesday and Friday workouts&quot;</li>
                      <li>• &quot;Increase my weekly mileage by 10%&quot;</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !message.trim()}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  {response.success ? (
                    <div className="p-4 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                          Plan Updated Successfully!
                        </h4>
                      </div>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your training plan has been updated based on your feedback.
                      </p>
                      {response.warnings && response.warnings.length > 0 && (
                        <div className="mt-3">
                          <h5 className="mb-1 text-sm font-medium text-green-800 dark:text-green-200">
                            Warnings:
                          </h5>
                          <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
                            {response.warnings.map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                          Error Processing Feedback
                        </h4>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {response.error || 'An unexpected error occurred while processing your feedback.'}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
