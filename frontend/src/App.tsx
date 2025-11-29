import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Footer, Navbar } from "./components/layouts/Navigation";
import Home from "./pages/Home";
import { Upload } from "./pages/Upload";


export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background selection:bg-primary-container selection:text-on-primary-container">
        <Navbar />
        <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}


