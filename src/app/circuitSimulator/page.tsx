<<<<<<< HEAD
"use client";

export default function DashboardPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Dashboard</h1>
      <p>Panel en construcción.</p>
    </main>
=======
// src/app/page.tsx

import CircuitSimulator from "@/components/electrical/CircuitSimulator";
import AssignmentSimulatorWrapper from "@/components/assignments/AssignmentSimulatorWrapper";

export default function Home() {
  return (
    <AssignmentSimulatorWrapper module="circuit">
      <CircuitSimulator />
    </AssignmentSimulatorWrapper>
>>>>>>> 50d01817873adc1a84b80a9da33e6de22ae6dd64
  );
}
