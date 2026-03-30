# ARCHITECTURE.md

## Overview

Ouroboros is a genome exploration platform for visualizing DNA sequence, genomic annotations, and promoter activity in a sequence-centric interface.

The initial target organism is *Escherichia coli* str. K-12 substr. MG1655 using the genome record `U00096.3`.

The system is designed around four core capabilities:

1. **Genome viewing**  
   Render a selected genomic window with DNA letters, strand-aware features, and activity overlays.

2. **Annotation access**  
   Parse and expose curated genome annotations such as genes, CDSs, and RNAs.

3. **Search and navigation**  
   Allow users to navigate by coordinate, range, sequence similarity, or activity profile.

4. **Prediction and generation**  
   Support future modules that predict features/activity on user sequences and generate sequences conditioned on a target activity profile.

---

## Architectural goals

The architecture should satisfy the following goals:

- **Modular**: genome ingestion, annotation parsing, rendering, search, and ML services must remain decoupled.
- **Extensible**: start with one genome and one activity dataset, but support multiple organisms and track types later.
- **Responsive**: the genome viewer must remain fast while rendering windows of 1.5 kb, 5 kb, and 10 kb.
- **Scientifically explicit**: curated annotations, inferred annotations, measured activity, and predicted activity must always remain distinct.
- **Testable**: every backend service and non-trivial frontend logic should be independently testable.
- **Interoperable**: support external biology formats such as GenBank, FASTA, and SBOL.

---

## System boundaries

### In scope for v1

- One reference genome: MG1655 (`U00096.3`)
- Genome region viewer
- GenBank-derived annotations
- Per-base promoter activity track from precomputed data
- Threshold-based promoter highlighting
- Coordinate/range navigation
- Basic sequence search
- Feature selection and external links

### Out of scope for v1

- Large-scale comparative genomics
- Multi-user collaboration
- Real-time model training
- Full sequence generation pipeline
- Full SynBioHub publishing/editing
- Generalized pangenome support

---

## High-level system design

Ouroboros is split into five major layers:

### 1. Frontend application
Responsible for:
- rendering the genome viewer
- handling interaction and zoom/navigation
- showing feature details
- exposing Search and Generate panels
- retrieving data from backend APIs

Suggested stack:
- Next.js
- React
- TypeScript

### 2. Backend API
Responsible for:
- serving genome regions
- serving annotations for a region
- serving activity signal tracks
- serving search results
- coordinating prediction/generation requests

Suggested stack:
- FastAPI
- Python

### 3. Data processing layer
Responsible for:
- parsing GenBank and related files
- normalizing feature coordinates and strand metadata
- preprocessing activity data
- preparing indexed data structures for fast regional access

Suggested stack:
- Python
- Biopython
- internal typed schemas

### 4. Search layer
Responsible for:
- sequence similarity search
- coordinate/range lookup
- activity-based retrieval
- ranking hits and returning genomic targets

This may start as a simple local search service and later evolve to BLAST-backed or indexed search.

### 5. Prediction/generation layer
Responsible for:
- promoter prediction
- CDS prediction
- per-base promoter activity prediction
- sequence generation for a desired activity profile

This should be a separate service boundary, even if implemented later.

---

## Logical component diagram

```text
User
  |
  v
Frontend UI
  |
  v
Backend API
  |-----------------------> Genome data store
  |-----------------------> Annotation store
  |-----------------------> Activity signal store
  |-----------------------> Search service
  |-----------------------> Prediction service (future)
  |-----------------------> Generation service (future)
