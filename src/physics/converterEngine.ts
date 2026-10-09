import {
  CalculatedMetrics,
  ConductingDeviceState,
  ConverterParams,
  SimulationSample,
} from '../types/converter';

/**
 * Solve extinction angle beta for RL load with SCR/Diode
 * Equation: sin(beta - phi) - sin(alpha - phi) * exp(- (beta - alpha) / tan(phi)) = 0
 */
export function solveExtinctionAngle(alphaRad: number, phiRad: number): number {
  const tanPhi = Math.tan(phiRad);
  if (tanPhi <= 1e-4) {
    // Pure resistive load: beta = pi
    return Math.PI;
  }

  const f = (beta: number) => {
    return Math.sin(beta - phiRad) - Math.sin(alphaRad - phiRad) * Math.exp(-(beta - alphaRad) / tanPhi);
  };

  // Beta lies between max(pi, alpha) and 2*pi
  let low = Math.max(Math.PI, alphaRad);
  let high = 2 * Math.PI;

  // Bisection search
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const val = f(mid);
    if (Math.abs(val) < 1e-5) return mid;
    if (f(low) * val < 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Main simulation solver: generates samples across 2 full periods for AC,
 * or 4 switching periods for DC-DC.
 */
export function simulateConverter(params: ConverterParams): {
  samples: SimulationSample[];
  metrics: CalculatedMetrics;
  periodMs: number;
} {
  const {
    topology,
    loadType,
    vSupplyRms,
    frequency,
    firingAngle,
    resistance: R_load,
    inductance: L_mH,
    capacitance: C_uF,
    backEmf: E_val,
    hasFreewheelingDiode,
    dutyCycle,
    switchingFreq,
    inverterModulation,
    modulationIndex,
  } = params;

  const R = Math.max(0.5, R_load);
  const L = Math.max(0, L_mH * 1e-3); // Henries
  const C = Math.max(0, C_uF * 1e-6); // Farads
  const E = Math.max(0, E_val);       // Back-EMF V
  const alphaRad = (firingAngle * Math.PI) / 180;

  // Decide time window
  let totalTimeSec: number;
  let periodSec: number;
  const numSamples = 1000;

  if (topology === 'buck_converter' || topology === 'boost_converter') {
    const fs = Math.max(1000, switchingFreq * 1000); // Hz
    periodSec = 1 / fs;
    totalTimeSec = periodSec * 4; // 4 switching cycles
  } else {
    // AC converters or Inverter
    const f = Math.max(10, frequency || 50);
    periodSec = 1 / f;
    totalTimeSec = periodSec * 2; // 2 AC cycles
  }

  const dt = totalTimeSec / numSamples;
  const samples: SimulationSample[] = [];

  // Vm peak for AC
  const Vm = vSupplyRms * Math.sqrt(2);
  const omega = 2 * Math.PI * (frequency || 50);
  const phi = Math.atan2(omega * L, R);
  const Z = Math.sqrt(R * R + (omega * L) * (omega * L));

  // --- Topology Specific Simulations ---
  if (topology === 'half_wave_uncontrolled' || topology === 'half_wave_controlled') {
    const alpha = topology === 'half_wave_uncontrolled' ? 0 : alphaRad;
    const beta = loadType === 'R' ? Math.PI : solveExtinctionAngle(alpha, phi);
    const useFD = hasFreewheelingDiode || loadType === 'RL_FD';

    // Warm-up pass for periodic steady state
    let current_i = 0;
    const warmupSteps = 500;
    for (let w = 0; w < warmupSteps; w++) {
      const t = w * dt;
      const angle = (omega * t) % (2 * Math.PI);
      const vs = Vm * Math.sin(omega * t);
      let vo = 0;
      if (loadType === 'R') {
        vo = (angle >= alpha && angle <= Math.PI && vs > E) ? vs : E;
        current_i = Math.max(0, (vo - E) / R);
      } else if (useFD) {
        if (angle >= alpha && angle <= Math.PI && vs > E) vo = vs;
        else if (angle > Math.PI && current_i > 0.005) vo = 0;
        else vo = E;
        const vL = vo - R * current_i - E;
        if (L > 0) current_i = Math.max(0, current_i + (vL / L) * dt);
      } else {
        if (angle >= alpha && angle <= beta) vo = vs;
        else vo = E;
        const vL = vo - R * current_i - E;
        if (L > 0) current_i = Math.max(0, current_i + (vL / L) * dt);
      }
    }

    for (let step = 0; step < numSamples; step++) {
      const t = step * dt;
      const angle = (omega * t) % (2 * Math.PI);
      const angleDeg = (angle * 180) / Math.PI;
      const vs = Vm * Math.sin(omega * t);

      let vo = 0;
      let gate = 0;
      let isConducting = false;

      // Gate pulse around alpha
      if (topology === 'half_wave_controlled') {
        const cycleAngle = angle;
        if (cycleAngle >= alpha && cycleAngle <= alpha + 0.15) {
          gate = 10;
        }
      }

      if (loadType === 'R') {
        if (angle >= alpha && angle <= Math.PI && vs > E) {
          vo = vs;
          current_i = Math.max(0, (vo - E) / R);
          isConducting = true;
        } else {
          vo = E;
          current_i = 0;
        }
      } else if (useFD) {
        if (angle >= alpha && angle <= Math.PI && vs > E) {
          vo = vs;
          isConducting = true;
        } else if (angle > Math.PI && current_i > 0.005) {
          vo = 0;
        } else {
          vo = E;
        }
        const vL = vo - R * current_i - E;
        if (L > 0) current_i = Math.max(0, current_i + (vL / L) * dt);
        else current_i = Math.max(0, (vo - E) / R);
      } else {
        if (angle >= alpha && angle <= beta) {
          vo = vs;
          isConducting = true;
        } else {
          vo = E;
        }
        const vL = vo - R * current_i - E;
        if (L > 0) current_i = Math.max(0, current_i + (vL / L) * dt);
        else current_i = Math.max(0, (vo - E) / R);
      }

      const vDevice = isConducting ? 0 : vs - vo;
      const iSource = isConducting ? current_i : 0;

      samples.push({
        time: t * 1000,
        angleDeg,
        vSource: vs,
        vOutput: vo,
        iLoad: current_i,
        vDevice,
        gatePulse: gate,
        iSource,
        iDiode: useFD && angle > Math.PI && current_i > 0 ? current_i : 0,
      });
    }
  } else if (topology === 'full_wave_bridge_uncontrolled') {
    // 4 Diodes Bridge: D1, D2 in pos half; D3, D4 in neg half
    let current_i = 0;
    let v_cap = 0;

    // Warm-up pass
    for (let w = 0; w < 500; w++) {
      const t = w * dt;
      const vs = Vm * Math.sin(omega * t);
      const rectifiedVs = Math.abs(vs);
      if (loadType === 'RC' && C > 0) {
        if (rectifiedVs >= v_cap) v_cap = rectifiedVs;
        else v_cap -= (v_cap / (R * C)) * dt;
        current_i = v_cap / R;
      } else {
        const vL = rectifiedVs - R * current_i - E;
        if (L > 0) current_i = Math.max(0, current_i + (vL / L) * dt);
        else current_i = Math.max(0, (rectifiedVs - E) / R);
      }
    }

    for (let step = 0; step < numSamples; step++) {
      const t = step * dt;
      const angle = (omega * t) % (2 * Math.PI);
      const angleDeg = (angle * 180) / Math.PI;
      const vs = Vm * Math.sin(omega * t);
      const rectifiedVs = Math.abs(vs);

      let vo = 0;
      let i_load = 0;

      if (loadType === 'RC' && C > 0) {
        if (rectifiedVs >= v_cap) {
          v_cap = rectifiedVs;
        } else {
          v_cap -= (v_cap / (R * C)) * dt;
        }
        vo = Math.max(0, v_cap);
        i_load = vo / R;
      } else if (loadType === 'R') {
        vo = rectifiedVs;
        i_load = Math.max(0, (vo - E) / R);
      } else {
        vo = rectifiedVs;
        const vL = vo - R * current_i - E;
        if (L > 0) current_i = Math.max(0, current_i + (vL / L) * dt);
        else current_i = Math.max(0, (vo - E) / R);
        i_load = current_i;
      }

      const vDevice = vs >= 0 ? 0 : -rectifiedVs;
      const iSource = vs >= 0 ? i_load : -i_load;

      samples.push({
        time: t * 1000,
        angleDeg,
        vSource: vs,
        vOutput: vo,
        iLoad: i_load,
        vDevice,
        gatePulse: 0,
        iSource,
      });
    }
  } else if (topology === 'full_wave_bridge_controlled') {
    // 4 SCRs: T1, T2 at alpha; T3, T4 at pi + alpha
    let current_i = 0;
    const isHighlyInductive = L > 0.01;

    // Warm-up pass
    for (let w = 0; w < 600; w++) {
      const t = w * dt;
      const angle = (omega * t) % (2 * Math.PI);
      const vs = Vm * Math.sin(omega * t);
      let vo = 0;
      if (loadType === 'R') {
        if (angle >= alphaRad && angle <= Math.PI) vo = vs;
        else if (angle >= Math.PI + alphaRad && angle <= 2 * Math.PI) vo = -vs;
        else vo = 0;
        current_i = Math.max(0, (vo - E) / R);
      } else {
        if (isHighlyInductive) {
          vo = (angle >= alphaRad && angle < Math.PI + alphaRad) ? vs : -vs;
        } else {
          const beta = solveExtinctionAngle(alphaRad, phi);
          if (angle >= alphaRad && angle <= beta) vo = vs;
          else if (angle >= Math.PI + alphaRad && angle <= Math.PI + beta) vo = -vs;
          else vo = 0;
        }
        const vL = vo - R * current_i - E;
        if (L > 0) current_i = Math.max(0, current_i + (vL / L) * dt);
        else current_i = Math.max(0, (vo - E) / R);
      }
    }

    for (let step = 0; step < numSamples; step++) {
      const t = step * dt;
      const angle = (omega * t) % (2 * Math.PI);
      const angleDeg = (angle * 180) / Math.PI;
      const vs = Vm * Math.sin(omega * t);

      let vo = 0;
      let gate = 0;

      // Gate pulses at alpha and pi + alpha
      if (
        (angle >= alphaRad && angle <= alphaRad + 0.12) ||
        (angle >= Math.PI + alphaRad && angle <= Math.PI + alphaRad + 0.12)
      ) {
        gate = 10;
      }

      if (loadType === 'R') {
        if (angle >= alphaRad && angle <= Math.PI) {
          vo = vs;
        } else if (angle >= Math.PI + alphaRad && angle <= 2 * Math.PI) {
          vo = -vs;
        } else {
          vo = 0;
        }
        current_i = Math.max(0, (vo - E) / R);
      } else {
        if (isHighlyInductive) {
          vo = (angle >= alphaRad && angle < Math.PI + alphaRad) ? vs : -vs;
        } else {
          const beta = solveExtinctionAngle(alphaRad, phi);
          if (angle >= alphaRad && angle <= beta) {
            vo = vs;
          } else if (angle >= Math.PI + alphaRad && angle <= Math.PI + beta) {
            vo = -vs;
          } else {
            vo = 0;
          }
        }

        const vL = vo - R * current_i - E;
        if (L > 0) current_i = Math.max(0, current_i + (vL / L) * dt);
        else current_i = Math.max(0, (vo - E) / R);
      }

      const vDevice = (angle >= alphaRad && angle <= Math.PI) ? 0 : vs - vo;
      const iSource = (angle >= alphaRad && angle < Math.PI + alphaRad) ? current_i : -current_i;

      samples.push({
        time: t * 1000,
        angleDeg,
        vSource: vs,
        vOutput: vo,
        iLoad: current_i,
        vDevice,
        gatePulse: gate,
        iSource,
      });
    }
  } else if (topology === 'semi_controlled_bridge') {
    // 2 SCRs + 2 Diodes: Vo >= 0 always
    let current_i = 0;

    for (let step = 0; step < numSamples; step++) {
      const t = step * dt;
      const angle = (omega * t) % (2 * Math.PI);
      const angleDeg = (angle * 180) / Math.PI;
      const vs = Vm * Math.sin(omega * t);

      let vo = 0;
      let gate = 0;
      let i_fd = 0;

      if (
        (angle >= alphaRad && angle <= alphaRad + 0.12) ||
        (angle >= Math.PI + alphaRad && angle <= Math.PI + alphaRad + 0.12)
      ) {
        gate = 10;
      }

      if (angle >= alphaRad && angle <= Math.PI) {
        vo = vs;
      } else if (angle > Math.PI && angle < Math.PI + alphaRad) {
        vo = 0;
        i_fd = current_i;
      } else if (angle >= Math.PI + alphaRad && angle <= 2 * Math.PI) {
        vo = -vs;
      } else {
        vo = 0;
        i_fd = current_i;
      }

      const vL = vo - R * current_i - E;
      if (L > 0) current_i = Math.max(0, current_i + (vL / L) * dt);
      else current_i = Math.max(0, (vo - E) / R);

      const vDevice = (angle >= alphaRad && angle <= Math.PI) ? 0 : vs;
      let iSource = 0;
      if (angle >= alphaRad && angle <= Math.PI) iSource = current_i;
      else if (angle >= Math.PI + alphaRad && angle <= 2 * Math.PI) iSource = -current_i;

      samples.push({
        time: t * 1000,
        angleDeg,
        vSource: vs,
        vOutput: vo,
        iLoad: current_i,
        vDevice,
        gatePulse: gate,
        iSource,
        iDiode: i_fd,
      });
    }
  } else if (topology === 'buck_converter') {
    // DC-DC Step Down: Vin = vSupplyRms (e.g. 48V DC)
    const Vin = Math.max(5, vSupplyRms);
    const fs = Math.max(1000, switchingFreq * 1000);
    const Ts = 1 / fs;
    const D = Math.max(0.05, Math.min(0.95, dutyCycle));
    const targetVo = D * Vin;

    // Inductor ripple calculation
    const deltaIL = L > 0 ? ((Vin - targetVo) * D) / (fs * L) : targetVo / R;
    const Iavg = targetVo / R;
    const isCCM = Iavg > deltaIL / 2;

    for (let step = 0; step < numSamples; step++) {
      const t = step * dt;
      const t_cycle = t % Ts;
      const switchOn = t_cycle < D * Ts;

      const gate = switchOn ? 10 : 0;
      const vSwitch = switchOn ? 0 : Vin;
      let i_L = 0;

      if (isCCM) {
        const slopeUp = (Vin - targetVo) / (L || 0.001);
        const slopeDown = -targetVo / (L || 0.001);
        const Imin = Math.max(0.05, Iavg - deltaIL / 2);
        if (switchOn) {
          i_L = Imin + slopeUp * t_cycle;
        } else {
          i_L = (Imin + deltaIL) + slopeDown * (t_cycle - D * Ts);
        }
      } else {
        const d2 = Math.min(1 - D, (2 * Iavg * fs * L) / (Vin - targetVo || 1));
        if (switchOn) {
          i_L = ((Vin - targetVo) / (L || 0.001)) * t_cycle;
        } else if (t_cycle < (D + d2) * Ts) {
          i_L = Math.max(0, deltaIL - (targetVo / (L || 0.001)) * (t_cycle - D * Ts));
        } else {
          i_L = 0;
        }
      }

      const voRipple = C > 0 ? (deltaIL / (8 * fs * C)) * Math.sin(2 * Math.PI * fs * t) : 0;
      const vo = Math.max(0, targetVo + voRipple);

      samples.push({
        time: t * 1000,
        angleDeg: (t / Ts) * 360,
        vSource: Vin,
        vOutput: vo,
        iLoad: i_L,
        vDevice: vSwitch,
        gatePulse: gate,
        iSource: switchOn ? i_L : 0,
        iDiode: !switchOn ? i_L : 0,
      });
    }
  } else if (topology === 'boost_converter') {
    // DC-DC Step Up: Vin = vSupplyRms (e.g. 24V DC)
    const Vin = Math.max(5, vSupplyRms);
    const fs = Math.max(1000, switchingFreq * 1000);
    const Ts = 1 / fs;
    const D = Math.max(0.05, Math.min(0.9, dutyCycle));
    const targetVo = Vin / (1 - D);

    const deltaIL = L > 0 ? (Vin * D) / (fs * L) : targetVo / R;
    const Iavg = (targetVo * targetVo) / (R * Vin);

    for (let step = 0; step < numSamples; step++) {
      const t = step * dt;
      const t_cycle = t % Ts;
      const switchOn = t_cycle < D * Ts;

      const gate = switchOn ? 10 : 0;
      const vSwitch = switchOn ? 0 : targetVo;
      let i_L = 0;

      const Imin = Math.max(0.05, Iavg - deltaIL / 2);
      if (switchOn) {
        i_L = Imin + (Vin / (L || 0.001)) * t_cycle;
      } else {
        i_L = (Imin + deltaIL) + ((Vin - targetVo) / (L || 0.001)) * (t_cycle - D * Ts);
      }
      if (i_L < 0) i_L = 0;

      const voRipple = C > 0 ? ((targetVo / R) * D / (fs * C)) * Math.sin(2 * Math.PI * fs * t) : 0;
      const vo = Math.max(Vin, targetVo + voRipple);

      samples.push({
        time: t * 1000,
        angleDeg: (t / Ts) * 360,
        vSource: Vin,
        vOutput: vo,
        iLoad: i_L,
        vDevice: vSwitch,
        gatePulse: gate,
        iSource: i_L,
        iDiode: !switchOn ? i_L : 0,
      });
    }
  } else {
    // inverter_full_bridge: DC to AC
    const Vdc = Math.max(10, vSupplyRms);
    const f_out = frequency || 50;
    const T_out = 1 / f_out;
    const omega_inv = 2 * Math.PI * f_out;

    let current_i = 0;

    // Warm-up pass
    for (let w = 0; w < 500; w++) {
      const t = w * dt;
      const t_cycle = t % T_out;
      let vo = 0;
      if (inverterModulation === 'square') {
        vo = t_cycle < T_out / 2 ? Vdc : -Vdc;
      } else {
        const ma = modulationIndex || 0.85;
        const mf = 21;
        const vRef = ma * Math.sin(omega_inv * t);
        const vCarrier = Math.asin(Math.sin(2 * Math.PI * mf * f_out * t)) * (2 / Math.PI);
        vo = vRef >= vCarrier ? Vdc : -Vdc;
      }
      const vL = vo - R * current_i;
      if (L > 0) current_i += (vL / L) * dt;
      else current_i = vo / R;
    }

    for (let step = 0; step < numSamples; step++) {
      const t = step * dt;
      const t_cycle = t % T_out;
      const angle = (omega_inv * t) % (2 * Math.PI);
      const angleDeg = (angle * 180) / Math.PI;

      let vo = 0;
      let gate = 0;

      if (inverterModulation === 'square') {
        if (t_cycle < T_out / 2) {
          vo = Vdc;
          gate = 10;
        } else {
          vo = -Vdc;
          gate = 0;
        }
      } else {
        const ma = modulationIndex || 0.85;
        const mf = 21;
        const vRef = ma * Math.sin(omega_inv * t);
        const vCarrier = Math.asin(Math.sin(2 * Math.PI * mf * f_out * t)) * (2 / Math.PI);
        if (vRef >= vCarrier) {
          vo = Vdc;
          gate = 10;
        } else {
          vo = -Vdc;
          gate = 0;
        }
      }

      const vL = vo - R * current_i;
      if (L > 0) current_i += (vL / L) * dt;
      else current_i = vo / R;

      samples.push({
        time: t * 1000,
        angleDeg,
        vSource: Vdc,
        vOutput: vo,
        iLoad: current_i,
        vDevice: vo === Vdc ? 0 : 2 * Vdc,
        gatePulse: gate,
        iSource: Math.abs(current_i),
      });
    }
  }

  // --- Calculate Metrics over full window ---
  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumPower = 0;
  let sumVsSq = 0;
  let sumIsSq = 0;
  let maxVdevice = 0;
  let minIo = Infinity;

  const N = samples.length;
  for (let i = 0; i < N; i++) {
    const s = samples[i];
    sumVo += s.vOutput;
    sumVoSq += s.vOutput * s.vOutput;
    sumIo += s.iLoad;
    sumIoSq += s.iLoad * s.iLoad;
    sumPower += s.vOutput * s.iLoad;
    sumVsSq += s.vSource * s.vSource;
    sumIsSq += s.iSource * s.iSource;
    if (Math.abs(s.vDevice) > maxVdevice) {
      maxVdevice = Math.abs(s.vDevice);
    }
    if (s.iLoad < minIo) {
      minIo = s.iLoad;
    }
  }

  const vAvg = sumVo / N;
  const vRms = Math.sqrt(sumVoSq / N);
  const iAvg = sumIo / N;
  const iRms = Math.sqrt(sumIoSq / N);
  const activePower = sumPower / N;
  const vSourceRms = Math.sqrt(sumVsSq / N);
  const iSourceRms = Math.sqrt(sumIsSq / N);
  const apparentPower = Math.max(1e-4, vSourceRms * iSourceRms);
  const powerFactor = Math.min(1.0, Math.max(0, activePower / apparentPower));

  const formFactor = Math.abs(vAvg) > 1e-3 ? vRms / Math.abs(vAvg) : 0;
  const rippleFactor = formFactor >= 1 ? Math.sqrt(Math.max(0, formFactor * formFactor - 1)) : 0;
  const rippleVoltage = Math.sqrt(Math.max(0, vRms * vRms - vAvg * vAvg));
  const pDc = vAvg * iAvg;
  const efficiency = activePower > 1e-3 ? Math.min(100, Math.max(0, (pDc / activePower) * 100)) : 0;

  // Extinction & Conduction angle
  let betaDeg = 180;
  let gammaDeg = 180 - firingAngle;
  if (topology === 'half_wave_controlled' || topology === 'half_wave_uncontrolled') {
    const a = topology === 'half_wave_uncontrolled' ? 0 : firingAngle;
    if (loadType === 'R') {
      betaDeg = 180;
    } else {
      betaDeg = (solveExtinctionAngle((a * Math.PI) / 180, phi) * 180) / Math.PI;
    }
    gammaDeg = Math.max(0, betaDeg - a);
  }

  // Theoretical values & Formula String
  let theoVavg = 0;
  let theoVrms = 0;
  let formulaStr = '';

  const cosA = Math.cos(alphaRad);
  const sin2A = Math.sin(2 * alphaRad);

  switch (topology) {
    case 'half_wave_uncontrolled':
      theoVavg = Vm / Math.PI;
      theoVrms = Vm / 2;
      formulaStr = 'V_{dc} = \\frac{V_m}{\\pi} \\approx 0.318 V_m, \\quad V_{rms} = \\frac{V_m}{2} = 0.5 V_m';
      break;
    case 'half_wave_controlled':
      theoVavg = (Vm / (2 * Math.PI)) * (1 + cosA);
      theoVrms = (Vm / 2) * Math.sqrt(Math.max(0, (Math.PI - alphaRad + sin2A / 2) / Math.PI));
      formulaStr = 'V_{dc} = \\frac{V_m}{2\\pi}(1+\\cos\\alpha), \\quad V_{rms} = \\frac{V_m}{2}\\sqrt{1 - \\frac{\\alpha}{\\pi} + \\frac{\\sin 2\\alpha}{2\\pi}}';
      break;
    case 'full_wave_bridge_uncontrolled':
      theoVavg = (2 * Vm) / Math.PI;
      theoVrms = Vm / Math.sqrt(2);
      formulaStr = 'V_{dc} = \\frac{2V_m}{\\pi} \\approx 0.636 V_m, \\quad V_{rms} = \\frac{V_m}{\\sqrt{2}} \\approx 0.707 V_m';
      break;
    case 'full_wave_bridge_controlled':
      theoVavg = loadType === 'R' ? (Vm / Math.PI) * (1 + cosA) : (2 * Vm / Math.PI) * cosA;
      theoVrms = Vm / Math.sqrt(2);
      formulaStr = loadType === 'R' 
        ? 'V_{dc} = \\frac{V_m}{\\pi}(1+\\cos\\alpha) \\; (\\text{R Load})'
        : 'V_{dc} = \\frac{2V_m}{\\pi}\\cos\\alpha \\; (\\text{CCM Highly Inductive})';
      break;
    case 'semi_controlled_bridge':
      theoVavg = (Vm / Math.PI) * (1 + cosA);
      theoVrms = Vm * Math.sqrt(Math.max(0, (Math.PI - alphaRad + sin2A / 2) / (2 * Math.PI)));
      formulaStr = 'V_{dc} = \\frac{V_m}{\\pi}(1+\\cos\\alpha), \\quad V_{rms} = V_m \\sqrt{\\frac{1}{2\\pi}(\\pi - \\alpha + \\frac{\\sin 2\\alpha}{2})}';
      break;
    case 'buck_converter':
      theoVavg = dutyCycle * vSupplyRms;
      theoVrms = theoVavg;
      formulaStr = 'V_o = D \\cdot V_{in}, \\quad \\Delta I_L = \\frac{(V_{in} - V_o)D}{f_s L}';
      break;
    case 'boost_converter':
      theoVavg = vSupplyRms / (1 - dutyCycle);
      theoVrms = theoVavg;
      formulaStr = 'V_o = \\frac{V_{in}}{1 - D}, \\quad \\Delta V_o = \\frac{I_o D}{f_s C}';
      break;
    case 'inverter_full_bridge':
      if (inverterModulation === 'square') {
        theoVavg = 0;
        theoVrms = vSupplyRms;
        formulaStr = 'V_{o1,rms} = \\frac{4 V_{dc}}{\\sqrt{2}\\pi} \\approx 0.90 V_{dc}, \\quad V_{rms} = V_{dc}';
      } else {
        theoVavg = 0;
        theoVrms = (modulationIndex * vSupplyRms) / Math.sqrt(2);
        formulaStr = 'V_{o1,rms} = m_a \\cdot \\frac{V_{dc}}{\\sqrt{2}} \\approx 0.707 m_a V_{dc}';
      }
      break;
  }

  const isContinuous = minIo > 0.05;

  return {
    samples,
    metrics: {
      vAvg,
      vRms,
      iAvg,
      iRms,
      activePower,
      apparentPower,
      powerFactor,
      formFactor,
      rippleFactor,
      rippleVoltage,
      efficiency,
      extinctionAngle: betaDeg,
      conductionAngle: gammaDeg,
      isContinuous,
      piv: maxVdevice || Vm,
      theoreticalVavg: theoVavg,
      theoreticalVrms: theoVrms,
      formulaStr,
    },
    periodMs: periodSec * 1000,
  };
}

/**
 * Determine instantaneous conducting states of components at given sample
 */
export function getConductingState(
  sample: SimulationSample,
  params: ConverterParams
): ConductingDeviceState {
  const { topology, firingAngle, hasFreewheelingDiode, loadType } = params;
  const vs = sample.vSource;
  const vo = sample.vOutput;
  const io = sample.iLoad;
  const angle = sample.angleDeg;
  const alpha = firingAngle;

  const state: ConductingDeviceState = {
    currentLoop: 'off',
  };

  if (topology === 'half_wave_uncontrolled') {
    const isDiodeOn = io > 0.05 && (vo > 0.1 || vs >= 0);
    const isFdOn = (hasFreewheelingDiode || loadType === 'RL_FD') && vs < 0 && io > 0.05;
    state.d1 = isDiodeOn && !isFdOn;
    state.fd = isFdOn;
    state.currentLoop = isFdOn ? 'freewheeling' : isDiodeOn ? 'positive' : 'off';
  } else if (topology === 'half_wave_controlled') {
    const isScrOn = io > 0.05 && (vo > 0.1 || vs >= 0);
    const isFdOn = (hasFreewheelingDiode || loadType === 'RL_FD') && vs < 0 && io > 0.05;
    state.t1 = isScrOn && !isFdOn;
    state.fd = isFdOn;
    state.currentLoop = isFdOn ? 'freewheeling' : isScrOn ? 'positive' : 'off';
  } else if (topology === 'full_wave_bridge_uncontrolled') {
    if (vs > 0.5) {
      state.d1 = true;
      state.d2 = true;
      state.currentLoop = 'positive';
    } else if (vs < -0.5) {
      state.d3 = true;
      state.d4 = true;
      state.currentLoop = 'negative';
    }
  } else if (topology === 'full_wave_bridge_controlled') {
    if (angle >= alpha && angle < 180 + alpha) {
      state.t1 = io > 0.05;
      state.t2 = io > 0.05;
      state.currentLoop = 'positive';
    } else {
      state.t3 = io > 0.05;
      state.t4 = io > 0.05;
      state.currentLoop = 'negative';
    }
  } else if (topology === 'semi_controlled_bridge') {
    if (angle >= alpha && angle <= 180) {
      state.t1 = true;
      state.d1 = true;
      state.currentLoop = 'positive';
    } else if (angle > 180 && angle < 180 + alpha) {
      state.d1 = true;
      state.d2 = true;
      state.fd = true;
      state.currentLoop = 'freewheeling';
    } else if (angle >= 180 + alpha && angle <= 360) {
      state.t2 = true;
      state.d2 = true;
      state.currentLoop = 'negative';
    } else {
      state.d1 = true;
      state.d2 = true;
      state.fd = true;
      state.currentLoop = 'freewheeling';
    }
  } else if (topology === 'buck_converter') {
    const switchOn = sample.gatePulse > 1;
    state.s1 = switchOn;
    state.d1 = !switchOn && io > 0.05;
    state.currentLoop = switchOn ? 'charge' : state.d1 ? 'freewheeling' : 'off';
  } else if (topology === 'boost_converter') {
    const switchOn = sample.gatePulse > 1;
    state.s1 = switchOn;
    state.d1 = !switchOn && io > 0.05;
    state.currentLoop = switchOn ? 'charge' : 'discharge';
  } else if (topology === 'inverter_full_bridge') {
    if (vo > 0.5) {
      state.s1 = true;
      state.s2 = true;
      state.currentLoop = 'positive';
    } else if (vo < -0.5) {
      state.s3 = true;
      state.s4 = true;
      state.currentLoop = 'negative';
    }
  }

  return state;
}
