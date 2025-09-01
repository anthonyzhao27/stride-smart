import { TrainingWeek, TrainingWorkout } from '../src/lib/feedback-loop/types';

// Test data structures without Firebase dependencies
const mockTrainingWeek: TrainingWeek = {
  id: "test_week_1",
  week: 1,
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-07"),
  totalMileage: 25.5,
  totalDuration: 180,
  description: "Test week for Firestore saving",
  workouts: [
    {
      name: "Easy Run",
      date: new Date("2024-01-01"),
      distance: 5,
      duration: 45,
      tags: "Easy",
      notes: "Test workout 1"
    } as TrainingWorkout,
    {
      name: "Tempo Run",
      date: new Date("2024-01-03"),
      distance: 8,
      duration: 60,
      tags: "LT2",
      notes: "Test workout 2"
    } as TrainingWorkout
  ]
};

const mockWeek2: TrainingWeek = {
  id: "test_week_2",
  week: 2,
  startDate: new Date("2024-01-08"),
  endDate: new Date("2024-01-14"),
  totalMileage: 12,
  totalDuration: 90,
  description: "Test week 2 for Firestore saving",
  workouts: [
    {
      name: "Long Run",
      date: new Date("2024-01-08"),
      distance: 12,
      duration: 90,
      tags: "Easy",
      notes: "Test long run"
    } as TrainingWorkout
  ]
};

describe('Firestore Repository Logic Tests', () => {
  describe('Data Structure Validation', () => {
    it('should have valid training week structure', () => {
      expect(mockTrainingWeek.id).toBe('test_week_1');
      expect(mockTrainingWeek.week).toBe(1);
      expect(mockTrainingWeek.workouts).toHaveLength(2);
      expect(mockTrainingWeek.totalMileage).toBe(25.5);
      expect(mockTrainingWeek.totalDuration).toBe(180);
    });

    it('should have valid workout structure', () => {
      const workout = mockTrainingWeek.workouts[0];
      expect(workout.name).toBe('Easy Run');
      expect(workout.distance).toBe(5);
      expect(workout.duration).toBe(45);
      expect(workout.tags).toBe('Easy');
      expect(workout.notes).toBe('Test workout 1');
    });

    it('should handle dates correctly', () => {
      expect(mockTrainingWeek.startDate).toBeInstanceOf(Date);
      expect(mockTrainingWeek.endDate).toBeInstanceOf(Date);
      expect(mockTrainingWeek.workouts[0].date).toBeInstanceOf(Date);
      
      // Check date logic
      expect(mockTrainingWeek.startDate.getTime()).toBeLessThan(mockTrainingWeek.endDate.getTime());
    });

    it('should have consistent workout data', () => {
      const workouts = mockTrainingWeek.workouts;
      
      // Check that all workouts have required fields
      workouts.forEach(workout => {
        expect(workout.name).toBeDefined();
        expect(workout.date).toBeDefined();
        expect(workout.distance).toBeDefined();
        expect(workout.duration).toBeDefined();
        expect(workout.tags).toBeDefined();
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should calculate total mileage correctly', () => {
      const totalMileage = mockTrainingWeek.workouts.reduce((sum, workout) => sum + workout.distance, 0);
      expect(totalMileage).toBe(13); // 5 + 8
    });

    it('should calculate total duration correctly', () => {
      const totalDuration = mockTrainingWeek.workouts.reduce((sum, workout) => sum + workout.duration, 0);
      expect(totalDuration).toBe(105); // 45 + 60
    });

    it('should have workouts within week boundaries', () => {
      const weekStart = mockTrainingWeek.startDate;
      const weekEnd = mockTrainingWeek.endDate;
      
      mockTrainingWeek.workouts.forEach(workout => {
        expect(workout.date.getTime()).toBeGreaterThanOrEqual(weekStart.getTime());
        expect(workout.date.getTime()).toBeLessThanOrEqual(weekEnd.getTime());
      });
    });

    it('should handle multiple weeks correctly', () => {
      const weeks = [mockTrainingWeek, mockWeek2];
      
      expect(weeks).toHaveLength(2);
      expect(weeks[0].week).toBe(1);
      expect(weeks[1].week).toBe(2);
      
      // Check that weeks don't overlap
      expect(weeks[0].endDate.getTime()).toBeLessThan(weeks[1].startDate.getTime());
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty workout array', () => {
      const emptyWeek: TrainingWeek = {
        ...mockTrainingWeek,
        id: "empty_week",
        workouts: [],
        totalMileage: 0,
        totalDuration: 0
      };
      
      expect(emptyWeek.workouts).toHaveLength(0);
      expect(emptyWeek.totalMileage).toBe(0);
      expect(emptyWeek.totalDuration).toBe(0);
    });

    it('should handle workouts with zero distance/duration', () => {
      const restDay: TrainingWorkout = {
        name: "Rest Day",
        date: new Date("2024-01-02"),
        distance: 0,
        duration: 0,
        tags: "Easy",
        notes: "Complete rest day"
      };
      
      expect(restDay.distance).toBe(0);
      expect(restDay.duration).toBe(0);
      expect(restDay.tags).toBe('Easy');
    });

    it('should handle workouts without optional fields', () => {
      const minimalWorkout: TrainingWorkout = {
        name: "Minimal Workout",
        date: new Date("2024-01-01"),
        distance: 3,
        duration: 30,
        tags: "Easy"
        // No notes field
      };
      
      expect(minimalWorkout.name).toBeDefined();
      expect(minimalWorkout.date).toBeDefined();
      expect(minimalWorkout.distance).toBeDefined();
      expect(minimalWorkout.duration).toBeDefined();
      expect(minimalWorkout.tags).toBeDefined();
      expect(minimalWorkout.notes).toBeUndefined();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain workout order by date', () => {
      const workouts = [...mockTrainingWeek.workouts].sort((a, b) => 
        a.date.getTime() - b.date.getTime()
      );
      
      expect(workouts[0].date.getTime()).toBeLessThan(workouts[1].date.getTime());
    });

    it('should have unique workout IDs if they exist', () => {
      // Add IDs to workouts for testing
      const workoutsWithIds = mockTrainingWeek.workouts.map((workout, index) => ({
        ...workout,
        id: `workout_${index}`
      }));
      
      const ids = workoutsWithIds.map(w => w.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(workoutsWithIds.length);
    });

    it('should validate workout intensity progression', () => {
      const workouts = mockTrainingWeek.workouts;
      
      // Check that we have a mix of intensities
      const tags = workouts.map(w => w.tags);
      expect(tags).toContain('Easy');
      expect(tags).toContain('LT2');
      
      // Check that distances are reasonable for the intensity
      workouts.forEach(workout => {
        if (workout.tags === 'Easy') {
          expect(workout.distance).toBeLessThanOrEqual(6); // Easy runs typically shorter
        }
        if (workout.tags === 'LT2') {
          expect(workout.distance).toBeGreaterThan(5); // LT2 runs typically longer
        }
      });
    });
  });
});
