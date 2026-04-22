import IndustrialOfficeSimulator from "./IndustrialOfficeSimulator";
import AssignmentSimulatorWrapper from "@/components/assignments/AssignmentSimulatorWrapper";

export default function IndustrialOfficesPage() {
  return (
    <AssignmentSimulatorWrapper module="industrialoffice">
      <IndustrialOfficeSimulator />
    </AssignmentSimulatorWrapper>
  );
}
