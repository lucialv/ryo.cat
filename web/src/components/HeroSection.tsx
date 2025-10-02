import type React from "react";
import { useAuth } from "@/context/AuthContext";
import PostForm from "./PostForm";

const HeroSection: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <section className="relative flex items-center justify-center overflow-hidden ">
        <div className="w-full max-w-7xl mx-auto px-4 text-center relative z-10 flex flex-col items-center">
          <div className="w-full">
            <div className="mt-8">{user?.isAdmin && <PostForm />}</div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
