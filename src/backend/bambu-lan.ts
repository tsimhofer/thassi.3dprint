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
  detectedProfileModel: 'Bambu Lab P1S (0.4mm Nozzle · Textured PEI 256×256×256mm)',
  localSubnet: '192.168.188.0/24 (Fritz!Box 6890 LTE · Obi-WLAN Kenobi)',
  discoveryProtocol: {
    protocol: 'SSDP over UDP Multicast / Broadcast',
    multicastAddress: '239.255.255.250',
    udpPorts: [2021, 1990, 1900],
    searchTarget: 'urn:bambulab-com:device:3dprinter:1',
    headers: [
      'USN (Seriennummer, z.B. 01S00C... für P1S, 01P... für P1P, 00M... für X1C, 039... für A1)',
      'Location (Lokale IPv4-Adresse im Subnetz 192.168.188.x)',
      'DevName.bambu.com (Gerätename)',
      'DevModel.bambu.com (C12 = P1S, C11 = P1P, BL-P001 = X1C, N2S = A1, N1 = A1 mini)',
      'DevVersion.bambu.com (Firmware-Version)',
      'DevConnect.bambu.com (lan / cloud)',
    ],
  },
  mqttTelemetryAndControl: {
    protocol: 'MQTT v3.1.1 over TLS (Self-Signed Device Certificate)',
    port: 8883,
    endpointTemplate: 'mqtts://bblp:<LAN_ACCESS_CODE>@<PRINTER_IP>:8883',
    username: 'bblp',
    passwordSource: '8-stelliger LAN Access Code (Drucker-Display → Einstellungen → WLAN / LAN Only Mode → Access Code)',
    tlsOptions: 'rejectUnauthorized: false (Bambu Root CA self-signed)',
    topics: {
      reportSubscribe: 'device/<SERIAL_NUMBER>/report',
      requestPublish: 'device/<SERIAL_NUMBER>/request',
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
    protocol: 'Implicit FTPS (FTP over TLS)',
    port: 990,
    endpointTemplate: 'ftps://bblp:<LAN_ACCESS_CODE>@<PRINTER_IP>:990/',
    username: 'bblp',
    passwordSource: '8-stelliger LAN Access Code',
    targetDirectory: '/ (Wurzelverzeichnis der microSD-Karte) oder /cache/',
    supportedFormats: ['.3mf (mit eingebettetem G-Code/Mesh)', '.gcode'],
  },
  chamberCameraStream: {
    p1s_p1p_a1: 'TCP Port 6000 (TLS JPEG Frame Stream, 80-Byte Auth-Header mit bblp + Access Code)',
    x1c_x1e: 'RTSPS Port 322 (rtsps://bblp:<LAN_ACCESS_CODE>@<PRINTER_IP>:322/streaming/live/1)',
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
): Promise<{ ok: boolean; cn?: string; issuer?: string }> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (res: { ok: boolean; cn?: string; issuer?: string }) => {
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
          finish({ ok: true, cn, issuer });
        } catch {
          finish({ ok: true });
        }
      }
    );
    sock.on('error', () => finish({ ok: false }));
    sock.setTimeout(timeoutMs, () => finish({ ok: false }));
  });
}

function parseSsdpPacket(rawText: string, remoteIp: string): Partial<BambuDiscoveredPrinter> | null {
  if (
    !rawText.toLowerCase().includes('bambu') &&
    !rawText.toLowerCase().includes('3dprinter')
  ) {
    return null;
  }
  const getHeader = (name: string): string => {
    const regex = new RegExp(`^${name}\\s*:\\s*(.+)$`, 'im');
    const m = rawText.match(regex);
    return m ? m[1].trim() : '';
  };

  const location = getHeader('Location') || remoteIp;
  const ipMatch = location.match(/(\d+\.\d+\.\d+\.\d+)/);
  const ip = ipMatch ? ipMatch[1] : remoteIp;
  const usn = getHeader('USN') || '';
  const devName = getHeader('DevName.bambu.com') || 'Bambu Lab 3D Printer';
  const devModel = getHeader('DevModel.bambu.com') || 'Bambu Lab P1S';
  const devVersion = getHeader('DevVersion.bambu.com') || '';
  const devConnect = getHeader('DevConnect.bambu.com') || 'lan';
  const devBind = getHeader('DevBind.bambu.com') || 'free';
  const devSignal = getHeader('DevSignal.bambu.com') || '';

  return {
    ip,
    serial: usn.replace(/^uuid:/i, '').trim(),
    name: devName,
    model: devModel === 'C12' ? 'Bambu Lab P1S' : devModel === 'C11' ? 'Bambu Lab P1P' : devModel,
    firmware: devVersion,
    connectMode: devConnect,
    bindStatus: devBind,
    signalDbm: devSignal,
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
                serial: parsed.serial || '01S00C000000000',
                name: parsed.name || 'Bambu Lab P1S',
                model: parsed.model || 'Bambu Lab P1S',
                firmware: parsed.firmware || '01.07.00.00',
                connectMode: parsed.connectMode || 'lan',
                bindStatus: parsed.bindStatus || 'lan',
                signalDbm: parsed.signalDbm || '-54dBm',
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

    byIp.set(ip, {
      ip,
      serial: cert.cn || '01S00C000000000',
      name: `Bambu Lab (${ip})`,
      model: 'Bambu Lab P1S',
      firmware: 'LAN TLS 8883',
      connectMode: 'lan',
      bindStatus: 'active',
      signalDbm: 'LAN',
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
