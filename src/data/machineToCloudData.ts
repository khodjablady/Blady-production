import { MachineLigne, MachineToCloudLogEntry, CloudProtocol } from '../types';

export const INITIAL_M2C_LOGS: MachineToCloudLogEntry[] = [
  {
    id: 'm2c-10892',
    timestamp: '11:19:42.120',
    machineId: 1,
    machineNom: 'Cuve Réacteur Agité R-5000L (Mélange)',
    protocol: 'MQTT_SPARKPLUG_B',
    direction: 'EDGE_TO_CLOUD',
    endpointOrTopic: 'spBv1.0/BladyPlant/DDATA/Line01/Cuve_Melange_R5000L',
    methodOrMessageType: 'PUBLISH (QoS 1)',
    payloadBytes: 384,
    cloudLatencyMs: 14.8,
    status: 'SUCCESS',
    responseCode: 'PUBACK [PacketId=4092]',
    summary: '[MQTT Sparkplug B] Publication DDATA métriques temps réel (T°C, Niveau, Pression) vers Azure IoT Hub / Blady Cloud Broker.',
    headers: {
      'topic': 'spBv1.0/BladyPlant/DDATA/Line01/Cuve_Melange_R5000L',
      'qos': '1',
      'retain': 'false',
      'client-id': 'blady-edge-gateway-01',
      'tls-cipher': 'TLS_AES_256_GCM_SHA384'
    },
    payloadJson: {
      timestamp: 1790853582120,
      metrics: [
        { name: 'NiveauCuveLitres', type: 'Float', value: 3450, unit: 'L', quality: 'Good' },
        { name: 'TemperaturePT100', type: 'Float', value: 22.4, unit: '°C', quality: 'Good' },
        { name: 'PressionAbsolueBar', type: 'Float', value: 1.25, unit: 'bar', quality: 'Good' },
        { name: 'AgitateurVitesseRPM', type: 'Int32', value: 140, unit: 'tr/min', quality: 'Good' }
      ],
      seq: 14892,
      edgeGateway: 'Edge-Gateway-S7-TIA'
    },
    pipelineBreakdown: {
      edgePackingMs: 1.2,
      tlsEncryptionMs: 2.1,
      networkWanRttMs: 8.5,
      cloudIngestionMs: 3.0
    }
  },
  {
    id: 'm2c-10891',
    timestamp: '11:19:40.850',
    machineId: 2,
    machineNom: 'Homogénéisateur Haute Pression H-300',
    protocol: 'HTTPS_REST',
    direction: 'EDGE_TO_CLOUD',
    endpointOrTopic: 'POST /api/v1/telemetry/ingest/batch',
    methodOrMessageType: 'HTTPS POST JSON',
    payloadBytes: 512,
    cloudLatencyMs: 18.2,
    status: 'SUCCESS',
    responseCode: '202 Accepted',
    summary: '[HTTPS REST Ingest] Télémétrie haute pression transmise via API Ingestion avec signature HMAC-SHA256.',
    headers: {
      'Host': 'iot.bladyproduction.com',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'X-Device-Id': 'PLC-02-M241-HOMO',
      'X-Signature-SHA256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'Content-Type': 'application/json; charset=utf-8'
    },
    payloadJson: {
      deviceId: 'PLC-02-M241',
      machine: 'Homogeneisateur_H300',
      data: {
        pressionHomogeneisationBar: 140.0,
        temperatureAmontC: 24.8,
        puissanceMoteurKw: 45.2,
        debitEffectifLh: 2400
      },
      status: 'OPERATIONAL',
      timestampUtc: '2026-09-30T18:19:40.850Z'
    },
    pipelineBreakdown: {
      edgePackingMs: 1.8,
      tlsEncryptionMs: 3.4,
      networkWanRttMs: 9.8,
      cloudIngestionMs: 3.2
    }
  },
  {
    id: 'm2c-10890',
    timestamp: '11:19:39.420',
    machineId: 3,
    machineNom: 'Remplisseuse Volumétrique Rotative 12 Becs',
    protocol: 'OPC_UA_PUBSUB',
    direction: 'EDGE_TO_CLOUD',
    endpointOrTopic: 'opc.amqp://cloud-hub.bladyproduction.com/factory/line01',
    methodOrMessageType: 'DataSetMessage (AMQP 1.0)',
    payloadBytes: 420,
    cloudLatencyMs: 16.5,
    status: 'SUCCESS',
    responseCode: 'AMQP_ACK [DeliveryTag=8910]',
    summary: '[OPC UA PubSub] Émission broker AMQP Cloud de la cadence de soutirage et pression des becs (Part 14 IEC 62541).',
    headers: {
      'amqp-to': 'factory/line01/remplisseuse',
      'content-encoding': 'gzip',
      'opc-security-policy': 'Aes128_Sha256_RsaOaep'
    },
    payloadJson: {
      DataSetWriterId: 103,
      SequenceNumber: 7421,
      Payload: {
        CadenceFlaconsHeure: 920,
        PressionInjectionBar: 2.1,
        VolumeMoyenDoseMl: 1002.4,
        TotalFlaconsProduits: 4520
      }
    },
    pipelineBreakdown: {
      edgePackingMs: 1.5,
      tlsEncryptionMs: 2.3,
      networkWanRttMs: 9.1,
      cloudIngestionMs: 3.6
    }
  },
  {
    id: 'm2c-10889',
    timestamp: '11:19:38.100',
    machineId: 4,
    machineNom: 'Boucheuse Automatique Servomoteur',
    protocol: 'WEBSOCKET_WSS',
    direction: 'EDGE_TO_CLOUD',
    endpointOrTopic: 'wss://iot.bladyproduction.com/stream/v1/telemetry',
    methodOrMessageType: 'WSS Text Frame (JSON)',
    payloadBytes: 256,
    cloudLatencyMs: 12.4,
    status: 'SUCCESS',
    responseCode: '1000 Normal Closure (Streaming)',
    summary: '[WebSocket WSS] Télémétrie en flux persistant bidirectionnel du couple de serrage servomoteur Omron.',
    headers: {
      'Upgrade': 'websocket',
      'Sec-WebSocket-Protocol': 'blady-v1-telemetry',
      'Sec-WebSocket-Extensions': 'permessage-deflate'
    },
    payloadJson: {
      channel: 'machines/PLC-04',
      event: 'SERVO_TELEMETRY',
      data: {
        coupleSerrageNm: 2.8,
        courseEnfoncementMm: 14.2,
        bolVibrantAlimentationPct: 82,
        defautsBouchageConsecutifs: 0
      }
    },
    pipelineBreakdown: {
      edgePackingMs: 0.8,
      tlsEncryptionMs: 1.6,
      networkWanRttMs: 7.8,
      cloudIngestionMs: 2.2
    }
  },
  {
    id: 'm2c-10888',
    timestamp: '11:19:36.500',
    machineId: 5,
    machineNom: 'Étiqueteuse Linéaire Double Face Haute Vitesse',
    protocol: 'MQTT_SPARKPLUG_B',
    direction: 'EDGE_TO_CLOUD',
    endpointOrTopic: 'spBv1.0/BladyPlant/DDATA/Line01/Etiqueteuse_WAGO',
    methodOrMessageType: 'PUBLISH (QoS 1)',
    payloadBytes: 310,
    cloudLatencyMs: 15.2,
    status: 'SUCCESS',
    responseCode: 'PUBACK [PacketId=4091]',
    summary: '[MQTT Sparkplug B] Publication cadence étiquetage, réconciliation lot et rejet caméra vision.',
    headers: {
      'topic': 'spBv1.0/BladyPlant/DDATA/Line01/Etiqueteuse_WAGO',
      'qos': '1',
      'client-id': 'blady-wago-edge-05'
    },
    payloadJson: {
      timestamp: 1790853576500,
      metrics: [
        { name: 'CadenceActuelle', type: 'Int32', value: 920, unit: 'fl/h' },
        { name: 'RouleauEtiquettesRestantPct', type: 'Float', value: 74.5, unit: '%' },
        { name: 'ConformiteVisionRebuts', type: 'Int32', value: 4, unit: 'flacons' }
      ]
    },
    pipelineBreakdown: {
      edgePackingMs: 1.1,
      tlsEncryptionMs: 1.9,
      networkWanRttMs: 8.8,
      cloudIngestionMs: 3.4
    }
  },
  {
    id: 'm2c-10887',
    timestamp: '11:19:34.900',
    machineId: 1,
    machineNom: 'Cuve Réacteur Agité R-5000L (Mélange)',
    protocol: 'HTTPS_REST',
    direction: 'CLOUD_TO_EDGE',
    endpointOrTopic: 'POST /api/v1/edge/commands/setpoint',
    methodOrMessageType: 'CLOUD RPC COMMAND',
    payloadBytes: 210,
    cloudLatencyMs: 22.0,
    status: 'SUCCESS',
    responseCode: '200 OK',
    summary: '[Cloud-to-Edge Sync] Envoi de consigne de régulation thermique validée depuis le MES Cloud.',
    headers: {
      'X-Target-Gateway': 'blady-edge-gateway-01',
      'X-Command-Id': 'CMD-SETPOINT-TEMP-22.4',
      'Content-Type': 'application/json'
    },
    payloadJson: {
      command: 'SET_SETPOINT',
      target: 'Cuve_Melange_Temperature',
      requestedValue: 22.4,
      tolerance: 1.5,
      authorizedBy: 'Julien Mercier (MES Lead)'
    },
    pipelineBreakdown: {
      edgePackingMs: 2.1,
      tlsEncryptionMs: 2.9,
      networkWanRttMs: 12.5,
      cloudIngestionMs: 4.5
    }
  }
];

let globalM2cSequence = 10893;

/**
 * Dynamically generates a realistic Machine-to-Cloud log entry matching live machine telemetry.
 */
export function generateMachineToCloudLog(
  machines: MachineLigne[],
  prevLogs: MachineToCloudLogEntry[],
  simulatedIssue: 'NORMAL' | 'HIGH_LATENCY' | 'RATE_LIMIT_429' | 'GATEWAY_TIMEOUT_504' | 'INJECTED_THERMAL_ALERT' = 'NORMAL'
): MachineToCloudLogEntry {
  const tid = globalM2cSequence++;
  const now = new Date();
  const timeStr = `${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}`;

  // Pick a machine
  const machine = machines[Math.floor(Math.random() * machines.length)] || machines[0];

  // Pick protocol
  const protocols: CloudProtocol[] = ['MQTT_SPARKPLUG_B', 'HTTPS_REST', 'OPC_UA_PUBSUB', 'WEBSOCKET_WSS'];
  const protocol = protocols[Math.floor(Math.random() * protocols.length)];

  // Direction: mostly Edge-to-Cloud, occasionally Cloud-to-Edge sync
  const isCloudToEdge = Math.random() < 0.12 && simulatedIssue === 'NORMAL';
  const direction = isCloudToEdge ? 'CLOUD_TO_EDGE' : 'EDGE_TO_CLOUD';

  let latency = Number((10 + Math.random() * 15).toFixed(1));
  let status: MachineToCloudLogEntry['status'] = 'SUCCESS';
  let responseCode: string | number = '200 OK';
  let summary = '';
  let payload: Record<string, any> = {};
  let errorDetails: string | undefined = undefined;

  // Handle simulated issues
  if (simulatedIssue === 'HIGH_LATENCY') {
    latency = Number((240 + Math.random() * 90).toFixed(1));
    status = 'WARNING';
    responseCode = '200 OK (SLOW_RTT)';
    summary = `[${protocol}] Avertissement latence WAN élevée (${latency} ms). Dégradation réseau Edge-to-Cloud constatée.`;
  } else if (simulatedIssue === 'RATE_LIMIT_429') {
    latency = 85.0;
    status = 'ERROR';
    responseCode = '429 Too Many Requests';
    errorDetails = 'Quota d\'ingestion dépassé sur le gateway IoT Cloud (Limite 50 req/sec atteinte). Backoff exponentiel actif (attente 2000ms).';
    summary = `[${protocol}] Échec d'ingestion Cloud : HTTP 429 Rate Limit. Bufferisation locale Edge activée.`;
  } else if (simulatedIssue === 'GATEWAY_TIMEOUT_504') {
    latency = 2500.0;
    status = 'ERROR';
    responseCode = '504 Gateway Timeout';
    errorDetails = 'Pas de réponse du Cloud Ingest Service après 2500ms. Rupture temporaire lien WAN fibre.';
    summary = `[${protocol}] Timeout d'ingestion Cloud (504). Re-tentative programmée dans 5s (Tentative 1/3).`;
  } else if (simulatedIssue === 'INJECTED_THERMAL_ALERT' || (machine.id === 1 && machine.temperatureC && machine.temperatureC > 30)) {
    // Thermal alert payload
    status = 'WARNING';
    responseCode = protocol === 'MQTT_SPARKPLUG_B' ? 'PUBACK [HIGH_PRIO_ACK]' : '202 Accepted (ALERT_FLAGGED)';
    summary = `[${protocol} PRIORITAIRE] Alerte thermique Cuve R-5000L transmise au Cloud : ${machine.temperatureC || 48.6}°C > seuil tolérance !`;
    payload = {
      alertType: 'CRITICAL_TEMPERATURE_EXCURSION',
      machineId: machine.id,
      machineNom: machine.nom,
      measuredTemperatureC: machine.temperatureC || 48.6,
      thresholdMaxC: 26.0,
      cloudActionRequired: 'DISPATCH_MAINTENANCE_WEBHOOK',
      timestampUtc: now.toISOString()
    };
  } else {
    // Nominal payloads
    if (protocol === 'MQTT_SPARKPLUG_B') {
      responseCode = `PUBACK [PacketId=${Math.floor(1000 + Math.random() * 9000)}]`;
      summary = `[MQTT Sparkplug B] Publication DDATA télémétrie ${machine.nom.split(' ')[0]} vers Azure IoT / Cloud Gateway.`;
      payload = {
        timestamp: now.getTime(),
        metrics: [
          { name: 'CadenceActuelle', type: 'Int32', value: machine.cadenceActuelle, unit: 'U/h' },
          ...(machine.temperatureC !== undefined ? [{ name: 'TemperaturePT100', type: 'Float', value: machine.temperatureC, unit: '°C' }] : []),
          ...(machine.pressionBar !== undefined ? [{ name: 'PressionBar', type: 'Float', value: machine.pressionBar, unit: 'bar' }] : []),
          ...(machine.niveauCuveLitres !== undefined ? [{ name: 'NiveauLitres', type: 'Float', value: machine.niveauCuveLitres, unit: 'L' }] : [])
        ],
        seq: tid
      };
    } else if (protocol === 'HTTPS_REST') {
      responseCode = '202 Accepted';
      summary = `[HTTPS REST] Ingestion lot de métriques ${machine.nom.split(' ')[0]} (Payload sécurisé TLS 1.3).`;
      payload = {
        deviceId: `PLC-0${machine.id}`,
        machine: machine.nom,
        status: machine.statut,
        cadence: machine.cadenceActuelle,
        temperatureC: machine.temperatureC,
        pressionBar: machine.pressionBar,
        timestamp: now.toISOString()
      };
    } else if (protocol === 'OPC_UA_PUBSUB') {
      responseCode = 'AMQP_ACK [DeliveryTag=' + Math.floor(1000 + Math.random() * 9000) + ']';
      summary = `[OPC UA PubSub] Diffusion DataSetMessage Part 14 vers Cloud EventHub pour analyse analytique.`;
      payload = {
        DataSetWriterId: 100 + machine.id,
        SequenceNumber: tid,
        Payload: {
          MachineStatut: machine.statut,
          CadenceReelle: machine.cadenceActuelle,
          NœudOpcUa: machine.nodeOpcUa
        }
      };
    } else {
      responseCode = '1000 Stream Nominal';
      summary = `[WebSocket WSS] Télémétrie push en continu vers Blady Dashboard Cloud.`;
      payload = {
        channel: `telemetry/machine/${machine.id}`,
        cadence: machine.cadenceActuelle,
        pingRttMs: latency
      };
    }
  }

  // Topic or endpoint
  const endpoint = protocol === 'MQTT_SPARKPLUG_B'
    ? `spBv1.0/BladyPlant/DDATA/Line01/${machine.nom.split(' ')[0]}`
    : protocol === 'HTTPS_REST'
    ? isCloudToEdge ? '/api/v1/edge/config/sync' : '/api/v1/telemetry/ingest'
    : protocol === 'OPC_UA_PUBSUB'
    ? 'opc.amqp://cloud-hub.bladyproduction.com/factory/line01'
    : `wss://iot.bladyproduction.com/stream/v1/machine/${machine.id}`;

  const methodType = protocol === 'MQTT_SPARKPLUG_B'
    ? 'PUBLISH (QoS 1)'
    : protocol === 'HTTPS_REST'
    ? isCloudToEdge ? 'HTTPS POST [Config]' : 'HTTPS POST [Batch]'
    : protocol === 'OPC_UA_PUBSUB'
    ? 'DataSetMessage (AMQP 1.0)'
    : 'WSS Text Frame';

  const payloadBytes = Math.floor(220 + Math.random() * 260);

  return {
    id: `m2c-${tid}`,
    timestamp: timeStr,
    machineId: machine.id,
    machineNom: machine.nom,
    protocol,
    direction,
    endpointOrTopic: endpoint,
    methodOrMessageType: methodType,
    payloadBytes,
    cloudLatencyMs: latency,
    status,
    responseCode,
    summary,
    headers: {
      'content-type': 'application/json',
      'x-blady-source': 'edge-gateway-linux-arm64',
      'tls-cipher': 'TLS_AES_256_GCM_SHA384'
    },
    payloadJson: payload,
    pipelineBreakdown: {
      edgePackingMs: Number((0.8 + Math.random() * 1.0).toFixed(1)),
      tlsEncryptionMs: Number((1.2 + Math.random() * 1.5).toFixed(1)),
      networkWanRttMs: Number((latency * 0.6).toFixed(1)),
      cloudIngestionMs: Number((latency * 0.25).toFixed(1))
    },
    errorDetails
  };
}
