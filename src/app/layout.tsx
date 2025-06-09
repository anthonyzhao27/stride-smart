// app/layout.tsx
import './globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: 'StrideSmart',
  description: 'AI-based fitness app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
