export type ConverterTopology =
  | 'half_wave_uncontrolled'
  | 'half_wave_controlled'
  | 'full_wave_bridge_uncontrolled'
  | 'full_wave_bridge_controlled'
  | 'semi_controlled_bridge'
  | 'buck_converter'
  | 'boost_converter'
  | 'inverter_full_bridge';

export type LoadType = 'R' | 'RL' | 'RL_FD' | 'RLE' | 'RC';

export interface ConverterParams {
  topology: ConverterTopology;
  loadType: LoadType;
  // AC / Source parameters
  vSupplyRms: number; // Volts RMS for AC, or DC Vin for Buck/Boost/Inverter
  frequency: number;  // Hz (supply frequency for AC, e.g. 50Hz)
  firingAngle: number; // degrees (alpha: 0 - 180) for SCRs
  
  // Load parameters
  resistance: number; // Ohms
  inductance: number; // mH
  capacitance: number; // uF
  backEmf: number;     // Volts (DC battery E)
  hasFreewheelingDiode: boolean;

  // DC-DC / Inverter parameters
  dutyCycle: number;   // 0.05 to 0.95
  switchingFreq: number; // kHz
  inverterModulation: 'square' | 'spwm';
  modulationIndex: number; // 0.1 to 1.2
}

export const CONVERTER_TOPOLOGY_DEFAULTS: Record<ConverterTopology, ConverterParams> = {
  half_wave_uncontrolled: {
    topology: 'half_wave_uncontrolled',
    loadType: 'R',
    vSupplyRms: 230,
    frequency: 50,
    firingAngle: 0,
    resistance: 50,
    inductance: 0,
    capacitance: 0,
    backEmf: 0,
    hasFreewheelingDiode: false,
    dutyCycle: 0.5,
    switchingFreq: 20,
    inverterModulation: 'square',
    modulationIndex: 0.85,
  },
  half_wave_controlled: {
    topology: 'half_wave_controlled',
    loadType: 'R',
    vSupplyRms: 230,
    frequency: 50,
    firingAngle: 60,
    resistance: 40,
    inductance: 0,
    capacitance: 0,
    backEmf: 0,
    hasFreewheelingDiode: false,
    dutyCycle: 0.5,
    switchingFreq: 20,
    inverterModulation: 'square',
    modulationIndex: 0.85,
  },
  full_wave_bridge_uncontrolled: {
    topology: 'full_wave_bridge_uncontrolled',
    loadType: 'R',
    vSupplyRms: 230,
    frequency: 50,
    firingAngle: 0,
    resistance: 50,
    inductance: 0,
    capacitance: 0,
    backEmf: 0,
    hasFreewheelingDiode: false,
    dutyCycle: 0.5,
    switchingFreq: 20,
    inverterModulation: 'square',
    modulationIndex: 0.85,
  },
  full_wave_bridge_controlled: {
    topology: 'full_wave_bridge_controlled',
    loadType: 'RL',
    vSupplyRms: 230,
    frequency: 50,
    firingAngle: 45,
    resistance: 30,
    inductance: 80,
    capacitance: 0,
    backEmf: 0,
    hasFreewheelingDiode: false,
    dutyCycle: 0.5,
    switchingFreq: 20,
    inverterModulation: 'square',
    modulationIndex: 0.85,
  },
  semi_controlled_bridge: {
    topology: 'semi_controlled_bridge',
    loadType: 'RL',
    vSupplyRms: 230,
    frequency: 50,
    firingAngle: 60,
    resistance: 35,
    inductance: 70,
    capacitance: 0,
    backEmf: 0,
    hasFreewheelingDiode: false,
    dutyCycle: 0.5,
    switchingFreq: 20,
    inverterModulation: 'square',
    modulationIndex: 0.85,
  },
  buck_converter: {
    topology: 'buck_converter',
    loadType: 'RL',
    vSupplyRms: 48,
    frequency: 50,
    firingAngle: 0,
    resistance: 20,
    inductance: 1.5, // 1.5 mH
    capacitance: 100, // 100 uF
    backEmf: 0,
    hasFreewheelingDiode: true,
    dutyCycle: 0.5,
    switchingFreq: 20,
    inverterModulation: 'square',
    modulationIndex: 0.85,
  },
  boost_converter: {
    topology: 'boost_converter',
    loadType: 'RL',
    vSupplyRms: 24,
    frequency: 50,
    firingAngle: 0,
    resistance: 40,
    inductance: 2.0, // 2.0 mH
    capacitance: 150, // 150 uF
    backEmf: 0,
    hasFreewheelingDiode: true,
    dutyCycle: 0.6,
    switchingFreq: 25,
    inverterModulation: 'square',
    modulationIndex: 0.85,
  },
  inverter_full_bridge: {
    topology: 'inverter_full_bridge',
    loadType: 'RL',
    vSupplyRms: 100,
    frequency: 50,
    firingAngle: 0,
    resistance: 25,
    inductance: 30,
    capacitance: 0,
    backEmf: 0,
    hasFreewheelingDiode: false,
    dutyCycle: 0.5,
    switchingFreq: 20,
    inverterModulation: 'spwm',
    modulationIndex: 0.85,
  },
};

export interface SimulationSample {
  time: number;       // milliseconds
  angleDeg: number;   // omega * t in degrees (for AC)
  vSource: number;    // Input supply voltage (V)
  vOutput: number;    // Output / load voltage (V)
  iLoad: number;      // Load current (A)
  vDevice: number;    // Main device voltage (Thyristor / Diode) (V)
  gatePulse: number;  // Gate signal (0 or 1, or 0V / 10V)
  iSource: number;    // Source current (A)
  iDiode?: number;    // Diode / freewheeling current (A)
}

export interface ConductingDeviceState {
  d1?: boolean;
  d2?: boolean;
  d3?: boolean;
  d4?: boolean;
  t1?: boolean;
  t2?: boolean;
  t3?: boolean;
  t4?: boolean;
  s1?: boolean;
  s2?: boolean;
  s3?: boolean;
  s4?: boolean;
  fd?: boolean; // Freewheeling diode
  currentLoop: 'positive' | 'negative' | 'freewheeling' | 'off' | 'charge' | 'discharge';
}

export interface CalculatedMetrics {
  vAvg: number;           // V_dc (Average Output Voltage)
  vRms: number;           // V_rms (RMS Output Voltage)
  iAvg: number;           // I_dc (Average Load Current)
  iRms: number;           // I_rms (RMS Load Current)
  activePower: number;    // Watts (P = avg(v_o * i_o))
  apparentPower: number;  // VA (S = V_s,rms * I_s,rms)
  powerFactor: number;    // PF = P / S
  formFactor: number;     // FF = V_rms / V_avg
  rippleFactor: number;   // RF = sqrt(FF^2 - 1)
  rippleVoltage: number;  // V_ac,rms
  efficiency: number;     // % (P_dc / P_ac * 100)
  extinctionAngle: number; // beta in degrees (for RL rectifiers)
  conductionAngle: number; // gamma = beta - alpha (in degrees)
  isContinuous: boolean;  // CCM vs DCM
  piv: number;            // Peak Inverse Voltage across device (V)
  theoreticalVavg: number;
  theoreticalVrms: number;
  formulaStr: string;
}

export interface ExperimentPreset {
  id: string;
  title: string;
  category: 'Rectifiers' | 'DC-DC' | 'Inverters';
  description: string;
  params: Partial<ConverterParams>;
  objective: string;
}
