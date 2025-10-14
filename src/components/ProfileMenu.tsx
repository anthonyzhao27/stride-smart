import { Menu } from "@headlessui/react";
import { signOut } from "@/lib/cognito";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfileMenu() {
    const { user } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
            window.location.href = '/login'; // Force reload to clear auth state
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="relative inline-block text-left">
            <Menu as="div" className="relative">
                <Menu.Button>
                    {user ? (
                        <Image 
                            src={user?.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=ddd&color=555`} 
                            alt="Profile" 
                            width={24} 
                            height={24}
                            className="w-10 h-10 rounded-full" 
                        />
                        ) : (
                        <p>Not logged in</p>
                    )}
                </Menu.Button>

                {/* Dropdown Panel */}
                <Menu.Items className="absolute right-0 z-50 w-32 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none">
                    <div className="px-1 py-1">
                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    onClick={handleSignOut}
                                    className={`${
                                        active ? "bg-red-100" : ""
                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-600`}
                                >
                                    Sign out
                                </button>
                            )}
                        </Menu.Item>
                    </div>
                </Menu.Items>
            </Menu>
        </div>
    );
}