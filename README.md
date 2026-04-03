# Ouroboros


<p align="center">
<img src="https://github.com/DRAGGON-Lab/Ouroboros/blob/main/docs/Ouroboros_logotype.png" alt="Ouroboros_logotype" width="400"/>
</p>

Ouroboros is a software platform for genome exploration, visualization, and sequence-driven design. It begins with a reference genome from GenBank and presents it through a clean, sequence-centric interface that integrates genomic annotations, promoter activity measurements, search, and future generative design workflows.

The first organism supported in Ouroboros is *Escherichia coli* K-12 MG1655, using the GenBank record [`U00096.3`](https://www.ncbi.nlm.nih.gov/nuccore/U00096.3).

## Vision

Ouroboros is designed as a full-screen genome exploration environment where DNA sequence is the central visual element. Rather than focusing only on abstract genomic coordinates, the platform emphasizes direct interaction with nucleotide sequence, strand-aware genomic features, and promoter activity signals across the genome.

The long-term goal is to create a system that not only supports genome browsing, but also enables users to search, interpret, predict, and generate functional DNA sequences using genomic context and experimental data.

## Core concepts

### Sequence-centered genome viewer

The main interface displays a selected genomic segment as colored DNA letters across the full screen. The viewer supports multiple window sizes, initially:

- 1,500 bp
- 5,000 bp
- 10,000 bp

This allows users to inspect local sequence composition while retaining nearby genomic context.

### Strand-aware feature tracks

Ouroboros uses two horizontal feature tracks to represent genomic annotations:

- **Top track:** features on the 5' → 3' strand
- **Bottom track:** features on the 3' → 5' strand

Feature glyphs on the reverse strand are flipped so their orientation is visually meaningful. These tracks are rendered along two black guide lines that frame the sequence view.

From the GenBank file, Ouroboros retrieves and displays annotations such as:

- genes
- CDSs
- RNAs

Feature glyphs are colored by type. For the initial design:

- **Promoters** are shown in blue
- **CDSs** are shown in green

When a user clicks on a feature, Ouroboros copies or exposes a link to the corresponding definition or external record, such as a SynBioHub entry or GenBank reference.

### Promoter activity overlay

A defining feature of Ouroboros is the ability to display measured promoter activity as a per-base signal across the genome. This signal is rendered as a semi-transparent bar plot over the DNA sequence, allowing users to see activity patterns in direct sequence context.

Regions whose promoter activity exceeds a configurable threshold are marked as inferred promoter features in the viewer. This makes it possible to compare curated annotations with experimentally supported regulatory activity.

## User interface

The main DNA visualization occupies the full screen. Overlaid on top are two translucent controls:

- **Search** on the left
- **Generate** on the right

These controls expand into workflow panels that provide additional functionality.

## Search

The **Search** panel is intended to support multiple entry points into the genome.

### Search by sequence
Users can:

- paste a DNA sequence
- upload an SBOL file
- upload a GenBank file
- upload a FASTA file

Ouroboros uses sequence similarity search, such as BLAST, to navigate to the most similar genomic region and present the top-ranked matches.

### Search by promoter activity
Users can search for genomic regions with similar promoter activity patterns. After a search, Ouroboros returns ranked retrievals that can be explored directly in the viewer.

### Search by position
Users can enter:

- a single genomic coordinate
- a genomic range

The selected position or interval is centered in the viewing window and highlighted.

## Generate

The **Generate** panel is designed for future predictive and generative workflows built on the Ouroboros backend.

### Predict on user sequence
Users will be able to provide an input sequence and generate a visualization of that sequence with predicted:

- CDSs
- promoters
- promoter activity at base-pair resolution

This will extend the same viewer paradigm used for the reference genome to user-supplied DNA.

### Generate sequences from target activity
Users will also be able to specify a desired promoter activity profile. Ouroboros will then generate candidate sequences predicted to match that activity and display:

- top generated sequence candidates
- top similar sequences among generated results
- top similar activity patterns from experimental genomic data

This connects genome exploration with sequence design and functional engineering.

## Initial scope

The first implementation of Ouroboros focuses on:

- loading the *E. coli* MG1655 genome from GenBank
- rendering sequence-centered genome windows
- displaying strand-aware annotations
- overlaying promoter activity measurements
- identifying promoter regions above a threshold
- supporting coordinate- and sequence-based navigation

## Longer-term goals

Future versions of Ouroboros aim to support:

- additional bacterial genomes
- richer annotation and regulatory layers
- upload and visualization of SBOL designs
- predictive modeling of genomic function
- sequence generation for target regulatory behavior
- tighter interoperability with SynBioHub and related synthetic biology standards

## Why Ouroboros?

Genome browsers are powerful, but they often prioritize coordinate tracks over direct sequence interpretation. Ouroboros is built around the idea that DNA sequence itself should remain visible, interactive, and functionally interpretable. By integrating sequence, annotations, promoter activity, search, and generation into one interface, Ouroboros aims to become a platform for both genome analysis and synthetic biology design.

## Status

Ouroboros is currently in early development. The architecture, interface, and workflows are being defined around a first implementation using *E. coli* MG1655 as the reference genome.

## Reference genome

- *Escherichia coli* str. K-12 substr. MG1655
- GenBank accession: [`U00096.3`](https://www.ncbi.nlm.nih.gov/nuccore/U00096.3)

## Repository Layout

The repository follows this scaffold:

```text
Ouroboros/
├─ frontend/                      # Next.js + TypeScript viewer UI
│  ├─ app/
│  ├─ components/
│  ├─ features/
│  ├─ shared/types/ts/
│  └─ tests/ + __tests__/
├─ backend/                       # FastAPI application + schema/export tooling
│  ├─ app/
│  │  ├─ api/v1/
│  │  ├─ core/
│  │  └─ schemas/
│  ├─ scripts/export_api_contract.py
│  └─ tests/
├─ shared/api-contract/           # Generated OpenAPI + JSON Schema artifacts
│  ├─ openapi.json
│  └─ schemas/
├─ data/
│  └─ raw/
│     └─ U00096.gb                # MG1655 GenBank source (accession U00096.3)
├─ docs/
├─ Makefile
├─ ARCHITECTURE.md
└─ PRODUCT.md
```

## Quick Start

### 1) Create and activate a Conda environment

```bash
conda create -n ouroboros python=3.11 -y
conda activate ouroboros
```

What this does:

- `conda create -n ouroboros python=3.11 -y` creates an isolated environment named `ouroboros` with Python 3.11.
- `conda activate ouroboros` switches your shell to that environment so backend dependencies install into the project-specific runtime.

### 2) Install dependencies

```bash
make install
```

### 3) Run the frontend (terminal A)

```bash
make frontend-dev
```

### 4) Run the backend (terminal B)

```bash
make backend-dev
```

### Required language/tool versions

| Tool | Version used by repository |
| --- | --- |
| Python | `>=3.11` |
| TypeScript | `5.8.2` |

### Optional quality checks

```bash
make lint
make test
```

## Shared Contract Workflow

Ouroboros keeps backend API definitions and frontend-consumable schema artifacts synchronized via generated files in `shared/api-contract/`.

1. **Define or update backend schemas/routes** in `backend/app/schemas/` and `backend/app/api/v1/routes.py`.
2. **Generate contract artifacts** from the FastAPI app and Pydantic models:
   ```bash
   cd backend
   python scripts/export_api_contract.py
   ```
3. **Review generated outputs**:
   - `shared/api-contract/openapi.json`
   - `shared/api-contract/schemas/*.schema.json`
4. **Consume contract updates in frontend types/adapters** (for example, `frontend/shared/types/ts/` and viewer API mapping code).

This workflow keeps API behavior, serialized schema artifacts, and UI integration aligned during iteration.

## Data Placement

Reference organism data is stored at:

- `data/raw/U00096.gb` for *E. coli* MG1655 (GenBank accession `U00096.3`).

Treat this file as the canonical raw genome source for ingestion/parsing steps.

## Milestone Status

### M1 (current baseline)

<p align="center">
<img src="https://github.com/DRAGGON-Lab/Ouroboros/blob/readme-update/docs/screenshot_ouroborosGUI.png" alt="Ouroboros_screenshot" width="400"/>
</p>

| Area | M1 done criteria | Current status |
| --- | --- | --- |
| Repo scaffolding | Frontend, backend, shared contracts, docs, data directories established | ✅ Done |
| Backend API baseline | FastAPI app exposes health + region/annotation endpoints with typed response models | ✅ Done |
| Shared contracts | OpenAPI + JSON schema export script produces artifacts under `shared/api-contract/` | ✅ Done |
| Frontend viewer baseline | Viewer route and API adapter exist with centered-window coordinate behavior | ✅ Done |
| Reference data wiring | MG1655 source file placed under `data/raw/U00096.gb` | ✅ Done |
| End-to-end biological outputs | Real GenBank parsing + full activity/feature integration | 🟡 Intentionally stubbed (mock/placeholder outputs in M1) |
| Search/generate workflows | Production sequence search, activity retrieval, and generation UX | 🟡 Intentionally stubbed for post-M1 milestones |

## Scientific semantics

To keep interpretation scientifically explicit:

- **Curated vs inferred annotations**
  - **Curated** annotations come directly from trusted source records/manual curation.
  - **Inferred** annotations are algorithmic or threshold-derived candidates and should be labeled as such.
- **Measured vs predicted activity**
  - **Measured** activity comes from experimental observations.
  - **Predicted** activity comes from model output and must not be presented as experimentally validated.

UI labels and API fields should preserve these distinctions at all times.
