# thassi.3dprint — Thassi 3D Druck Studio & BambuLab LAN-Modul

Full-Stack Home Assistant & Thassi Modul für **KI-gestützte 3D-Objektgenerierung (Antigravity / Google Gemini)**, **interaktive 3D-Bearbeitung per User-Prompt**, direkten **Export in druckbare Formate (`.3mf`, `.stl`, `.gcode`)** und **direkte BambuLab LAN-Kommunikation**.

- **Repository:** [`https://github.com/tsimhofer/thassi.3dprint`](https://github.com/tsimhofer/thassi.3dprint)
- **Importiert in Thassi Monorepo:** `apps/3d-print` & `thassi_3d_print` (Standalone Home Assistant Add-on)
- **Live Editor-Oberfläche:** `http://192.168.188.92:8099/apps/3d-print/`
- **Live Dashboard Mini-Preview:** `http://192.168.188.92:8099/` (`#widget-3dprint` im Thassi Horizon Dashboard)

---

## 1. Netzwerk-Analyse & Drucker-Identifikation (`192.168.188.0/24`)

### Erkannter Drucker & Slicer-Profil
Aus der lokalen Slicer-Konfiguration (`ElegooSlicer.conf` / BambuStudio-kompatibles Profil auf dem Dev-Host `192.168.188.46`) sowie dem Subnetz-Scan (`192.168.188.0/24`, Fritz!Box 6890 LTE `192.168.188.1`) wurde folgendes Druckersystem ermittelt:

| Eigenschaft | Wert |
|---|---|
| **Druckermodell** | **Bambu Lab P1S** (`Bambu Lab P1S 0.4 nozzle`, Modell-Code `C12`) |
| **Hersteller / Vendor** | Bambu Lab (`BBL`) |
| **Bauraum (Build Volume)** | **$256 \times 256 \times 256\text{ mm}$** (Textured PEI Plate) |
| **Düsendurchmesser** | $0.4\text{ mm}$ (Standard-Schichthöhe $0.20\text{ mm}$) |
| **Standard-Filament** | Bambu PLA Basic ($220\,^\circ\text{C}$ Düse / $60\,^\circ\text{C}$ Druckbett) |
| **Subnetz / Gateway** | `192.168.188.0/24` (Gateway `192.168.188.1`, WLAN `Obi-WLAN Kenobi`) |
| **Aktueller Netzwerkstatus** | Physischer Drucker aktuell ausgeschaltet / im Standby (Schreibtisch-Plug `192.168.188.90` `switch.buro_og_plug_90` = `0 W`, `192.168.188.100` inaktiv). Sobald der Drucker eingeschaltet wird, erkennt der integrierte Live-Scanner (`POST /api/apps/3d-print/printer/discover`) ihn automatisch per SSDP & Port-Scan (`8883`/`990`). Bis dahin arbeitet das Modul nahtlos im **Digital-Twin-Simulationsmodus** oder direkten **LAN-Modus**. |

---

## 2. BambuLab API-Zugriff & Direkte Netzwerkkommunikation (LAN-Protokolle)

BambuLab-Drucker (P1S, P1P, X1C, A1, A1 mini) nutzen für die direkte lokale Steuerung ohne Cloud-Zwang vier Netzwerkprotokolle:

### 2.1 SSDP Auto-Discovery (UDP Ports `2021`, `1990`, `1900`)
- **Multicast-Adresse:** `239.255.255.250` (bzw. Subnetz-Broadcast `192.168.188.255`)
- **Such-Header (`M-SEARCH`):** `ST: urn:bambulab-com:device:3dprinter:1`
- **Antwort-Header des Druckers:**
  - `USN`: **15-stellige Seriennummer** (z. B. `01S00C...` für P1S, `01P...` für P1P, `00M...` für X1C)
  - `Location`: Lokale IPv4-Adresse (`192.168.188.x`)
  - `DevName.bambu.com`: Konfigurierter Gerätename
  - `DevModel.bambu.com`: Interner Modellcode (`C12` = P1S, `C11` = P1P, `BL-P001` = X1C, `N2S` = A1, `N1` = A1 mini)
  - `DevVersion.bambu.com`: Firmware-Version
  - `DevConnect.bambu.com`: Verbindungsmodus (`lan` / `cloud`)

### 2.2 MQTT over TLS — Echtzeit-Telemetrie & Steuerung (TCP Port `8883`)
- **Broker-URL:** `mqtts://<PRINTER_IP>:8883`
- **TLS-Optionen:** `rejectUnauthorized: false` (selbstsigniertes BambuLab Gerätezertifikat; das CN-Feld des Serverzertifikats enthält ebenfalls die Seriennummer!)
- **Authentifizierung:**
  - **Username:** `bblp` (fest codiert auf allen BambuLab-Druckern)
  - **Passwort:** **8-stelliger LAN Access Code** (ablesbar am Drucker-Display unter *Einstellungen → WLAN / LAN Only Mode → Access Code*)
- **MQTT-Topics:**
  - **Status & Telemetrie empfangen (Subscribe):** `device/<SERIAL_NUMBER>/report`
  - **Steuerbefehle senden (Publish):** `device/<SERIAL_NUMBER>/request`
- **Wichtige JSON-Payloads:**
  - **Vollständigen Status anfordern (`pushall`):**
    ```json
    { "pushing": { "sequence_id": "1", "command": "pushall" } }
    ```
  - **Druck pausieren / fortsetzen / stoppen:**
    ```json
    { "print": { "sequence_id": "2", "command": "pause" } }
    { "print": { "sequence_id": "3", "command": "resume" } }
    { "print": { "sequence_id": "4", "command": "stop" } }
    ```
  - **Bauraum-Licht (Chamber Light) schalten:**
    ```json
    { "system": { "sequence_id": "5", "command": "ledctrl", "led_node": "chamber_light", "led_mode": "on" } }
    ```
  - **Druckgeschwindigkeit setzen (`1` = Leise 50%, `2` = Standard 100%, `3` = Sport 124%, `4` = Ludicrous 166%):**
    ```json
    { "print": { "sequence_id": "6", "command": "print_speed", "param": "2" } }
    ```
  - **Direkten G-Code ausführen:**
    ```json
    { "print": { "sequence_id": "7", "command": "gcode_line", "param": "G28\nM104 S220\nM140 S60\n" } }
    ```
  - **3MF-Druckauftrag starten:**
    ```json
    {
      "print": {
        "sequence_id": "8",
        "command": "project_file",
        "param": "Metadata/plate_1.gcode",
        "url": "ftp:///thassi_model.3mf",
        "subtask_name": "thassi_model",
        "bed_type": "auto",
        "timelapse": false,
        "bed_leveling": true,
        "flow_cali": true,
        "vibration_cali": true,
        "use_ams": false
      }
    }
    ```

### 2.3 Implicit FTPS — Direkter Datei-Upload (`.3mf` / `.gcode`, TCP Port `990`)
- **Endpunkt:** `ftps://bblp:<LAN_ACCESS_CODE>@<PRINTER_IP>:990/`
- **Zielpfad:** `/` (Root der microSD-Karte) oder `/cache/`
- **Ablauf:** `.3mf`- oder `.gcode`-Datei per Implicit TLS auf Port `990` hochladen und anschließend per MQTT `project_file` oder `gcode_file` auf Topic `device/<SERIAL_NUMBER>/request` starten.

### 2.4 Bauraum-Kamera-Stream (Chamber Camera)
- **P1S / P1P / A1 / A1 mini:** **TCP Port `6000`** (TLS-Stream mit 80-Byte Authentifizierungs-Header: `bblp` + Access Code, liefert kontinuierliche JPEG-Frames).
- **X1C / X1E:** **TCP Port `322`** (`rtsps://bblp:<LAN_ACCESS_CODE>@<PRINTER_IP>:322/streaming/live/1`).

---

## 3. Architektur & Komponenten

### 3.1 KI 3D-Generator & Druck-Compiler (`src/shared/mesh-engine.ts` & `src/backend/ai-cad-generator.ts`)
- **KI-CAD-Synthese:** Nutzt den in Home Assistant hinterlegten Google Gemini API-Key (`google_generative_ai_conversation`) kombiniert mit der deterministischen **Antigravity Parametric CAD Engine**.
- **Prompt-basierte Erstellung & Änderung:**
  - `POST /api/apps/3d-print/projects/generate`: Erstellt aus einem natürlichsprachigen Prompt ein neues 3D-Modell.
  - `POST /api/apps/3d-print/projects/modify`: Verändert das aktive 3D-Objekt per User-Prompt (z. B. *„Mache das Objekt 25% höher, färbe es Bambu-Grün und füge ein 8mm Mittelloch hinzu“*).
- **Integrierter 3D-Exporter & Slicer (`GET /api/apps/3d-print/projects/export?format=3mf|stl|gcode`):**
  - **`.3MF` (BambuStudio / ElegooSlicer Paket):** Erzeugt ein valides ZIP-basiertes 3MF-Archiv inkl. `3D/3dmodel.model` XML-Mesh und `Metadata/model_settings.config`.
  - **`.STL` (Binary STL):** Wasserdichtes binäres Dreiecksnetz.
  - **`.GCODE` (Bambu Lab P1S Layer-Slicer):** Vollständiger P1S-kompatibler G-Code mit Start-/End-Makros, Perimeter-Schleifen, Infill und E-Achsen-Extrusion.

### 3.2 Zwei Oberflächenkomponenten in Home Assistant
1. **3D Druck Studio (Editor-Seite — `/apps/3d-print/` & Add-on `thassi_3d_print`):**
   - Interaktiver 60fps 3D-Viewport auf einem $256 \times 256\text{ mm}$ Bambu P1S Druckbett (Drehen, Schwenken, Zoomen, Solid / Wireframe / Röntgen / Slicer-Layer-Vorschau).
   - KI-Prompt-Studio zum Erstellen und iterativen Verändern des 3D-Objekts.
   - Direkt-Download als **`.3MF`**, **`.STL`** und **`.GCODE`** sowie Direkt-Druck an den BambuLab P1S.
   - BambuLab LAN-Scanner & API-Konfigurator.
2. **Dashboard Mini-Preview (`#widget-3dprint` im Thassi Horizon Dashboard):**
   - Zeigt das aktive **Miniatur-3D-Objekt** interaktiv drehbar direkt in der Dashboard-Kachel.
   - Integrierte **Fortschrittsanzeige** (`%`, Layer-Zähler, Restzeit, Düsen-/Betttemperatur).
   - **Platzhalter-Modus** (rotierendes Wireframe-Prisma mit Hinweis *„Kein 3D-Projekt · Platzhalter aktiv“*), sobald kein 3D-Projekt ausgewählt ist.
   - Schnell-Prompt-Eingabe zum direkten Ändern des 3D-Objekts aus dem Dashboard heraus.
