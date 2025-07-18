import { Menu } from "@headlessui/react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase"; // update path as needed
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function ProfileMenu() {
    const { user } = useAuth();

    return (
        <div className="relative inline-block text-left">
            <Menu as="div" className="relative">
                <Menu.Button>
                    {user ? (
                        <Image src={user?.photoURL ?? "https://ui-avatars.com/api/?name=User&background=ddd&color=555"} alt="Profile" width={24} height={24}className="w-10 h-10 rounded-full" />
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
                                onClick={() => signOut(auth)}
                                className={`${
                                    active ? "bg-gray-100" : ""
                                } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700`}
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