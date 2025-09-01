import { firestoreRepo } from '../src/lib/feedback-loop/firestoreRepo';
import { TrainingWeek, TrainingWorkout } from '../src/lib/feedback-loop/types';

// Mock the entire Firebase module
jest.mock('../src/lib/firebase', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
    runTransaction: jest.fn(),
  }
}));

// Mock Firestore functions
const mockSetDoc = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockRunTransaction = jest.fn();

// Import the mocked db
import { db } from '../src/lib/firebase';

// Mock data for testing
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
  endDate: new Date("2024-01-07"),
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

describe('firestoreRepo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock return values
    mockSetDoc.mockResolvedValue(undefined);
    
    // Mock the collection function
    (db.collection as jest.Mock).mockReturnValue({
      doc: mockDoc
    });
    
    // Mock the doc function
    (db.doc as jest.Mock).mockReturnValue({
      set: mockSetDoc
    });
    
    // Mock runTransaction
    (db.runTransaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({ version: 0, changelog: [] })
        }),
        update: jest.fn()
      });
    });
  });

  describe('savePlan', () => {
    it('should save single week to current-plan', async () => {
      const result = await firestoreRepo.savePlan(
        'test_user_123',
        'current-plan',
        [mockTrainingWeek],
        0,
        {
          atISO: new Date().toISOString(),
          actor: "TEST_SCRIPT",
          operations: [],
          changeset: [],
          warnings: []
        }
      );

      expect(result).toEqual({ newVersion: 1 });
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('should save multiple weeks to current-plan', async () => {
      const result = await firestoreRepo.savePlan(
        'test_user_123',
        'current-plan',
        [mockTrainingWeek, mockWeek2],
        0,
        {
          atISO: new Date().toISOString(),
          actor: "TEST_SCRIPT",
          operations: [],
          changeset: [],
          warnings: []
        }
      );

      expect(result).toEqual({ newVersion: 1 });
      expect(mockSetDoc).toHaveBeenCalledTimes(2);
    });

    it('should save to specific plan ID (legacy mode)', async () => {
      const result = await firestoreRepo.savePlan(
        'test_user_123',
        'specific-plan-123',
        [mockTrainingWeek],
        0,
        {
          atISO: new Date().toISOString(),
          actor: "TEST_SCRIPT",
          operations: [],
          changeset: [],
          warnings: []
        }
      );

      expect(result).toEqual({ newVersion: 1 });
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('should increment version correctly', async () => {
      const result = await firestoreRepo.savePlan(
        'test_user_123',
        'current-plan',
        [mockTrainingWeek],
        5, // Expected version 5
        {
          atISO: new Date().toISOString(),
          actor: "TEST_SCRIPT",
          operations: [],
          changeset: [],
          warnings: []
        }
      );

      expect(result).toEqual({ newVersion: 6 });
    });

    it('should handle empty plan array', async () => {
      const result = await firestoreRepo.savePlan(
        'test_user_123',
        'current-plan',
        [], // Empty array
        0,
        {
          atISO: new Date().toISOString(),
          actor: "TEST_SCRIPT",
          operations: [],
          changeset: [],
          warnings: []
        }
      );

      expect(result).toEqual({ newVersion: 1 });
      expect(mockSetDoc).toHaveBeenCalledTimes(0);
    });
  });

  describe('data structure validation', () => {
    it('should preserve workout data structure', async () => {
      await firestoreRepo.savePlan(
        'test_user_123',
        'current-plan',
        [mockTrainingWeek],
        0,
        {
          atISO: new Date().toISOString(),
          actor: "TEST_SCRIPT",
          operations: [],
          changeset: [],
          warnings: []
        }
      );

      // Check that the last call to setDoc preserved the workout structure
      const lastCall = mockSetDoc.mock.calls[mockSetDoc.mock.calls.length - 1];
      const savedData = lastCall[0];
      
      expect(savedData.workouts).toHaveLength(2);
      expect(savedData.workouts[0].name).toBe('Easy Run');
      expect(savedData.workouts[0].distance).toBe(5);
      expect(savedData.workouts[1].name).toBe('Tempo Run');
      expect(savedData.workouts[1].tags).toBe('LT2');
    });

    it('should handle workouts without optional fields', async () => {
      const minimalWeek: TrainingWeek = {
        id: "minimal_week",
        week: 1,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-07"),
        totalMileage: 0,
        totalDuration: 0,
        description: "",
        workouts: [
          {
            name: "Minimal Workout",
            date: new Date("2024-01-01"),
            distance: 0,
            duration: 0,
            tags: "Easy"
          } as TrainingWorkout
        ]
      };

      await firestoreRepo.savePlan(
        'test_user_123',
        'current-plan',
        [minimalWeek],
        0,
        {
          atISO: new Date().toISOString(),
          actor: "TEST_SCRIPT",
          operations: [],
          changeset: [],
          warnings: []
        }
      );

      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle setDoc errors gracefully', async () => {
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      await expect(firestoreRepo.savePlan(
        'test_user_123',
        'current-plan',
        [mockTrainingWeek],
        0,
        {
          atISO: new Date().toISOString(),
          actor: "TEST_SCRIPT",
          operations: [],
          changeset: [],
          warnings: []
        }
      )).rejects.toThrow('Firestore error');
    });
  });
});
