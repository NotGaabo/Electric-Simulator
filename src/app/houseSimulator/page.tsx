'use client';

import dynamic from 'next/dynamic';

const HouseSimulator = dynamic(() => import('./HouseSimulator'), { ssr: false });

export default function HouseSimulatorPage() {
  return <HouseSimulator />;
}