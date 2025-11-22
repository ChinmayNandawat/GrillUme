import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navigation";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background selection:bg-primary-container selection:text-on-primary-container">
        <Navbar />
        <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-10">

        </main>
      </div>
    </Router>
  );
}
