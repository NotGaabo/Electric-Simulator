'use client';

import dynamic from 'next/dynamic';
import AssignmentSimulatorWrapper from '@/components/assignments/AssignmentSimulatorWrapper';

const HouseSimulator = dynamic(() => import('./HouseSimulator'), { ssr: false });

export default function HouseSimulatorPage() {
  return (
    <AssignmentSimulatorWrapper module="house">
      <HouseSimulator />
    </AssignmentSimulatorWrapper>
  );
}