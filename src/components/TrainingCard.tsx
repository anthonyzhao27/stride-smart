import {TrainingWorkout} from '@/lib/types';

const tagColorMap: Record<TrainingWorkout['tags'], string> = {
  LT1: 'bg-yellow-100 text-yellow-800',
  LT2: 'bg-red-100 text-red-800',
  Hills: 'bg-green-100 text-green-800',
  MediumLongRun: 'bg-blue-100 text-blue-800',
  LongRun: 'bg-purple-100 text-purple-800',
  Easy: 'bg-gray-100 text-gray-800',
  Crosstrain: 'bg-orange-100 text-orange-800',
  Off: 'bg-zinc-100 text-zinc-500',
};

export default function TrainingCard({ workout }: { workout: TrainingWorkout }) {
  return (
    <div className="p-4 space-y-2 bg-white border border-gray-200 shadow-sm rounded-2xl dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold">{workout.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{workout.dayOfWeek}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${tagColorMap[workout.tags]}`}>
          {workout.tags}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span> {workout.type}
        </div>
        <div>
          <span className="font-medium text-gray-700 dark:text-gray-300">Duration:</span> {workout.duration}
        </div>
        {workout.rest && (
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Rest:</span> {workout.rest}
          </div>
        )}
        <div>
        <span className="font-medium text-gray-700 dark:text-gray-300">Target HR:</span> {workout.targetHeartRate}
        </div>
      </div>

      {workout.notes && (
        <div className="pt-2 text-sm text-gray-600 border-t border-gray-200 dark:text-gray-400 dark:border-gray-700">
          <span className="block mb-1 font-medium">Notes:</span>
          <p>{workout.notes}</p>
        </div>
      )}
    </div>
  );
}