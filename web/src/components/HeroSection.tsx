import type React from "react";
import { useAuth } from "@/context/AuthContext";

const HeroSection: React.FC = () => {
    const { user } = useAuth();
    return (
        <>
            <section className="relative mt-[73px] min-h-[calc(30vh-73px)] flex items-center justify-center overflow-hidden ">
                <div className="w-full max-w-7xl mx-auto px-4 text-center relative z-10 flex flex-col items-center">
                    <div className="w-full">
                        <div className="mt-8 w-full max-w-3xl mx-auto bg-white/70 dark:bg-neutral-800/70 rounded-2xl border-2 border-neutral-200 dark:border-neutral-600 p-6">
                            <div className="flex-row items-start gap-3">
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src={user?.profileImg}
                                        alt="User Avatar"
                                        className="h-10 w-10 rounded-full"
                                    />
                                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Hi {user?.name || "there"}, what's Ryo doing?
                                    </p>
                                </div>

                                <div className="flex-row w-full">

                                    <textarea
                                        className="w-full p-4 bg-neutral-50/70 dark:bg-neutral-700/50 rounded-xl border border-neutral-200 dark:border-neutral-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-neutral-800 dark:text-neutral-200"
                                        placeholder="What's meowing?"
                                        rows={2}
                                    />
                                    <div className="flex justify-between mt-3">
                                        <div className="flex gap-2">
                                            <button className="p-2 text-purple-500 rounded-full hover:bg-purple-50 dark:hover:bg-neutral-700">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                            <button className="p-2 text-purple-500 rounded-full hover:bg-purple-50 dark:hover:bg-neutral-700">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <button className="px-4 py-2 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors">
                                            Post
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default HeroSection;