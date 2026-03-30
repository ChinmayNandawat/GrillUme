# GrillUme

GrillUme is a community-driven platform built for one thing: turning your mediocre resume into a masterpiece through the power of peer-to-peer roasting. It provides a structured but lighthearted environment where users can upload resumes to receive brutal feedback, constructive critiques, and ratings from a community that doesn't hold back.

## Features

### The Grill Experience
- **Resume Roasting**: A dedicated system for users to deliver the heat. Post critiques, point out those cringe-worthy bullet points, and help others level up.
- **The Fire Metric**: A voting mechanism for resumes and comments. If a roast is particularly sharp or a resume is actually decent, let the community know with the Fire Metric.
- **Classified Mode**: Privacy matters. Use the "Classified" toggle to signal that you've already redacted your sensitive info before throwing your document into the pit.
- **Resume Discovery**: A global feed of community submissions. Browse, learn from others' mistakes, or add your own fuel to the fire.
- **Profile Dashboard**: Your personal command center. Track your uploads, manage the roasts you've received, and monitor your overall engagement.

### Technical Foundation
- **Secure Authentication**: Robust JWT-based registration and login system. Only authenticated roasters get to participate.
- **Real-time PDF Preview**: Integrated viewer for seamless document review without leaving the application.
- **Battle-Ready Security**: Implemented rate-limiting and Helmet-based security headers to keep the platform safe from bad actors.

## Tech Stack

### The Engine Room (Backend)
- **Node.js & Express**: The core API architecture.
- **Prisma ORM**: Type-safe database interactions that won't bite back.
- **PostgreSQL**: Reliable relational storage for all your data.
- **Supabase**: Managed database hosting for maximum uptime.
- **Cloudinary**: Handling the heavy lifting for resume file storage and delivery.

### The Front Line (Frontend)
- **React 19**: Building high-performance, interactive user interfaces.
- **TypeScript**: Ensuring the codebase is as solid as your new resume.
- **Vite**: Ultra-fast development and build tooling.
- **Tailwind CSS**: Rapid, utility-first styling for a sleek look.
- **Motion**: Fluid animations that make the roasting experience feel alive.

## Project Structure

```text
├── backend/                    # Node.js & Express API
│   ├── prisma/                 # Database schema and migration tracking
│   ├── postman/                # API testing collections and environments
│   └── src/
│       ├── config/             # Cloudinary, Supabase, and environment configs
│       ├── controllers/        # Request handling and business logic
│       ├── middleware/         # Auth, error handling, and rate limiting
│       ├── routes/             # API endpoint definitions
│       ├── validation/         # Zod/Joi schema definitions
│       └── index.ts            # Server entry point
├── frontend/                   # React & Vite Application
│   ├── public/                 # Static assets
│   └── src/
│       ├── components/         # Atomic UI design
│       │   ├── layouts/        # Page wrappers and navigation
│       │   ├── profile/        # Profile-specific cards and stats
│       │   ├── roast/          # Resume cards and roast bubbles
│       │   └── ui/             # Reusable base components (buttons, etc.)
│       ├── context/            # Auth and global state management
│       ├── hooks/              # Custom React hooks (debounce, etc.)
│       ├── pages/              # Main view entry points
│       ├── services/           # API integration and contracts
│       ├── types.ts            # Global TypeScript interfaces
│       └── main.tsx            # Application entry point
└── package.json                # Root scripts for development and deployment
```

## Getting Started

### Prerequisites
- Node.js (Latest LTS)
- A PostgreSQL database (Supabase recommended)
- A Cloudinary account for file uploads

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ChinmayNandawat/GrillUme.git
   cd GrillUme
   ```

2. Fire up the dependencies (Root, Backend, and Frontend):
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. Setup your environment in `backend/.env`:
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   DATABASE_URL=your_postgresql_url
   JWT_SECRET=your_jwt_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_key
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Initialize the database:
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   cd ..
   ```

### Running the Application

To start the entire stack with a single command:
```bash
npm run dev
```

Alternatively, run them separately:
- **Backend**: `npm run dev` in `backend/`
- **Frontend**: `npm run dev` in `frontend/`

## API Testing

Pre-configured Postman collections and environments are available in `backend/postman/` for those who want to poke at the API directly.

## License

This project is licensed under the MIT License.
