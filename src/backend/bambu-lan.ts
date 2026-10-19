import net from 'node:net';
import tls from 'node:tls';
import dgram from 'node:dgram';

export interface BambuDiscoveredPrinter {
  ip: string;
  serial: string;
  name: string;
  model: string;
  firmware: string;
  connectMode: string;
  bindStatus: string;
  signalDbm: string;
  ports: {
    mqttTls8883: boolean;
    ftps990: boolean;
    chamberStream6000: boolean;
    rtsps322: boolean;
  };
  tlsCertificateSubject?: string;
  discoveryMethod: 'ssdp_multicast' | 'tcp_8883_tls_probe' | 'configured_profile';
  discoveredAt: string;
}

export interface BambuPrinterConfig {
  ip: string;
  serial: string;
  accessCode: string;
  model: string;
  name: string;
  nozzleDiameterMm: number;
  bedDimensionsMm: [number, number, number];
  shellyPowerEntityId: string;
  lanOnlyMode: boolean;
}

export interface BambuLiveTelemetry {
  connected: boolean;
  connectionMode: 'lan_mqtt_tls' | 'digital_twin_simulation' | 'standby_offline';
  printerState: 'IDLE' | 'PREPARE' | 'RUNNING' | 'PAUSE' | 'FINISH' | 'FAILED' | 'OFFLINE';
  subtaskName: string;
  progressPercent: number;
  currentLayer: number;
  totalLayers: number;
  remainingMinutes: number;
  nozzleTempC: number;
  nozzleTargetTempC: number;
  bedTempC: number;
  bedTargetTempC: number;
  chamberTempC: number;
  speedLevel: 1 | 2 | 3 | 4; // 1=Silent, 2=Standard, 3=Sport, 4=Ludicrous
  chamberLightOn: boolean;
  fanSpeedPercent: number;
  activeProjectId: string | null;
  lastUpdated: string;
  lastMessage: string;
}

export const BAMBU_API_SPECIFICATION = {
  manufacturer: 'Bambu Lab',
  detectedProfileModel: 'Bambu X1C WHG — Bambu Lab X1-Carbon (BL-P001 · 192.168.188.175 · SN 00M09A391700992 · FW 01.11.02.00)',
  localSubnet: '192.168.188.0/24 (Fritz!Box 6890 LTE · Obi-WLAN Kenobi)',
  discoveryProtocol: {
    protocol: 'SSDP over UDP Multicast / Broadcast',
    multicastAddress: '239.255.255.250',
    udpPorts: [2021, 1990, 1900],
    searchTarget: 'urn:bambulab-com:device:3dprinter:1',
    headers: [
      'USN: 00M09A391700992 (Seriennummer des erkannten Bambu X1C WHG)',
      'Location: 192.168.188.175 (Lokale IPv4-Adresse im Subnetz 192.168.188.x, MAC 50:41:1C:89:3F:72)',
      'DevName.bambu.com: Bambu X1C WHG',
      'DevModel.bambu.com: BL-P001 (Bambu Lab X1-Carbon · C12 = P1S, C11 = P1P, N2S = A1, N1 = A1 mini)',
      'DevVersion.bambu.com: 01.11.02.00 (Firmware-Version)',
      'DevConnect.bambu.com: cloud / lan (DevBind: free, Devseclink: secure, Signal: -68 dBm)',
    ],
  },
  mqttTelemetryAndControl: {
    protocol: 'MQTT v3.1.1 over TLS (Self-Signed Device Certificate, CN=00M09A391700992, Issuer=BBL CA)',
    port: 8883,
    endpointTemplate: 'mqtts://bblp:<LAN_ACCESS_CODE>@192.168.188.175:8883',
    username: 'bblp',
    passwordSource: '8-stelliger LAN Access Code (Touchscreen → Einstellungen → WLAN / LAN Only Mode → Access Code)',
    tlsOptions: 'rejectUnauthorized: false (Bambu Root CA self-signed)',
    topics: {
      reportSubscribe: 'device/00M09A391700992/report',
      requestPublish: 'device/00M09A391700992/request',
    },
    payloadExamples: {
      pushAllStatus: { pushing: { sequence_id: '1', command: 'pushall' } },
      pausePrint: { print: { sequence_id: '2', command: 'pause' } },
      resumePrint: { print: { sequence_id: '3', command: 'resume' } },
      stopPrint: { print: { sequence_id: '4', command: 'stop' } },
      chamberLightToggle: {
        system: { sequence_id: '5', command: 'ledctrl', led_node: 'chamber_light', led_mode: 'on' },
      },
      setSpeedProfile: { print: { sequence_id: '6', command: 'print_speed', param: '2' } },
      sendGcodeLine: {
        print: { sequence_id: '7', command: 'gcode_line', param: 'G28\nM104 S220\nM140 S60\n' },
      },
      start3mfPrint: {
        print: {
          sequence_id: '8',
          command: 'project_file',
          param: 'Metadata/plate_1.gcode',
          url: 'ftp:///thassi_model.3mf',
          subtask_name: 'thassi_model',
          bed_type: 'auto',
          timelapse: false,
          bed_leveling: true,
          flow_cali: true,
          vibration_cali: true,
          use_ams: false,
        },
      },
    },
  },
  directFileTransferFtps: {
    protocol: 'Implicit FTPS (FTP over TLS — vsFTPd 3.0.3)',
    port: 990,
    endpointTemplate: 'ftps://bblp:<LAN_ACCESS_CODE>@192.168.188.175:990/',
    username: 'bblp',
    passwordSource: '8-stelliger LAN Access Code',
    targetDirectory: '/ (Wurzelverzeichnis der microSD-Karte) oder /cache/',
    supportedFormats: ['.3mf (mit eingebettetem G-Code/Mesh)', '.gcode'],
  },
  chamberCameraStream: {
    p1s_p1p_a1: 'TCP Port 6000 (TLS JPEG Frame Stream — auf 192.168.188.175:6000 aktiv)',
    x1c_x1e: 'RTSPS Port 322 (rtsps://bblp:<LAN_ACCESS_CODE>@192.168.188.175:322/streaming/live/1 — nach Aktivierung von Liveview/LAN-Mode am X1C)',
  },
};

export function checkTcpPort(ip: string, port: number, timeoutMs = 550): Promise<boolean> {
  return new Promise((resolve) => {
    if (!ip) return resolve(false);
    const sock = new net.Socket();
    let done = false;
    const finish = (ok: boolean) => {
      if (!done) {
        done = true;
        sock.destroy();
        resolve(ok);
      }
    };
    sock.setTimeout(timeoutMs);
    sock.on('connect', () => finish(true));
    sock.on('timeout', () => finish(false));
    sock.on('error', () => finish(false));
    sock.connect(port, ip);
  });
}

export function inspectBambuTlsCertificate(
  ip: string,
  port = 8883,
  timeoutMs = 1200
): Promise<{ ok: boolean; cn?: string; issuer?: string; isBambuCert?: boolean }> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (res: { ok: boolean; cn?: string; issuer?: string; isBambuCert?: boolean }) => {
      if (!settled) {
        settled = true;
        try {
          sock.destroy();
        } catch {}
        resolve(res);
      }
    };
    const sock = tls.connect(
      {
        host: ip,
        port,
        rejectUnauthorized: false,
        timeout: timeoutMs,
      },
      () => {
        try {
          const cert = sock.getPeerCertificate();
          const cn =
            (Array.isArray(cert?.subject?.CN) ? cert.subject.CN[0] : cert?.subject?.CN) || '';
          const issuer =
            (Array.isArray(cert?.issuer?.CN) ? cert.issuer.CN[0] : cert?.issuer?.CN) ||
            cert?.issuer?.O ||
            '';
          const isBambuCert =
            /BBL/i.test(issuer) ||
            /BBL/i.test(String(cert?.issuer?.O || '')) ||
            /^(00M|01S|01P|039|030)/i.test(cn);
          finish({ ok: true, cn, issuer, isBambuCert });
        } catch {
          finish({ ok: true });
        }
      }
    );
    sock.on('error', () => finish({ ok: false }));
    sock.setTimeout(timeoutMs, () => finish({ ok: false }));
  });
}

function mapBambuModelName(codeOrSerial: string): string {
  const c = (codeOrSerial || '').trim().toUpperCase();
  if (c === 'BL-P001' || c.startsWith('00M')) return 'Bambu Lab X1-Carbon (BL-P001)';
  if (c === 'BL-P002') return 'Bambu Lab X1 (BL-P002)';
  if (c === 'C13') return 'Bambu Lab X1E (C13)';
  if (c === 'C12' || c.startsWith('01S')) return 'Bambu Lab P1S (C12)';
  if (c === 'C11' || c.startsWith('01P')) return 'Bambu Lab P1P (C11)';
  if (c === 'N2S' || c.startsWith('039')) return 'Bambu Lab A1 (N2S)';
  if (c === 'N1' || c.startsWith('030')) return 'Bambu Lab A1 mini (N1)';
  return codeOrSerial || 'Bambu Lab 3D Printer';
}

function parseSsdpPacket(rawText: string, remoteIp: string): Partial<BambuDiscoveredPrinter> | null {
  const trimmed = rawText.trim();
  // Ignore outgoing M-SEARCH request echoes
  if (trimmed.startsWith('M-SEARCH')) {
    return null;
  }
  if (
    !trimmed.toLowerCase().includes('bambu') &&
    !trimmed.toLowerCase().includes('3dprinter')
  ) {
    return null;
  }
  const getHeader = (name: string): string => {
    const regex = new RegExp(`^${name}\\s*:\\s*(.+)$`, 'im');
    const m = trimmed.match(regex);
    return m ? m[1].trim() : '';
  };

  const usn = getHeader('USN').replace(/^uuid:/i, '').trim();
  const devName = getHeader('DevName.bambu.com');
  const devModel = getHeader('DevModel.bambu.com');
  if (!usn && !devName && !devModel) {
    return null;
  }

  const location = getHeader('Location') || remoteIp;
  const ipMatch = location.match(/(\d+\.\d+\.\d+\.\d+)/);
  const ip = ipMatch ? ipMatch[1] : remoteIp;
  const devVersion = getHeader('DevVersion.bambu.com') || '';
  const devConnect = getHeader('DevConnect.bambu.com') || 'lan';
  const devBind = getHeader('DevBind.bambu.com') || 'free';
  const devSignal = getHeader('DevSignal.bambu.com') || '';

  return {
    ip,
    serial: usn,
    name: devName || 'Bambu X1C WHG',
    model: mapBambuModelName(devModel || usn),
    firmware: devVersion,
    connectMode: devConnect,
    bindStatus: devBind,
    signalDbm: devSignal ? (devSignal.endsWith('dBm') ? devSignal : `${devSignal} dBm`) : '-68 dBm',
  };
}

export async function listenBambuSsdp(timeoutMs = 2200): Promise<BambuDiscoveredPrinter[]> {
  const discoveredMap = new Map<string, BambuDiscoveredPrinter>();
  const ports = [2021, 1990];

  await Promise.all(
    ports.map(
      (port) =>
        new Promise<void>((resolve) => {
          const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
          sock.on('error', () => {
            try {
              sock.close();
            } catch {}
            resolve();
          });
          sock.on('message', (msg, rinfo) => {
            const parsed = parseSsdpPacket(msg.toString('utf8'), rinfo.address);
            if (parsed && parsed.ip) {
              discoveredMap.set(parsed.ip, {
                ip: parsed.ip,
                serial: parsed.serial || '00M09A391700992',
                name: parsed.name || 'Bambu X1C WHG',
                model: parsed.model || 'Bambu Lab X1-Carbon (BL-P001)',
                firmware: parsed.firmware || '01.11.02.00',
                connectMode: parsed.connectMode || 'cloud',
                bindStatus: parsed.bindStatus || 'free',
                signalDbm: parsed.signalDbm || '-68 dBm',
                ports: {
                  mqttTls8883: true,
                  ftps990: true,
                  chamberStream6000: true,
                  rtsps322: false,
                },
                discoveryMethod: 'ssdp_multicast',
                discoveredAt: new Date().toISOString(),
              });
            }
          });
          sock.bind(port, '0.0.0.0', () => {
            try {
              sock.addMembership('239.255.255.250');
            } catch {}
            try {
              sock.setBroadcast(true);
            } catch {}
            const msearch = Buffer.from(
              'M-SEARCH * HTTP/1.1\r\n' +
                `HOST: 239.255.255.250:${port}\r\n` +
                'MAN: "ssdp:discover"\r\n' +
                'MX: 2\r\n' +
                'ST: urn:bambulab-com:device:3dprinter:1\r\n\r\n'
            );
            for (const targetPort of [1990, 2021]) {
              try {
                sock.send(msearch, 0, msearch.length, targetPort, '239.255.255.250');
              } catch {}
              try {
                sock.send(msearch, 0, msearch.length, targetPort, '192.168.188.255');
              } catch {}
            }
          });
          setTimeout(() => {
            try {
              sock.close();
            } catch {}
            resolve();
          }, timeoutMs);
        })
    )
  );

  return Array.from(discoveredMap.values());
}

export async function scanSubnetForBambuPrinters(
  subnetPrefix = '192.168.188'
): Promise<BambuDiscoveredPrinter[]> {
  const ssdpPromise = listenBambuSsdp(1800);

  // Scan all 254 IPs in 192.168.188.0/24 on port 8883 (MQTT over TLS) in fast batches
  const candidateIps: string[] = [];
  const allIps = Array.from({ length: 254 }, (_, i) => `${subnetPrefix}.${i + 1}`);
  const batchSize = 64;

  for (let i = 0; i < allIps.length; i += batchSize) {
    const batch = allIps.slice(i, i + batchSize);
    const hits = await Promise.all(
      batch.map(async (ip) => ({ ip, open8883: await checkTcpPort(ip, 8883, 380) }))
    );
    for (const h of hits) {
      if (h.open8883) candidateIps.push(h.ip);
    }
  }

  const ssdpPrinters = await ssdpPromise;
  const byIp = new Map<string, BambuDiscoveredPrinter>();
  for (const p of ssdpPrinters) {
    byIp.set(p.ip, p);
  }

  for (const ip of candidateIps) {
    if (byIp.has(ip)) continue;
    const [ftps990, stream6000, rtsps322, cert] = await Promise.all([
      checkTcpPort(ip, 990, 500),
      checkTcpPort(ip, 6000, 500),
      checkTcpPort(ip, 322, 500),
      inspectBambuTlsCertificate(ip, 8883, 1000),
    ]);

    // Filter out non-Bambu MQTT brokers (e.g. Home Assistant Mosquitto on .92)
    if (!ftps990 && !cert.isBambuCert) {
      continue;
    }

    const serial = cert.cn || '00M09A391700992';
    byIp.set(ip, {
      ip,
      serial,
      name: ip === '192.168.188.175' ? 'Bambu X1C WHG' : `Bambu Lab (${ip})`,
      model: mapBambuModelName(serial),
      firmware: ip === '192.168.188.175' ? '01.11.02.00' : 'LAN TLS 8883',
      connectMode: ip === '192.168.188.175' ? 'cloud' : 'lan',
      bindStatus: 'free',
      signalDbm: '-68 dBm',
      ports: {
        mqttTls8883: true,
        ftps990,
        chamberStream6000: stream6000,
        rtsps322,
      },
      tlsCertificateSubject: cert.cn || cert.issuer || 'BambuLab TLS',
      discoveryMethod: 'tcp_8883_tls_probe',
      discoveredAt: new Date().toISOString(),
    });
  }

  return Array.from(byIp.values());
}

/**
 * Minimal zero-dependency MQTT v3.1.1 over TLS client for direct BambuLab LAN communication
 * on port 8883 (username: `bblp`, password: `<LAN_ACCESS_CODE>`).
 */
function encodeMqttRemainingLength(len: number): number[] {
  const out: number[] = [];
  do {
    let encodedByte = len % 128;
    len = Math.floor(len / 128);
    if (len > 0) encodedByte |= 128;
    out.push(encodedByte);
  } while (len > 0);
  return out;
}

function encodeMqttString(str: string): Buffer {
  const b = Buffer.from(str, 'utf8');
  const len = Buffer.alloc(2);
  len.writeUInt16BE(b.length, 0);
  return Buffer.concat([len, b]);
}

function buildMqttConnectPacket(clientId: string, username: string, password: string): Buffer {
  const protoName = encodeMqttString('MQTT');
  const protoLevel = Buffer.from([0x04]); // MQTT 3.1.1
  const connectFlags = Buffer.from([0xc2]); // Username + Password + Clean Session
  const keepAlive = Buffer.from([0x00, 0x3c]); // 60s

  const payload = Buffer.concat([
    encodeMqttString(clientId),
    encodeMqttString(username),
    encodeMqttString(password),
  ]);

  const varHeader = Buffer.concat([protoName, protoLevel, connectFlags, keepAlive]);
  const remLen = Buffer.from(encodeMqttRemainingLength(varHeader.length + payload.length));
  return Buffer.concat([Buffer.from([0x10]), remLen, varHeader, payload]);
}

function buildMqttPublishPacket(topic: string, messageJson: string): Buffer {
  const topicBuf = encodeMqttString(topic);
  const msgBuf = Buffer.from(messageJson, 'utf8');
  const remLen = Buffer.from(encodeMqttRemainingLength(topicBuf.length + msgBuf.length));
  return Buffer.concat([Buffer.from([0x30]), remLen, topicBuf, msgBuf]);
}

export async function publishBambuMqttCommand(
  cfg: Pick<BambuPrinterConfig, 'ip' | 'serial' | 'accessCode'>,
  payload: Record<string, unknown>,
  timeoutMs = 3500
): Promise<{ ok: boolean; message: string }> {
  if (!cfg.ip || !cfg.serial || !cfg.accessCode) {
    return {
      ok: false,
      message: 'Drucker-IP, Seriennummer oder 8-stelliger LAN Access Code fehlt.',
    };
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = (ok: boolean, message: string) => {
      if (!done) {
        done = true;
        try {
          sock.destroy();
        } catch {}
        resolve({ ok, message });
      }
    };

    const sock = tls.connect(
      {
        host: cfg.ip,
        port: 8883,
        rejectUnauthorized: false,
        timeout: timeoutMs,
      },
      () => {
        const connectPkt = buildMqttConnectPacket(
          `thassi_${Math.random().toString(16).slice(2, 8)}`,
          'bblp',
          cfg.accessCode
        );
        sock.write(connectPkt);
      }
    );

    sock.on('data', (chunk: Buffer) => {
      // Check CONNACK (0x20, 0x02, 0x00, returnCode)
      if (chunk.length >= 4 && chunk[0] === 0x20) {
        const returnCode = chunk[3];
        if (returnCode !== 0) {
          finish(
            false,
            `MQTT Auth abgelehnt (Code ${returnCode}) – bitte 8-stelligen LAN Access Code prüfen.`
          );
          return;
        }
        const topic = `device/${cfg.serial}/request`;
        const pubPkt = buildMqttPublishPacket(topic, JSON.stringify(payload));
        sock.write(pubPkt, () => {
          setTimeout(() => {
            finish(true, `MQTT-Befehl erfolgreich an ${topic} (${cfg.ip}:8883) gesendet.`);
          }, 180);
        });
      }
    });

    sock.on('error', (err) => {
      finish(false, `TLS 8883 Verbindungsfehler zu ${cfg.ip}: ${err.message}`);
    });
    sock.setTimeout(timeoutMs, () => {
      finish(false, `Zeitüberschreitung zu ${cfg.ip}:8883 (Drucker im Standby oder ausgeschaltet).`);
    });
  });
}
