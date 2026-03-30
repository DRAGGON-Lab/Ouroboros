# Ouroboros

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
