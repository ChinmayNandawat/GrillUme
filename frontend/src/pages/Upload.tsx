import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { repository } from "../services/repository";
import type { Resume, BattleScroll } from "../types";

export default function Upload() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role) return;

    const id = Date.now().toString();
    const newResume: Resume = {
      id,
      name,
      role,
      date: "Just now",
      fires: "0",
      comments: "0",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      variant: (["blue", "red", "green", "yellow"] as const)[Math.floor(Math.random() * 4)],
    };

    const newScroll: BattleScroll = {
      id,
      name,
      date: "Just now",
      roasts: "0",
      colors: ["#3B82F6", "#1D4ED8"], // Default blue colors
    };

    repository.addResume(newResume, newScroll);
    navigate("/");
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-on-background">Upload Your Resume</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-surface p-8 rounded-2xl border border-outline-variant shadow-lg">
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-background border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background"
            placeholder="Enter your name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-variant mb-2">Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-background border border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-background"
            placeholder="e.g. Senior Web Developer"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors shadow-lg active:scale-[0.98]"
        >
          Submit for Roasting
        </button>
      </form>
    </div>
  );
}