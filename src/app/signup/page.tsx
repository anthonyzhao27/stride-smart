import SignUpForm from '@/components/SignUpForm';

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">Sign Up</h1>
                <SignUpForm />
            </div>
        </div>
    );
}