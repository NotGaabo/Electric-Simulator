// src/app/page.tsx

import CircuitSimulator from "@/components/electrical/CircuitSimulator";
import AssignmentSimulatorWrapper from "@/components/assignments/AssignmentSimulatorWrapper";

export default function Home() {
  return (
    <AssignmentSimulatorWrapper module="circuit">
      <CircuitSimulator />
    </AssignmentSimulatorWrapper>
  );
}
