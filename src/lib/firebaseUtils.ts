// lib/firebaseUtils.ts
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrainingWorkout, LoggedWorkout } from "@/lib/types";

export async function fetchWorkoutsForMonth(start: Date, uid: string): Promise<Record<string, LoggedWorkout[]>> {
    const end = new Date(start);
    end.setDate(start.getDate() + 42);

    const q = query(
        collection(db, 'users', uid, "workouts"),
        where("timestamp", ">=", Timestamp.fromDate(start)),
        where("timestamp", "<=", Timestamp.fromDate(end))
    );

    
    const snapshot = await getDocs(q);
    const result: Record<string, LoggedWorkout[]> = {};
    
    if (snapshot.empty) {
        console.log("No workouts found for the month.");
        return result;
    }
    
    snapshot.forEach((doc) => {
        const data = doc.data();
        const ts = data.timestamp.toDate();

        const workout: LoggedWorkout = {
            id: doc.id,
            name: data.name,
            timestamp: ts,
            date: ts.toDateString().split("T")[0],
            time: `${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`,
            duration: data.duration,
            distance: data.distance,
            unit: data.unit,
            type: data.type,
            effortLevel: data.effortLevel,
            notes: data.notes,

        }
        const date = workout.date;
        if (!result[date]) result[date] = [];
        result[date].push(workout);
    });

    return result;
}

export async function fetchNextTrainingWorkout(uid: string) {

}