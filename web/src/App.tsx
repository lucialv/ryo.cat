import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import { ThemeProvider } from "@/context/ThemeContext";
import Home from "@/pages/Home.tsx";
import LoginForm from "@/pages/Login";

const App: React.FC = () => {
    return (
            <ThemeProvider>
                <Router>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<LoginForm />} />
                        </Routes>
                    </Layout>
                </Router>
            </ThemeProvider>
    );
};

export default App;