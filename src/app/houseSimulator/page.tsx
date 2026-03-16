import HouseSimulator from "./HouseSimulator";
import AssignmentSimulatorWrapper from "@/components/assignments/AssignmentSimulatorWrapper";

export default function HouseSimulatorPage() {
  return (
    <AssignmentSimulatorWrapper module="house">
      <HouseSimulator />
    </AssignmentSimulatorWrapper>
  );
}
