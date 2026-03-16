import { SensorSimulation } from "./SensorSimulation";
import AssignmentSimulatorWrapper from "@/components/assignments/AssignmentSimulatorWrapper";

export default function Page() {
  return (
    <AssignmentSimulatorWrapper module="sensor">
      <SensorSimulation />
    </AssignmentSimulatorWrapper>
  );
}
