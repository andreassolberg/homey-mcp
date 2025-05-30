# Homey MCP Server

En Model Context Protocol (MCP) server for å integrere med Homey Pro smart home system. Denne serveren gir tilgang til Homey-enheter, soner, variabler og logikk gjennom MCP-protokollen.

## 🏠 Funksjonalitet

- **Enheter**: Hent og søk i alle Homey-enheter
- **Soner**: List alle soner i hjemmet ditt
- **Variabler**: Tilgang til Homey-variabler
- **Logikk**: Hent informasjon om logikkflyt
- **Temperatur**: Spesialiserte funksjoner for temperatursensorer
- **Cache**: Automatisk caching av data for bedre ytelse

## 📁 Prosjektstruktur

```
homey-mcp/
├── src/                     # Hovedkildekode
│   ├── server.js           # MCP server hovedfil
│   ├── homey.js           # Homey API klient
│   ├── entities.js        # Data modeller (Device, Zone, Variable, etc.)
│   └── index.js           # Standalone test script
├── scripts/                # Test og verifikasjonsscripts
│   ├── test-mcp.sh        # Hovedtestscript
│   ├── verify-mcp.sh      # Rask verifikasjon
│   ├── test-temperature.sh # Test temperaturfunksjoner
│   ├── interactive-test.sh # Interaktiv testing
│   ├── status-check.sh    # Statussjekk
│   └── final-verification.sh # Omfattende test
├── config/                 # Konfigurasjonsfiler
│   └── .env.example       # Eksempel på miljøvariabler
├── cache/                  # Cache-filer (auto-generert)
│   ├── devices.json
│   ├── zones.json
│   ├── variables.json
│   └── logic.json
├── .env                    # Dine miljøvariabler
├── package.json
├── claude_desktop_config.json # Claude Desktop konfigurasjon
└── README.md
```

## 🚀 Oppsett

### 1. Klon og installer avhengigheter

```bash
git clone <repository-url>
cd homey-mcp
npm install
```

### 2. Konfigurer miljøvariabler

Kopier eksempelfilen og fyll inn dine verdier:

```bash
cp config/.env.example .env
```

Rediger `.env` og legg inn:

- `HOMEY_TOKEN`: Din Homey API token (få denne fra [Homey Developer Tools](https://tools.developer.homey.app/))
- `HOMEY_ID`: Din Homey ID (finnes i Homey Pro sine innstillinger)

### 3. Test oppsettet

```bash
# Test grunnleggende funksjonalitet
npm start

# Test MCP server
npm run mcp
```

## 🔧 Bruk

### Som MCP Server

Serveren kan brukes med Claude Desktop eller andre MCP-kompatible klienter:

```bash
npm run mcp
```

### Som Standalone Script

For testing og utvikling:

```bash
npm start
```

### Med Claude Desktop

Legg til følgende i din `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "homey": {
      "command": "node",
      "args": ["/path/to/homey-mcp/src/server.js"],
      "env": {
        "HOMEY_TOKEN": "din_token_her",
        "HOMEY_ID": "din_homey_id_her"
      }
    }
  }
}
```

## 🛠️ Tilgjengelige Verktøy

### `get_homey_devices`

Hent alle enheter eller filtrer etter sone.

**Parametere:**

- `zone` (valgfri): Filtrer enheter etter sone-navn

### `search_homey_devices`

Søk etter enheter basert på navn eller egenskaper.

**Parametere:**

- `query`: Søketekst

### `get_homey_zones`

Hent alle soner i hjemmet.

### `get_homey_variables`

Hent alle Homey-variabler.

### `get_homey_logic`

Hent informasjon om logikkflyt.

### `get_temperature`

Hent temperaturdata fra sensorer.

**Parametere:**

- `zone` (valgfri): Filtrer etter sone
- `deviceId` (valgfri): Hent fra spesifikk enhet

## 🧪 Testing

Prosjektet inkluderer flere testscripts i `scripts/` mappen:

```bash
# Rask verifikasjon
./scripts/verify-mcp.sh

# Omfattende testing
./scripts/test-mcp.sh

# Test temperaturfunksjoner
./scripts/test-temperature.sh

# Interaktiv testing
./scripts/interactive-test.sh

# Statussjekk
./scripts/status-check.sh

# Final verifikasjon
./scripts/final-verification.sh
```

## 📦 Avhengigheter

- **@modelcontextprotocol/sdk**: MCP SDK for server-implementasjon
- **dotenv**: Miljøvariabel-håndtering

## 🔒 Sikkerhet

- API tokens og sensitive data lagres i `.env` filen
- Cache-filer kan inneholde sensitive data og er ekskludert fra git
- Bruk `.copilotignore` for å ekskludere sensitive filer fra AI-assistanse

## 📝 Utvikling

### Legg til nye funksjoner

1. Implementer logikken i `src/homey.js`
2. Legg til MCP tool definition i `src/server.js`
3. Oppdater entiteter i `src/entities.js` om nødvendig
4. Lag tester i `scripts/` mappen

### Cache-håndtering

Serveren bruker automatisk caching for å redusere API-kall til Homey:

- Cache lagres i `cache/` mappen
- Cache kan aktiveres/deaktiveres via alternativer
- Cache filer oppdateres automatisk ved behov

## 🐛 Feilsøking

1. Sjekk at `.env` filen er korrekt konfigurert
2. Verifiser at Homey Pro er tilgjengelig og online
3. Kontroller at API token har nødvendige tillatelser
4. Kjør testscripts for å diagnostisere problemer
5. **MCP-kompatibilitet**: Debug-meldinger er fjernet fra serveren for å sikre ren JSON-kommunikasjon med Claude Desktop

### Vanlige problemer

- **"Unexpected token" feil i Claude**: Dette skyldes debug-utskrifter til stdout. Alle console.log/debug-meldinger er fjernet fra MCP serveren.
- **Cache problemer**: Slett `cache/` mappen og la serveren regenerere cache-filene.
- **Environment variable problemer**: Sjekk at `.env` filen er i rot-mappen og inneholder riktige verdier.

## 📄 Lisens

MIT License
