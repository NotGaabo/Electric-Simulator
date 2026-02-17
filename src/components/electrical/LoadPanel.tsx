// src/components/electrical/LoadPanel.tsx

import { useProjectStore } from "@/store/projectStore";
import { calculateTotalLoad } from "@/lib/calculations/loadCalculations";

export default function LoadPanel() {
  const symbols = useProjectStore((state) => state.symbols);

  const totalLoad = calculateTotalLoad(symbols);

  return (
    <div className="p-4 border-t">
      <h3 className="font-bold">Carga Total</h3>
      <p>{totalLoad} W</p>
    </div>
  );
}
