import { User, RaceDist, Mileage } from '@/lib/types';

export function getMileageProgression(user: User): Mileage[] {
    const { numWeeks, goalMileage, currentMileage } = user;

    const raceSpecificWeeks = {'1500': 4, 'Mile': 4, '3K': 4, '5K': 6, '10K': 6, 'Half Marathon': 8, 'Marathon': 10};

    const taperWeeks: Record<RaceDist, number[]> = {'1500': [0.9, 0.8], 'Mile': [0.9, 0.8], '3K': [0.9, 0.8], '5K': [0.9, 0.8], '10K': [0.9, 0.7], 'Half Marathon': [0.9, 0.8, 0.6], 'Marathon': [0.9, 0.8, 0.6, 0.5]};
    
    let current: number = Number(currentMileage);

    const mileageProgression: Mileage[] = [{ mileage: current, raceSpecific: false, taper: false }];

    const numericGoalMileage = Number(goalMileage);

    const baseWeeks = Math.max(0, numWeeks - taperWeeks[user.goalRaceDistance].length);

    const beforeRaceSpecificWeeks = Math.max(0, numWeeks - raceSpecificWeeks[user.goalRaceDistance]);

    for (let i = 1; i < baseWeeks; i++) {
        let raceSpecific = false;

        current = Math.min(Math.ceil(current + Math.max(3, 0.1 * current)), numericGoalMileage);

        if (i >= beforeRaceSpecificWeeks) {
            raceSpecific = true;
        }

        mileageProgression.push({ mileage: current, raceSpecific, taper: false });
    }

    const peakMileage = mileageProgression[mileageProgression.length - 1].mileage;

    for (let i = 0; i < taperWeeks[user.goalRaceDistance].length; i++) {
        const taperFactor = taperWeeks[user.goalRaceDistance][i];
        current = Math.ceil(peakMileage * taperFactor);

        mileageProgression.push({ mileage: current, raceSpecific: true, taper: true });
    }

    return mileageProgression
}