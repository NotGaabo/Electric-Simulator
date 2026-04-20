export type SimulatorModuleId = 'circuit' | 'house' | 'machine' | 'sensor' | 'industrialoffice'

export interface SimulatorModule {
  id: SimulatorModuleId
  label: string
  route: string
}

export const SIMULATOR_MODULES: SimulatorModule[] = [
  { id: 'circuit', label: 'Simulador de Circuitos', route: '/circuitSimulator' },
  { id: 'house', label: 'Simulador de Casa', route: '/houseSimulator' },
  { id: 'machine', label: 'Simulador de Máquinas', route: '/machineSimulator' },
  { id: 'industrialoffice', label: 'Simulador de Oficina Industrial', route: '/IndustrialOffices' },
  { id: 'sensor', label: 'Simulador de Sensores', route: '/sensorSimulation' },
]

export const getSimulatorModuleById = (id?: string | null) =>
  SIMULATOR_MODULES.find((moduleItem) => moduleItem.id === id)

export const isValidSimulatorModule = (id?: string | null): id is SimulatorModuleId =>
  Boolean(id && SIMULATOR_MODULES.some((moduleItem) => moduleItem.id === id))