# Voltify ⚡

An education-focused platform that combines classroom workflows (classes, assignments, comments, submissions) with a suite of interactive electrical simulators.

**Description**  
Voltify provides a modern, web-based learning environment where instructors can create classes and assignments, and students can complete simulation-based tasks. It includes multiple simulator modules (circuit, house, machine, sensor, industrial office) and supports real-time collaboration features powered by Supabase.

**Main Features**

- Classroom management: create or join classes, roles, and assignment deadlines. 🎓
- Assignments: publish tasks, discuss via comments, and submit simulator snapshots. 📝
- Real-time updates: live assignment and comment updates via Supabase Realtime. 🔄
- Circuit Simulator: drag-and-drop components, wire them, and see basic analysis. ⚡
- House Simulator: residential power layout and validation logic. 🏠
- Machine Simulator: industrial machine configuration with validation. 🏭
- Sensor Simulation: automation nodes, wiring, and control loop. 📡
- Industrial Offices: office/industrial load simulation. 🏢
- Submission capture: assignment submissions include a simulator screenshot using html2canvas.

**Tech Stack** 🧰

- Next.js (App Router)
- React
- TypeScript
- Supabase (Auth + Realtime)
- Tailwind CSS
- Zustand
- Vitest
- html2canvas

**Installation & Configuration**

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Supabase setup (high‑level):

- Create a Supabase project.
- Copy the project URL and anon key into `.env.local`.
- Enable Auth providers as needed.
- Configure database tables and policies for classes, assignments, comments, and submissions (see `src/app/api` routes for expected data).

**Usage**
Run the development server:

```bash
npm run dev
```

Open the app in your browser:

```
http://localhost:3000
```

Typical flow:

- Register or log in.
- Open the dashboard and create/join a class.
- Create assignments and open simulator modules to complete tasks.
- Submit assignment snapshots directly from the simulator view.

**Scripts**

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:watch
```

**Folder Structure**

```
public/
src/
  app/           # Next.js routes (App Router), pages, and API routes
  components/    # UI + simulator components
  hooks/         # Client hooks for dashboards, assignments, comments, simulators
  lib/           # Simulator modules, utils, Supabase clients
  store/         # Zustand stores
  types/         # Shared TypeScript types
```

**Contributing**
Contributions are welcome. Please open an issue to discuss changes or submit a pull request with a clear description and screenshots when relevant.
