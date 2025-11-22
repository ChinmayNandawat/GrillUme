import { BrowserRouter as Router} from "react-router-dom";
import { Footer, Navbar } from "./components/Navigation";
import { ResumeCard } from "./components/ResumeCard";


export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background selection:bg-primary-container selection:text-on-primary-container">
        <Navbar />
        <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-10">
          {/* Dummy Data hai for viewing cards, yaha Routes ayenge */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ResumeCard 
              id="1"
              name="Chinmay"
              role="Senior Web Developer"
              date="10 mins ago"
              fires="420"
              comments="123"
              avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
              isHot={true}
              variant="blue"
            />
          </div>

        </main>
        <Footer />
      </div>
    </Router>
  );
}


