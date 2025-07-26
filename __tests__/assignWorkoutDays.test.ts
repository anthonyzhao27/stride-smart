import { assignWorkoutDays } from "@/lib/training/assignWorkoutDays";
import { User } from "@/lib/types";



type mockUser = {
  trainingDays: string[],
  numDaysDoubleThreshold: number,
};


describe("assignWorkoutDays", () => {
  it("assigns 4-day non-race-specific plan", () => {
    const user: mockUser = {
      trainingDays: ["Monday", "Tuesday", "Thursday", "Saturday"],
      numDaysDoubleThreshold: 0
    };
    const result = assignWorkoutDays(user as User, false);
    expect(result).toEqual({
      LongRunDay: "Tuesday",
      LT2Day: "Saturday"
    });
  });

  it("assigns 4-day race-specific plan", () => {
    const user: mockUser = {
      trainingDays: ["Monday", "Tuesday", "Thursday", "Saturday"],
      numDaysDoubleThreshold: 0
    };
    const result = assignWorkoutDays(user as User, true);
    expect(result).toEqual({
      LT2Day: "Tuesday",
      VO2RaceDay: "Saturday"
    });
  });

  it("assigns 5-day plan with gaps", () => {
    const user: mockUser = {
      trainingDays: ["Monday", "Tuesday", "Thursday", "Friday", "Sunday"],
      numDaysDoubleThreshold: 0
    };
    const result = assignWorkoutDays(user as User, false);
    expect(result).toHaveProperty("LT1Day");
    expect(result).toHaveProperty("LT2Day");
    expect(result).toHaveProperty("VO2RaceDay");
    expect(result).toHaveProperty("LongRunDay");
  });

  it("assigns 6-day plan correctly", () => {
    const user: mockUser = {
      trainingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      numDaysDoubleThreshold: 0
    };
    const result = assignWorkoutDays(user as User, false);
    expect(result).toEqual({
      LT1Day: "Tuesday",
      LT2Day: "Thursday",
      VO2RaceDay: "Saturday",
      LongRunDay: "Monday"
    });
  });

  it("assigns 7-day plan with no double thresholds", () => {
    const user: mockUser = {
      trainingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      numDaysDoubleThreshold: 0
    };
    const result = assignWorkoutDays(user as User, false);
    expect(result).toEqual({
      LT1Day: "Tuesday",
      LT2Day: "Thursday",
      VO2RaceDay: "Saturday",
      LongRunDay: "Sunday"
    });
  });

  it("assigns 7-day plan with 2 double threshold days", () => {
    const user: mockUser = {
      trainingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      numDaysDoubleThreshold: 2
    };
    const result = assignWorkoutDays(user as User, false);
    expect(result).toEqual({
      doubleThresholdDays: ["Tuesday", "Thursday"],
      VO2RaceDay: "Saturday",
      LongRunDay: "Sunday"
    });
  });
});
