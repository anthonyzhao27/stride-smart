import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const dummyData = [
  { week: '2025-05-05', mileage: 22 },
  { week: '2025-05-12', mileage: 28 },
  { week: '2025-05-19', mileage: 35 },
  { week: '2025-05-26', mileage: 30 },
];

export default function MileageChart() {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dummyData}>
                <XAxis dataKey="week" />
                <YAxis label={{ value: 'Miles', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="mileage" stroke="#10b981" strokeWidth={2} />
            </LineChart>
        </ResponsiveContainer>
    );
}
