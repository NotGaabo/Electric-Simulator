import AssignmentSimulatorWrapper from "@/components/assignments/AssignmentSimulatorWrapper";
import HouseSimulator from "./HouseSimulator";

export default function HouseSimulatorPage() {
  return (
    <AssignmentSimulatorWrapper module="house">
      <HouseSimulator />
    </AssignmentSimulatorWrapper>
  );
}
