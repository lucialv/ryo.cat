import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import ThemeToggle from "@/components/ThemeToggle.tsx";
import { useState, useEffect, useRef } from "react";
import { User, Settings, HelpCircle, LogOut } from "lucide-react";
import LoginGoogle from "@/components/LoginGoogle";

interface HeaderProps {
  logoSrc: string;
}

const Header: React.FC<HeaderProps> = ({ logoSrc }) => {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile(user?.id || "");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentProfilePicture = profile?.profilePictureUrl || user?.profileImg;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const isHomePage =
    window.location.pathname === "/" ||
    window.location.pathname === "/onboarding" ||
    window.location.pathname === "/onboarding/splynx";
  const shouldBlur = isHomePage ? isScrolled : true;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${shouldBlur ? "bg-white/50 dark:bg-neutral-800/50 backdrop-blur-xs" : ""}`}
    >
      <div className="px-6 py-4 flex justify-between items-center">
        <a
          href="/"
          className="flex items-center hover:scale-105 transition-transform"
        >
          <img
            src={logoSrc || "/placeholder.svg"}
            alt="Logo"
            className="h-8 w-8"
          />
          <h1 className="ml-3 text-xl font-semibold text-purple-900 dark:text-purple-200">
            Ryo Cat
          </h1>
        </a>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {user ? (
            <div className="relative" ref={dropdownRef}>
              {currentProfilePicture ? (
                <img
                  src={currentProfilePicture}
                  alt="User Avatar"
                  className="h-10 w-10 rounded-full cursor-pointer object-cover"
                  onClick={() => setShowDropdown(!showDropdown)}
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 cursor-pointer flex items-center justify-center"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              )}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {currentProfilePicture ? (
                          <img
                            src={currentProfilePicture}
                            alt="User Avatar"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800"></div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {profile?.name || user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {profile?.email || user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <a
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700"
                    >
                      <User className="h-4 w-4 mr-3" />
                      View profile
                    </a>
                    <a
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-neutral-700/80"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </a>
                  </div>

                  <div className="border-t border-neutral-200 dark:border-neutral-700 py-1">
                    <a
                      href="/contact"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-neutral-700/80"
                    >
                      <HelpCircle className="h-4 w-4 mr-3" />
                      Contact
                    </a>
                  </div>

                  <div className="border-t border-neutral-200 dark:border-neutral-700 py-1">
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-neutral-700/80"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            window.location.pathname !== "/login" && <LoginGoogle />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
