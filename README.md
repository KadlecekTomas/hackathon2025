# 🚴‍♂️ ObjevKraj.cz - Interaktivní mapa Královéhradeckého kraje

> **Chytrá aplikace pro plánování cyklovýletů a objevování krás Královéhradeckého kraje s pokročilými AI funkcemi**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.14-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-FF6B6B?style=for-the-badge&logo=openai)](https://openai.com/)

## 🎯 O projektu

**KHK Explore** je moderní webová aplikace, která kombinuje interaktivní mapu s pokročilými AI funkcemi pro plánování cyklovýletů a objevování zajímavých míst v Královéhradeckém kraji. Aplikace využívá umělou inteligenci pro inteligentní vyhledávání, doporučování tras a personalizované tipy.

### ✨ Klíčové funkce

- 🗺️ **Interaktivní mapa** s cyklotrasami, přírodními krásami a památkami
- 🤖 **AI-powered vyhledávání** - hledejte přirozeným jazykem
- 🧠 **Chytré doporučování** tras a míst
- 📱 **Responzivní design** pro všechna zařízení
- ❤️ **Oblíbené položky** s lokálním ukládáním
- 🎨 **Moderní UI/UX** s Tailwind CSS
- 📊 **Filtrování a vrstvy** pro snadnou navigaci

## 🤖 AI Funkce - Hlavní výhoda projektu

### 1. **AI Search Box** (`AISearchBox.tsx`)
- **Přirozené vyhledávání**: "Chci přírodní výlet u Trutnova"
- **Inteligentní zpracování dotazů** s rozpoznáváním lokací
- **Kontextové vyhledávání** s vážením různých atributů
- **Hlasové vyhledávání** (připraveno k implementaci)

### 2. **AI Planner** (`AIPlanner.tsx`)
- **Automatické plánování tras** na základě preferencí
- **Inteligentní výběr míst** podle typu aktivity
- **Export do PDF** s personalizovaným plánem
- **Dynamické doporučování** na základě dostupných dat

### 3. **AI Tips Panel** (`AITipsPanel.tsx`)
- **Personalizované tipy** pro uživatele
- **Náhodné doporučení** zajímavých míst
- **Kontextové rady** pro plánování výletů

### 4. **Pokročilé AI vyhledávání** (`useAISearch.ts`)
- **Fuzzy search algoritmus** s vážením polí
- **Normalizace textu** pro lepší výsledky
- **Stop words filtrování** pro relevantní výsledky
- **Rozšířené vyhledávání** s podporou operátorů

### 5. **AI Utilities** (`aiUtils.ts`)
- **Mapování dat** na AI-friendly formát
- **Generování klíčových slov** pro lepší vyhledávání
- **Strojové zpracování textu** s diakritikou
- **Inteligentní sumarizace** míst a tras

## 🛠️ Technický stack

### Frontend
- **Next.js 15.5.5** - React framework s App Router
- **React 19.1.0** - Nejnovější verze React
- **TypeScript 5.0** - Type-safe vývoj
- **Tailwind CSS 4.1.14** - Utility-first CSS framework
- **Framer Motion** - Animace a přechody
- **Leaflet** - Interaktivní mapy

### AI & Vyhledávání
- **Fuse.js** - Fuzzy search knihovna
- **Custom AI algoritmy** - Vlastní implementace pro doporučování
- **Inteligentní text processing** - Normalizace a zpracování dotazů

### Mapy & Geodata
- **Leaflet** - Open source mapová knihovna
- **GeoJSON** - Formát geografických dat
- **Custom mapové komponenty** - Optimalizované pro výkon

### Vývojové nástroje
- **ESLint** - Linting a code quality
- **PostCSS** - CSS preprocessing
- **Turbopack** - Rychlý bundling (Next.js)

## 🚀 Instalace a spuštění

### Předpoklady
- Node.js 18+ 
- npm nebo yarn

### Kroky instalace

1. **Klonování repozitáře**
```bash
git clone <repository-url>
cd hackathon2025
```

2. **Instalace závislostí**
```bash
npm install
# nebo
yarn install
```

3. **Spuštění vývojového serveru**
```bash
npm run dev
# nebo
yarn dev
```

4. **Otevření v prohlížeči**
```
http://localhost:3000
```

### Build pro produkci
```bash
npm run build
npm run start
```

## 📁 Struktura projektu

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Globální styly
│   ├── layout.tsx         # Root layout s metadata
│   └── page.tsx           # Hlavní stránka aplikace
├── components/            # React komponenty
│   ├── AIPlanner.tsx      # 🤖 AI plánovač tras
│   ├── AISearchBox.tsx    # 🤖 AI vyhledávací box
│   ├── AITipsPanel.tsx    # 🤖 AI tipy panel
│   ├── DetailPanel.tsx    # Detailní informace
│   ├── FavoritesPanel.tsx # Oblíbené položky
│   ├── FilterPanel.tsx    # Filtrování
│   ├── LayerControl.tsx   # Ovládání vrstev
│   ├── MapView.tsx        # Hlavní mapová komponenta
│   └── icons/             # Custom ikony
├── hooks/                 # Custom React hooks
│   ├── useAISearch.ts     # 🤖 AI vyhledávání hook
│   ├── useFilters.ts      # Filtrování hook
│   └── useGeoData.ts      # Geografická data hook
└── utils/                 # Utility funkce
    ├── aiUtils.ts         # 🤖 AI utility funkce
    ├── featureUtils.ts    # Práce s mapovými objekty
    ├── geoUtils.ts        # Geografické výpočty
    └── storageUtils.ts    # Lokální úložiště
```

## 🎮 Jak používat AI funkce

### 1. **AI Vyhledávání**
```
Příklady dotazů:
- "Chci přírodní výlet u Trutnova"
- "Kam na kolo v Broumovsku?"
- "Výlet pro děti v okolí Hradce"
- "Cyklotrasy v Krkonoších"
```

### 2. **AI Plánovač**
- Klikněte na tlačítko "AI Plánovač"
- Vyberte preferované typy aktivit
- AI automaticky vybere nejlepší kombinaci míst
- Exportujte plán do PDF

### 3. **AI Tipy**
- Panel s náhodnými doporučeními
- Personalizované tipy na základě vašich preferencí
- Kontextové rady pro plánování

## 🔧 Konfigurace

### Tailwind CSS
Aplikace používá custom Tailwind konfiguraci s brand barvami:
- `brand-sky`: #38bdf8
- `brand-emerald`: #16a34a  
- `brand-amber`: #d97706
- `brand-royal`: #2563eb

### Mapové vrstvy
Aplikace podporuje různé typy vrstev:
- Cyklotrasy
- Přírodní krásy
- Památky a historická místa
- Turistické cíle

## 🎨 Design System

### Barvy
- **Primární**: Zelená (emerald) - příroda, cyklistika
- **Sekundární**: Modrá (sky) - voda, nebe
- **Akcent**: Žlutá (amber) - důležité informace
- **Královská**: Modrá (royal) - památky

### Typografie
- **Font**: Geist Sans (Google Fonts)
- **Mono**: Geist Mono pro kód
- **Responzivní**: Automatické škálování

## 📱 Responzivní design

Aplikace je plně responzivní a optimalizovaná pro:
- 📱 **Mobilní telefony** (320px+)
- 📱 **Tablety** (768px+)
- 💻 **Desktop** (1024px+)
- 🖥️ **Velké obrazovky** (1440px+)

## 🚀 Výkon a optimalizace

- **Turbopack** pro rychlý vývoj
- **Lazy loading** komponent
- **Memoization** pro optimalizaci re-renderů
- **Efficient map rendering** s Leaflet
- **Optimized bundle size** s tree shaking

## 🤝 Přispívání

1. Forkněte repozitář
2. Vytvořte feature branch (`git checkout -b feature/AmazingFeature`)
3. Commitněte změny (`git commit -m 'Add some AmazingFeature'`)
4. Pushněte do branch (`git push origin feature/AmazingFeature`)
5. Otevřete Pull Request

## 📄 Licence

Tento projekt je vytvořen pro hackathon 2025. Všechna práva vyhrazena.

## 👥 Autoři

- **Tým Alftech** - Hackathon 2025
- **AI Implementation** - Vlastní algoritmy pro doporučování
- **Design** - Moderní UI/UX s Tailwind CSS

## 🔮 Budoucí plány

- [ ] **Integrace s externími AI API** (OpenAI, Claude)
- [ ] **Hlasové ovládání** pro hands-free použití
- [ ] **Offline režim** s PWA funkcionalitou
- [ ] **Social features** - sdílení tras s přáteli
- [ ] **Real-time data** - aktuální počasí, doprava
- [ ] **AR navigace** - rozšířená realita pro výlety
- [ ] **Machine learning** - učení z uživatelských preferencí

---

**🚴‍♂️ Objevte krásy Královéhradeckého kraje s pomocí AI!**

*Vytvořeno s ❤️ pro hackathon 2025*
