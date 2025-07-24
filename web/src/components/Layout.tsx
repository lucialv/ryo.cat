import React from "react";
import Header from "@/components/Header.tsx";
import Footer from "@/components/Footer.tsx";
import logo from "@/assets/icon.svg";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-white dark:bg-neutral-900 relative">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(
              circle 1200px at 20% 80%,
              var(--radial-color),
              transparent
            ),
            radial-gradient(
              circle 1200px at 40% 40%,
              var(--radial-color),
              transparent
            ),
            radial-gradient(
              circle 1200px at 80% 20%,
              var(--radial-color),
              transparent
            )
          `,
        } as React.CSSProperties}
      />
      <div className="relative z-10 flex flex-col flex-1">
        <Header logoSrc={logo} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;