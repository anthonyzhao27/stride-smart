import { User } from '@/lib/types';

export function getMileageProgression(user: User): number[] {
    const { numWeeks, goalMileage, currentMileage } = user;
    
    let current: number = Number(currentMileage);

    const mileageProgression: number[] = [current];

    const numericGoalMileage = Number(goalMileage);

    for (let i = 1; i < numWeeks; i++) {
        current = Math.ceil(current + Math.max(3, 0.1 * current));

        mileageProgression.push(current >= numericGoalMileage ? numericGoalMileage : current);
    }

    return mileageProgression
}