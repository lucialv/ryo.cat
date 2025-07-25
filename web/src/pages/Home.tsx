import type React from "react";
import HeroSection from "../components/HeroSection.tsx";
import PostsList from "../components/PostsList.tsx";

const Home: React.FC = () => {
  return (
    <>
      <HeroSection />
      <section className="py-8 px-4">
        <PostsList />
      </section>
    </>
  );
};

export default Home;