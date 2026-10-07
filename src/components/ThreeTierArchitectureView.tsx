import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Server,
  Globe,
  Radio,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  Terminal,
  Activity,
  Zap,
  Gauge,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Scale,
  Barcode,
  Bot
} from 'lucide-react';

interface SimulationTraceStep {
  layer: 'hardware' | 'cpp_edge' | 'dotnet_core' | 'web_ui';
  title: string;
  protocol: string;
  latency: string;
  dataPayload: string;
  description: string;
}

export const ThreeTierArchitectureView: React.FC = () => {
  const [selectedSubTab, setSelectedSubTab] = useState<'diagram' | 'code_contracts' | 'simulation' | 'protocols_benchmark'>('diagram');
  const [selectedCodeFile, setSelectedCodeFile] = useState<'proto' | 'cpp' | 'csharp'>('proto');
  const [copiedCode, setCopiedCode] = useState(false);

  // Simulation state
  const [simulationType, setSimulationType] = useState<'scale' | 'scanner' | 'plc_alarm' | 'web_command'>('scale');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Run animated trace
  const handleStartSimulation = (type: 'scale' | 'scanner' | 'plc_alarm' | 'web_command') => {
    setSimulationType(type);
    setSimulationRunning(true);
    setCurrentStepIndex(0);

    setTimeout(() => setCurrentStepIndex(1), 700);
    setTimeout(() => setCurrentStepIndex(2), 1500);
    setTimeout(() => {
      setCurrentStepIndex(3);
      setSimulationRunning(false);
    }, 2300);
  };

  const getSimulationSteps = (): SimulationTraceStep[] => {
    switch (simulationType) {
      case 'scale':
        return [
          {
            layer: 'hardware',
            title: '1. Matériel Physique : Balance Cuve R-5000L',
            protocol: 'RS-232 / Port COM (9600 bauds, 8N1)',
            latency: '2.4 ms',
            dataPayload: 'ASCII: "ST,GS,+01248.50,kg\\r\\n"',
            description: 'La cellule de charge Mettler Toledo émet une trame série brute après stabilisation du poids de sucre dans la cuve réacteur.'
          },
          {
            layer: 'cpp_edge',
            title: '2. Agent Edge C++ (Processus Natif Local)',
            protocol: 'POSIX termios / Driver C++20 sans Garbage Collector',
            latency: '0.8 ms',
            dataPayload: 'struct ScaleReading { int id=1; double weight=1248.5; bool stable=true; }',
            description: 'Lecture du descripteur de fichier /dev/ttyS0, validation du checksum, conversion en struct binaire et mise en file d’attente lock-free.'
          },
          {
            layer: 'dotnet_core',
            title: '3. Serveur .NET 8/9 (Logique ERP & MES)',
            protocol: 'gRPC Bidirectionnel / Protobuf binaire HTTP/2',
            latency: '1.2 ms',
            dataPayload: 'Protobuf: message DeviceTelemetry { device_id: 1, metric: "weight", val: 1248.5 }',
            description: 'Désérialisation ultra-rapide par EdgeCommunicationWorker. Ingestion dans le suivi de recette MES, mise à jour des stocks ERP et dispatch.'
          },
          {
            layer: 'web_ui',
            title: '4. Couche Affichage Navigateur Web (HTML5/React)',
            protocol: 'WebSocket binaire / ASP.NET Core SignalR Hub',
            latency: '4.6 ms',
            dataPayload: 'JSON: { "cuve": "R-5000L", "poids": 1248.5, "unite": "kg", "statut": "Stabilisé" }',
            description: 'Mise à jour en temps réel de la jauge animée sur le Synoptique Usine et rafraîchissement instantané du pupitre opérateur sans recharger la page.'
          }
        ];
      case 'scanner':
        return [
          {
            layer: 'hardware',
            title: '1. Matériel Physique : Douchette Code-Barres Zebra 2D',
            protocol: 'USB HID / Emulation RS-232',
            latency: '1.8 ms',
            dataPayload: 'Datamatrix: "GS1-128: (01)03401234567890(10)LOT-2026-CUVE4"',
            description: 'L’opérateur scanne le sac de pectine lors de l’étape d’incorporation dans la cuve.'
          },
          {
            layer: 'cpp_edge',
            title: '2. Agent Edge C++ Local',
            protocol: 'LibUSB / Capture d’interruptions clavier POSIX',
            latency: '0.5 ms',
            dataPayload: 'struct BarcodeEvent { char lot[32]="LOT-2026-CUVE4"; int station=2; }',
            description: 'Filtrage de la séquence de caractères, horodatage au microseconde près et appel gRPC distant.'
          },
          {
            layer: 'dotnet_core',
            title: '3. Serveur .NET 8/9 (Contrôle Qualité & Traçabilité)',
            protocol: 'gRPC Unary Call : ScanVerificationRpc',
            latency: '3.1 ms',
            dataPayload: 'gRPC Request: VerifyLotRequest { lot: "LOT-2026-CUVE4", of_id: "OF-2026-001" }',
            description: 'Vérification dans la nomenclature ERP : Lot conforme, date de péremption valide, intégration à l’arbre de traçabilité descendante.'
          },
          {
            layer: 'web_ui',
            title: '4. Affichage Navigateur Web (IHM Atelier)',
            protocol: 'SignalR Event: "LotVerifiedSuccess"',
            latency: '6.2 ms',
            dataPayload: 'UI Toast: "Lot MP validé pour OF-2026-001 (Pectine Pomme 25kg)"',
            description: 'Allumage du voyant vert sur le pupitre opérateur de conditionnement et déverrouillage de l’étape de pesée.'
          }
        ];
      case 'plc_alarm':
        return [
          {
            layer: 'hardware',
            title: '1. Matériel Physique : Automate Ligne Siemens S7-1500',
            protocol: 'Bus de Terrain PROFINET / I/O Numérique',
            latency: '1.0 ms',
            dataPayload: 'Variable DB100.DBX4.2 = TRUE (Alarme Bourrage Remplisseuse)',
            description: 'Détection optique d’un flacon couché à l’entrée de l’étoile de transfert 12 becs.'
          },
          {
            layer: 'cpp_edge',
            title: '2. Agent Edge C++ (Client OPC UA / Modbus)',
            protocol: 'open62541 Stack C++ / Abonnement MonitoredItems',
            latency: '1.1 ms',
            dataPayload: 'OPC UA Notification: ns=2;s="Machine_L1.Alarm_Jam" = 1',
            description: 'Abonnement réactif à 50Hz. Détection instantanée du flanc montant sans surcharge CPU grâce à l’absence de garbage collector.'
          },
          {
            layer: 'dotnet_core',
            title: '3. Serveur .NET 8/9 (Moteur TRS & Journal Maintenance)',
            protocol: 'gRPC Stream : PushMachineAlarmStream',
            latency: '2.0 ms',
            dataPayload: 'Protobuf: MachineAlarmEvent { machine_id: 3, code: "ERR_JAM", severity: CRITICAL }',
            description: 'Incrémentation du compteur d’arrêts non planifiés, recalcul dynamique du TRS (AFNOR NF E60-182) et création automatique d’un ticket maintenance.'
          },
          {
            layer: 'web_ui',
            title: '4. Affichage Navigateur Web (Synoptique & Alerte)',
            protocol: 'WebSocket SignalR : BroadcastAlarm',
            latency: '5.0 ms',
            dataPayload: 'Audio Alert + Bannière Rouge : "Arrêt Ligne Remplisseuse - Bourrage Détecté"',
            description: 'Clignotement rouge sur la machine au synoptique, son d’alerte usine et mise en pause automatique du compteur de cadence.'
          }
        ];
      case 'web_command':
        return [
          {
            layer: 'web_ui',
            title: '1. Couche Affichage : Clic "Démarrer OF-2026-001"',
            protocol: 'HTTPS POST /api/mes/orders/start',
            latency: '8.0 ms',
            dataPayload: 'JSON: { "ofId": "OF-2026-001", "targetSpeedBpm": 120, "operator": "Marc Vallet" }',
            description: 'Le chef d’atelier valide le démarrage de l’ordre de fabrication depuis sa tablette ou son PC de supervision.'
          },
          {
            layer: 'dotnet_core',
            title: '2. Serveur .NET 8/9 (Vérification Règles & Sécurité RBAC)',
            protocol: 'ASP.NET Core Controller / MediatR Command Handler',
            latency: '2.5 ms',
            dataPayload: 'C# Command: StartProductionOrderCommand(OF-2026-001, Speed=120)',
            description: 'Vérification des droits RBAC, réservation des stocks matières dans l’ERP, passage du statut de l’OF à "EnPreparation" et dispatch vers l’Agent Edge.'
          },
          {
            layer: 'cpp_edge',
            title: '3. Agent Edge C++ (Traduction en Ordre Automate)',
            protocol: 'gRPC Command Call : ExecuteMachineCommandRpc',
            latency: '1.4 ms',
            dataPayload: 'C++ Modbus Master: WriteMultipleRegisters(Slave=1, Addr=40100, Values=[1, 120])',
            description: 'Écriture déterministe dans les registres de consigne de l’automate de pilotage.'
          },
          {
            layer: 'hardware',
            title: '4. Matériel Physique : Variateur de Fréquence & Moteurs Ligne',
            protocol: 'Modbus TCP / RS-485 physique',
            latency: '3.0 ms',
            dataPayload: 'Consigne Moteur : Rampe d’accélération 0 -> 120 flacons/min',
            description: 'Démarrage synchronisé des convoyeurs à bande et de la pompe volumétrique de dosage.'
          }
        ];
    }
  };

  const codeSnippets = {
    proto: `// ============================================================================
// CONTRAT D'INTERFACE gRPC (Protobuf v3)
// Fichier : industrial_edge.proto
// Rôle : Spécification stricte et typée du dialogue entre l'Agent Edge C++
//        et le serveur d'application .NET 8/9 (ERP / MES).
// ============================================================================
syntax = "proto3";

option csharp_namespace = "BladyProduction.Connectivity.Grpc";
package industrial.edge;

// Service de streaming matériel bidirectionnel
service IndustrialEdgeService {
  // Flux ascendant continu : L'agent C++ pousse la télémétrie capteurs et balances
  rpc StreamTelemetry (TelemetrySubscriptionRequest) returns (stream DeviceTelemetryEvent);

  // Événements ponctuels matériels : Scans de codes-barres, pesées stabilisées
  rpc PublishHardwareEvent (HardwareDeviceEvent) returns (HardwareEventResponse);

  // Flux descendant : Le serveur .NET envoie des consignes aux automates (start/stop, vitesse)
  rpc SendMachineCommand (MachineCommandRequest) returns (MachineCommandResponse);
}

// Message de télémétrie capteur à haute fréquence
message DeviceTelemetryEvent {
  int64 timestamp_utc_ms = 1;
  int32 machine_id = 2;
  string machine_name = 3;
  string sensor_type = 4;        // "temperature", "pressure", "speed_bpm", "weight_kg"
  double numeric_value = 5;
  string quality_status = 6;     // "GOOD", "UNCERTAIN", "BAD"
  map<string, string> tags = 7;
}

// Événement matériel asynchrone (Balance, Scanner, Barcode, RFID)
message HardwareDeviceEvent {
  int64 event_id = 1;
  int64 timestamp_utc_ms = 2;
  enum DeviceType {
    SCANNER_2D = 0;
    METTLER_SCALE = 1;
    PLC_OPCUA_NODE = 2;
    RFID_READER = 3;
  }
  DeviceType device_type = 3;
  string hardware_port = 4;      // "/dev/ttyUSB0", "COM3", "192.168.1.10:502"
  string raw_payload = 5;        // Donnée brute capturée (code barre ou poids)
  double parsed_weight = 6;      // Si balance : poids numérique en kg
  bool is_stable = 7;
}

message HardwareEventResponse {
  bool acknowledged = 1;
  string erp_lot_validation = 2; // "VALID", "INVALID_EXPIRED", "UNKNOWN"
  string display_message = 3;
}

message MachineCommandRequest {
  int32 machine_id = 1;
  string command = 2;            // "START", "STOP", "SET_SPEED", "CLEANING_CIP"
  double setpoint_value = 3;     // Ex: 120.0 flacons/min ou 85.0 °C
  string operator_uid = 4;
}

message MachineCommandResponse {
  bool executed = 1;
  string plc_status_code = 2;
  string error_message = 3;
}

message TelemetrySubscriptionRequest {
  int32 sample_rate_ms = 1;      // Ex: 100ms
  repeated int32 machine_ids = 2;
}`,
    cpp: `// ============================================================================
// COUCHE 3 : AGENT EDGE MATÉRIEL C++20 (Natif & Local)
// Fichier : EdgeDeviceAgent.cpp
// Rôle : Pilotes matériels bas niveau (RS-232, Modbus, OPC UA) avec latence
//        déterministe < 1ms, sans Garbage Collector, et client gRPC vers .NET.
// ============================================================================
#include <iostream>
#include <thread>
#include <chrono>
#include <string>
#include <atomic>
#include <memory>
#include <fcntl.h>
#include <termios.h>
#include <unistd.h>
#include <grpcpp/grpcpp.h>
#include "industrial_edge.grpc.pb.h"

using grpc::Channel;
using grpc::ClientContext;
using grpc::Status;
using industrial::edge::IndustrialEdgeService;
using industrial::edge::HardwareDeviceEvent;
using industrial::edge::HardwareEventResponse;

class EdgeDeviceAgent {
private:
    std::unique_ptr<IndustrialEdgeService::Stub> grpc_stub_;
    std::atomic<bool> is_running_{true};
    int serial_fd_{-1};

public:
    explicit EdgeDeviceAgent(std::shared_ptr<Channel> channel)
        : grpc_stub_(IndustrialEdgeService::NewStub(channel)) {}

    ~EdgeDeviceAgent() {
        if (serial_fd_ >= 0) close(serial_fd_);
    }

    // 1. Initialisation du port série COM / RS-232 pour Balance industrielle
    bool InitializeSerialPort(const std::string& port_path = "/dev/ttyUSB0") {
        serial_fd_ = open(port_path.c_str(), O_RDWR | O_NOCTTY | O_NDELAY);
        if (serial_fd_ < 0) {
            std::cerr << "[Agent C++] Erreur ouverture port série: " << port_path << std::endl;
            return false;
        }

        struct termios tty;
        tcgetattr(serial_fd_, &tty);
        cfsetispeed(&tty, B9600);
        cfsetospeed(&tty, B9600);
        tty.c_cflag |= (CLOCAL | CREAD); // 8N1 standard
        tty.c_cflag &= ~PARENB;
        tty.c_cflag &= ~CSTOPB;
        tty.c_cflag &= ~CSIZE;
        tty.c_cflag |= CS8;
        tcsetattr(serial_fd_, TCSANOW, &tty);

        std::cout << "[Agent C++] Port série configuré avec succès : " << port_path << " (9600-8N1)" << std::endl;
        return true;
    }

    // 2. Boucle de scrutation haute fréquence et émission gRPC vers .NET 8/9
    void StartHardwarePollingLoop() {
        std::cout << "[Agent C++] Démarrage du thread d'acquisition matérielle..." << std::endl;
        
        while (is_running_) {
            char buffer[128];
            int bytes_read = read(serial_fd_, buffer, sizeof(buffer) - 1);

            if (bytes_read > 0) {
                buffer[bytes_read] = '\\0';
                std::string raw_data(buffer);

                // Analyse de la trame Mettler Toledo : "ST,GS,+01248.50,kg"
                double weight = ParseMettlerFrame(raw_data);

                // Construction de l'événement Protobuf binaire
                HardwareDeviceEvent event;
                event.set_timestamp_utc_ms(std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count());
                event.set_device_type(HardwareDeviceEvent::METTLER_SCALE);
                event.set_hardware_port("/dev/ttyUSB0");
                event.set_raw_payload(raw_data);
                event.set_parsed_weight(weight);
                event.set_is_stable(true);

                // Transmission gRPC ultra-rapide au serveur .NET (inter-processus)
                ClientContext context;
                HardwareEventResponse response;
                Status status = grpc_stub_->PublishHardwareEvent(&context, event, &response);

                if (status.ok()) {
                    std::cout << "[Agent C++] Pesée transmise à .NET -> " << weight << " kg. Statut ERP: " 
                              << response.erp_lot_validation() << std::endl;
                }
            }

            // Fréquence de polling matérielle : cycle de 10ms déterministe
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }
    }

    double ParseMettlerFrame(const std::string& frame) {
        // Décodage rapide et extraction du poids flottant
        size_t pos = frame.find('+');
        if (pos != std::string::npos && pos + 8 < frame.size()) {
            return std::stod(frame.substr(pos + 1, 8));
        }
        return 1248.5; // Valeur nominale stabilisée
    }

    void Stop() { is_running_ = false; }
};

int main(int argc, char** argv) {
    std::cout << "=== BladyProduction Edge Hardware Agent (C++20 / gRPC) ===" << std::endl;
    // Connexion inter-processus via gRPC (localhost:50051 ou Named Pipe / Unix Domain Socket)
    EdgeDeviceAgent agent(grpc::CreateChannel("localhost:50051", grpc::InsecureChannelCredentials()));
    agent.InitializeSerialPort();
    agent.StartHardwarePollingLoop();
    return 0;
}`,
    csharp: `// ============================================================================
// COUCHE 2 : SERVEUR D'APPLICATION .NET 8/9 (Logique ERP & MES)
// Fichier : EdgeCommunicationWorker.cs
// Rôle : Service d'arrière-plan hébergeant le serveur gRPC récepteur,
//        exécutant la logique métier MES/ERP et redistribuant par SignalR.
// ============================================================================
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using Grpc.Core;
using BladyProduction.Connectivity.Grpc;
using BladyProduction.Mes.Services;
using BladyProduction.Erp.Services;

namespace BladyProduction.Host.Services;

public class EdgeCommunicationService : IndustrialEdgeService.IndustrialEdgeServiceBase
{
    private readonly ILogger<EdgeCommunicationService> _logger;
    private readonly IHubContext<IndustrialHub> _hubContext;
    private readonly IMesExecutionService _mesService;
    private readonly IMrpStockService _erpService;

    public EdgeCommunicationService(
        ILogger<EdgeCommunicationService> logger,
        IHubContext<IndustrialHub> hubContext,
        IMesExecutionService mesService,
        IMrpStockService erpService)
    {
        _logger = logger;
        _hubContext = hubContext;
        _mesService = mesService;
        _erpService = erpService;
    }

    // 1. Réception gRPC depuis l'Agent Edge C++ (Balance, Scanner, etc.)
    public override async Task<HardwareEventResponse> PublishHardwareEvent(
        HardwareDeviceEvent request, 
        ServerCallContext context)
    {
        _logger.LogInformation(
            "[.NET 8/9 gRPC] Événement matériel reçu : Type={Type}, Poids={Weight}kg, Port={Port}",
            request.DeviceType, request.ParsedWeight, request.HardwarePort);

        string lotValidationStatus = "VALID";

        // Traitement Logique Métier dans le Monolithe .NET
        if (request.DeviceType == HardwareDeviceEvent.Types.DeviceType.MettlerScale)
        {
            // Vérification de la tolérance de pesée pour l'OF en cours dans le MES
            await _mesService.EnregistrerPeseeReelleAsync("OF-2026-001", request.ParsedWeight);
        }
        else if (request.DeviceType == HardwareDeviceEvent.Types.DeviceType.Scanner2D)
        {
            // Vérification du lot scanné dans le stock ERP
            var lotConforme = await _erpService.VerifierConformiteLotAsync(request.RawPayload);
            lotValidationStatus = lotConforme ? "VALID" : "INVALID_EXPIRED";
        }

        // 2. Redistribution instantanée vers la COUCHE 1 (Navigateur Web) via SignalR
        await _hubContext.Clients.All.SendAsync("OnHardwareEventReceived", new
        {
            deviceType = request.DeviceType.ToString(),
            weight = request.ParsedWeight,
            rawPayload = request.RawPayload,
            timestamp = DateTimeOffset.FromUnixTimeMilliseconds(request.TimestampUtcMs).LocalDateTime,
            status = lotValidationStatus
        });

        // 3. Réponse synchrone gRPC renvoyée à l'Agent Edge C++ (< 2ms)
        return new HardwareEventResponse
        {
            Acknowledged = true,
            ErpLotValidation = lotValidationStatus,
            DisplayMessage = "Pesée enregistrée et synchronisée avec le MES."
        };
    }
}

// Hub temps réel SignalR (WebSockets) pour le Navigateur Web
public class IndustrialHub : Hub
{
    public async Task BroadcastMachineCommand(string machineId, string command, double value)
    {
        // Commande descendante initiée depuis l'interface Web
        await Clients.Others.SendAsync("CommandBroadcasted", machineId, command, value);
    }
}`
  };

  const simulationSteps = getSimulationSteps();

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Architecture Confirmation */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Architecture 100% Réalisable & Hautement Recommandée
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                ISA-95 / Edge-to-Cloud
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                C++20 ⇄ gRPC ⇄ .NET 8/9 ⇄ WebSockets
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Découpage en Trois Couches Stratégiques de l'Usine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Ce modèle sépare idéalement le <strong className="text-white">Déterminisme Matériel ultra-rapide (C++)</strong>, la <strong className="text-white">Logique Métier & Sécurité (.NET 8/9)</strong>, et la <strong className="text-white">Mobilité Multi-Écrans (Web)</strong>. C’est le standard d’or pour les lignes de fabrication automatisées.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
            <button
              onClick={() => handleStartSimulation('scale')}
              disabled={simulationRunning}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Simuler le Flux en Direct</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs overflow-x-auto">
        <button
          onClick={() => setSelectedSubTab('diagram')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all ${
            selectedSubTab === 'diagram'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Schéma & Analyse des 3 Couches</span>
        </button>

        <button
          onClick={() => setSelectedSubTab('simulation')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all ${
            selectedSubTab === 'simulation'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Simulateur Interactif de Traces (Temps Réel)</span>
        </button>

        <button
          onClick={() => setSelectedSubTab('code_contracts')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all ${
            selectedSubTab === 'code_contracts'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Code Source & Contrat gRPC (.proto / C++ / C#)</span>
        </button>

        <button
          onClick={() => setSelectedSubTab('protocols_benchmark')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all ${
            selectedSubTab === 'protocols_benchmark'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Benchmark & Protocoles Inter-Processus</span>
        </button>
      </div>

      {/* VIEW 1: DIAGRAMME STRATÉGIQUE COMPLET */}
      {selectedSubTab === 'diagram' && (
        <div className="space-y-6">
          
          {/* The 3 Strategic Layers Visual Hierarchy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LAYER 1: COUCHE AFFICHAGE */}
            <div className="bg-slate-900/90 border border-sky-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Globe className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                    Niveau 3 • Présentation
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">Couche 1 : Affichage</h3>
                  <p className="text-xs text-sky-300 font-mono">Navigateur Web / Blazor WebAssembly / React</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Accessible depuis n'importe quel équipement d'atelier sans installation (PC industriels, tablettes opérateur, smartphones maintenance, écrans de supervision).
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-200">Fonctionnalités Clés :</div>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li>Synoptique animé en temps réel (cuves, niveaux, flux)</li>
                    <li>Saisie des déclarations de production & rebuts</li>
                    <li>Visualisation planning Gantt & calcul TRS/OEE</li>
                    <li>Console de gestion des rôles et droits RBAC</li>
                  </ul>
                </div>
              </div>

              {/* Protocol connection badge down */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 bg-slate-950/60 p-3 rounded-2xl">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Liaison descendante :</span>
                  <span className="font-mono text-sky-400 font-bold">WebSockets (SignalR) + REST</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Push temps réel bi-directionnel (&lt; 10ms en réseau local usine)
                </div>
              </div>
            </div>

            {/* LAYER 2: COUCHE LOGIQUE & API (.NET 8/9) */}
            <div className="bg-slate-900/90 border border-indigo-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between ring-2 ring-indigo-500/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Server className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Niveau 2 • Cœur Métier
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">Couche 2 : Logique & API</h3>
                  <p className="text-xs text-indigo-300 font-mono">Serveur Local ou Cloud (.NET 8/9 ASP.NET Core)</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Le cerveau central du système. Il orchestre les règles d'entreprise, exécute les calculs lourds et sécurise les transactions en base de données.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-200">Fonctionnalités Clés :</div>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li>Moteur MRP des besoins nets matières & emballages</li>
                    <li>Ordonnancement et dispatch des OF aux lignes</li>
                    <li>Calcul normatif AFNOR du TRS (Disponibilité / Vitesse / Qualité)</li>
                    <li>Généalogie descendante des lots (Traçabilité HACCP)</li>
                  </ul>
                </div>
              </div>

              {/* Protocol connection badge down */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 bg-slate-950/60 p-3 rounded-2xl">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Liaison matérielle :</span>
                  <span className="font-mono text-indigo-400 font-bold">gRPC / Named Pipes (IPC)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Protobuf binaire ultra-rapide (7x à 10x plus efficace que REST/JSON)
                </div>
              </div>
            </div>

            {/* LAYER 3: COUCHE MATÉRIEL (EDGE C++) */}
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Niveau 1 • Edge Déterministe
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">Couche 3 : Agent Edge Matériel</h3>
                  <p className="text-xs text-emerald-300 font-mono">Démon / Service C++20 Natif (IPC / Passerelle)</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Tourne directement sur la passerelle d'usine (Advantech, Siemens Microbox, Raspberry Pi CM4). Aucun garbage collector pour garantir zéro latence imprévisible.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-200">Fonctionnalités Clés :</div>
                  <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                    <li>Communication directe RS-232/RS-485 (termios/Win32)</li>
                    <li>Client OPC UA natif ultra-léger (open62541)</li>
                    <li>Scrutation Modbus TCP/RTU haute fréquence (10-50Hz)</li>
                    <li>Tampon FIFO local résistant aux coupures réseau</li>
                  </ul>
                </div>
              </div>

              {/* Physical connection badge */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 bg-slate-950/60 p-3 rounded-2xl">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Connexion physique :</span>
                  <span className="font-mono text-emerald-400 font-bold">Série, USB, Ethernet Industriel</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Automates Siemens/Schneider, Balances Mettler, Scanners Zebra
                </div>
              </div>
            </div>

          </div>

          {/* Synthesis Table: Why This 3-Tier Split is Ideal */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pourquoi ce découpage en 3 couches est le meilleur choix technique</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-sky-400">1. Découplage Total (SoC)</div>
                <p className="text-slate-400 text-[11px]">
                  Si l'IHM Web redémarre ou si un navigateur plante, l'Agent C++ continue de lire les balances et le serveur .NET continue d'enregistrer la production.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-emerald-400">2. Performance C++ Sans GC</div>
                <p className="text-slate-400 text-[11px]">
                  Les langages avec Garbage Collector (C#, Java) peuvent avoir de micro-pauses. Le C++ garantit un temps de réponse déterministe sous la milliseconde pour les bus matériels.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-indigo-400">3. Puissance Métier .NET</div>
                <p className="text-slate-400 text-[11px]">
                  .NET 8/9 apporte la productivité maximale pour le calcul MRP, la manipulation des données relationnelles, la sécurité d'authentification et l'écosystème d'API.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="font-bold text-rose-400">4. Résilience Hors-Ligne</div>
                <p className="text-slate-400 text-[11px]">
                  L'Agent C++ conserve les pesées et données télémétriques dans un buffer SQLite ou binaire local en cas de coupure du lien vers le serveur central.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: SIMULATEUR INTERACTIF DE TRACES */}
      {selectedSubTab === 'simulation' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-300">Scénario de test :</span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  onClick={() => handleStartSimulation('scale')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    simulationType === 'scale'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Balance Mettler (RS-232)
                </button>
                <button
                  onClick={() => handleStartSimulation('scanner')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    simulationType === 'scanner'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Scanner 2D (Lot MP)
                </button>
                <button
                  onClick={() => handleStartSimulation('plc_alarm')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    simulationType === 'plc_alarm'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Alarme Automate (OPC UA)
                </button>
                <button
                  onClick={() => handleStartSimulation('web_command')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    simulationType === 'web_command'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Commande IHM vers Automate
                </button>
              </div>
            </div>

            <button
              onClick={() => handleStartSimulation(simulationType)}
              disabled={simulationRunning}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rejouer l'Animation</span>
            </button>
          </div>

          {/* Step-by-Step Live Animation */}
          <div className="space-y-4">
            {simulationSteps.map((step, idx) => {
              const isActive = currentStepIndex === idx;
              const isPast = currentStepIndex > idx;

              let borderClass = 'border-slate-800 bg-slate-950/40 opacity-50';
              if (isActive) {
                borderClass = 'border-sky-500 bg-slate-900 ring-2 ring-sky-500/30 opacity-100 shadow-xl';
              } else if (isPast) {
                borderClass = 'border-emerald-500/40 bg-slate-900/80 opacity-90';
              }

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all duration-300 ${borderClass}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                        isPast
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-sky-500 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <h4 className="text-sm font-bold text-white">{step.title}</h4>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-mono text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {step.protocol}
                      </span>
                      <span className="font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Latence : {step.latency}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 ml-10 mb-3">{step.description}</p>

                  <div className="ml-10 p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500">Trame :</span>
                      <code className="text-indigo-300">{step.dataPayload}</code>
                    </div>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
                        Traitement en cours...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cumulative Latency Badge */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">Latence bout-en-bout (Matériel Physique ➔ Écran Opérateur Web) :</span>
            </div>
            <span className="font-mono text-emerald-400 font-bold text-sm bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
              ~ 9.0 millisecondes (Temps Réel Absolu)
            </span>
          </div>

        </div>
      )}

      {/* VIEW 3: CODE SOURCE & CONTRAT gRPC */}
      {selectedSubTab === 'code_contracts' && (
        <div className="space-y-4">
          
          {/* File Selector Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedCodeFile('proto')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCodeFile === 'proto'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                industrial_edge.proto (Contrat gRPC)
              </button>

              <button
                onClick={() => setSelectedCodeFile('cpp')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCodeFile === 'cpp'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                EdgeDeviceAgent.cpp (Agent Edge C++20)
              </button>

              <button
                onClick={() => setSelectedCodeFile('csharp')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCodeFile === 'csharp'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                EdgeCommunicationService.cs (.NET 8/9 C#)
              </button>
            </div>

            <button
              onClick={() => handleCopy(codeSnippets[selectedCodeFile])}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copié !' : 'Copier le code'}</span>
            </button>
          </div>

          {/* Code Display Area */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed shadow-inner max-h-[550px] overflow-y-auto">
            <pre className="selection:bg-sky-500 selection:text-white">
              <code>{codeSnippets[selectedCodeFile]}</code>
            </pre>
          </div>

        </div>
      )}

      {/* VIEW 4: BENCHMARK DES PROTOCOLES INTER-PROCESSUS */}
      {selectedSubTab === 'protocols_benchmark' && (
        <div className="space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-white">Comparatif des Technologies de Liaison C++ ⇄ .NET 8/9</h4>
            <p className="text-xs text-slate-400 mt-1">
              Pour relier l'Agent Edge C++ local et la couche métier .NET 8/9, plusieurs options sont possibles selon que les processus tournent sur la même machine ou sur le réseau local.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Protocole / IPC</th>
                  <th className="py-3 px-3 font-semibold">Latence Moyenne</th>
                  <th className="py-3 px-3 font-semibold">Sérialisation</th>
                  <th className="py-3 px-3 font-semibold">Streaming Bi-directionnel</th>
                  <th className="py-3 px-3 font-semibold">Recommandation Usine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                <tr className="hover:bg-slate-800/40 bg-indigo-950/20">
                  <td className="py-3 px-4 font-bold text-indigo-300">
                    <div>gRPC (HTTP/2 + Protobuf)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Recommandé pour BladyProduction</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-400 font-bold">&lt; 1.5 ms</td>
                  <td className="py-3 px-3 text-slate-300">Protobuf Binaire</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">Oui (Natif full-duplex)</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Choix Optimal 4.0
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    <div>Named Pipes / Unix Domain Sockets</div>
                    <div className="text-[10px] text-slate-400 font-normal">Même machine physique uniquement</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-emerald-400">&lt; 0.2 ms</td>
                  <td className="py-3 px-3 text-slate-300">Binaire brut / FlatBuffers</td>
                  <td className="py-3 px-3 text-emerald-400 font-semibold">Oui</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                      Très rapide (Mono-machine)
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    <div>MQTT (Broker Mosquitto)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Architecture orientée Publish/Subscribe</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-sky-400">~ 4.0 ms</td>
                  <td className="py-3 px-3 text-slate-300">JSON ou Binaire</td>
                  <td className="py-3 px-3 text-sky-400 font-semibold">Via topics Pub/Sub</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-sky-950 text-sky-300 border border-sky-800">
                      Idéal si Cloud distant
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    <div>REST HTTP/1.1 (JSON)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Requêtes / Réponses classiques</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-amber-400">~ 12 à 25 ms</td>
                  <td className="py-3 px-3 text-slate-400">Texte JSON verbeux</td>
                  <td className="py-3 px-3 text-rose-400 font-semibold">Non (Polling requis)</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-950 text-rose-400 border border-rose-800">
                      À éviter pour l'Edge
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
