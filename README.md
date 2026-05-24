# 🌌 Harmonic Universe

A high-performance, full-stack world-building and multiverse synchronization platform. The application allows users to generate complex fictional universes, establish relational data bindings between entities (characters, locations, and narrative notes), and render data states dynamically. Built on a decoupled stack, it pairs an immutable Rule-Engine-System (RES) framework on the frontend with a scalable relational persistence layer on the backend.

---

## 🏗️ System Architecture & Paradigm

The platform is engineered using a highly predictable, data-driven Rule-Engine-System (RES) pattern to enforce an absolute separation of concerns across distributed nodes.

**The Rules (Data Schemas):** Strictly typed contracts governing data structures and entity shapes. Enforced via TypeScript interfaces inside `frontend/src/types/` and structured Python database models within `backend/models/`.

**The Engine (Core Processing Logic):** Redux Toolkit slices, dynamic actions (`/features`), and specialized state reducers (`store.ts`). This layer acts as a deterministic state machine, modifying universes, managing authentications, tracking location mapping, and verifying entity properties.

**The System (Side-Effects & Rendering Layers):** The visible execution layer. It processes engine updates to output changes to the DOM across modular layouts (`/components`), delivers immediate feedback through specialized hooks (`useAudioToolbox.ts`), and manages data gateway mutations via `apiSlice.ts`.

---

## 🛠️ Tech Stack & Deployment

### Frontend Infrastructure

- **Language:** TypeScript (Strict structural typing for deep schema validation)
- **Core Framework:** React 19 (Functional architecture leveraging high-performance custom hooks)
- **State Management:** Redux Toolkit & Redux Persist (Centralized, immutable global store tracking)
- **Package Manager:** pnpm (Content-addressable storage optimizing deterministic dependency trees)
- **Build Pipeline:** Vite 7 (Hot module replacement and production compilation)
- **Deployment:** Vercel (Edge network hosting)

### Backend Infrastructure

- **Language & Core:** Python (RESTful API generation)
- **Database Engine:** MySQL via MySQL Workbench (Relational constraint management and foreign key normalization mapping)
- **Security Layer:** Stateful JSON Web Token (JWT) tracking with server-side validation and database-backed revoking (`token_blocklist.py`)
- **Deployment:** Railway (Containerized environment)

---

## 🚀 Key Architectural Features & Portfolio Highlights

### 1. Advanced Relational Graph Mapping

The application models intricate associations between multi-layered entities (universes -> locations -> characters -> notes). The backend explicitly structures these non-linear connections via relational crossing entities (`associations.py`), allowing the frontend to pull down complex graphs and cleanly map them visually inside an interactive `ConnectionGallery.tsx`.

### 2. High-Capacity Dynamic UI Systems

To scale entity management without inflating component weight, the application routes operations through a generic, polymorphically reused engine layer (`EntityManager.tsx`, `GenericModal.tsx`, `useSetterToolbox.ts`). This allows universal CRUD execution across all five data domains using unified, reusable interfaces.

### 3. Stateful Security & Session Management

Engineered a secure, industry-standard authentication boundary. The system processes login states securely via dedicated endpoint nodes (`auth.py`), validates sessions securely inside custom hooks (`useAuthToolbox.ts`), and ensures instantaneous user revocation capabilities by storing invalidated user keys securely inside a dedicated `token_blocklist` database table.

### 4. Interactive Feedback & State Hydration

Leverages real-time visual loaders (`Spinner.tsx`), multi-point custom error boundaries (`ErrorDisplay.tsx`), and responsive system feedback loops using specialized hooks (`useAudioToolbox.ts`) to maintain high-quality human-computer interaction (HCI) standards during massive state transitions.

---

## 📂 Project Directory Structure

```
├── backend/                       # Python REST API Core
│   ├── config/                    # Core environmental & database initialization
│   ├── models/                    # Relational Schemas (Rules Layer)
│   │   ├── associations.py        # Entity graphing connections
│   │   ├── token_blocklist.py     # Revoked authentication registry
│   │   └── [users/universes/etc]  # Core domain data models
│   ├── routes/                    # API Route Controllers (System Boundary)
│   ├── seed/                      # Mock relational testing injectors
│   ├── utils.py                   # Isolated utility computations
│   ├── app.py                     # Primary backend application mount point
│   └── requirements.txt           # Python dependency locks
│
├── frontend/                      # React 19 / TypeScript Web Interface
│   ├── public/                    # Scalable vector graphics and static assets
│   ├── src/
│   │   ├── api/                   # RTK Query / Network communication gates
│   │   │   └── apiSlice.ts        # Centralized async fetch controller
│   │   ├── assets/                # Local runtime audio and visual media
│   │   ├── components/            # UI System Modules
│   │   │   ├── Auth/              # Session acquisition gateways
│   │   │   ├── Dashboard/         # Core application command center
│   │   │   ├── Universal/         # Polymorphic UI Engines (EntityManager, Modals)
│   │   │   └── [Entity Folders]   # Target presentation components
│   │   ├── features/              # Engine Layer: Redux slices and standalone actions
│   │   ├── hooks/                 # Lifecycle layers (useAudioToolbox, useAuthToolbox)
│   │   ├── store/                 # Redux structural core configurations
│   │   ├── types/                 # Pure structural TypeScript schemas (Rules)
│   │   ├── App.tsx                # Client-side router engine
│   │   └── main.tsx               # Production application DOM mount
│   ├── package.json               # Package declarations
│   └── pnpm-lock.yaml             # Strict deterministic lockfile
└── README.md                      # Project architecture overview
```

---

## ⚡ Local Setup and Installation

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Python (v3.10 or higher)
- MySQL Instance

### 1. Backend Setup

Navigate to the backend directory, initialize a clean environment, isolate your dependencies, and run your migration seed scripts:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Ensure your MySQL connection parameters are assigned in your env
python app.py
```

### 2. Frontend Setup

Open a secondary terminal node, navigate to the frontend folder, mount your cached node dependencies securely, and spin up your local compilation engine:

```bash
cd frontend
pnpm install
pnpm dev
```

The client dashboard will launch at `http://localhost:5173`, automatically proxying relational requests to your active backend application thread.