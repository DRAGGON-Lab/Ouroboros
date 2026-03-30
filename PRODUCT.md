# Ouroboros

## Goal
Ouroboros is a genome exploration platform for visualizing DNA sequence, strand-aware genomic features, and promoter activity along bacterial genomes.

## Initial organism
Escherichia coli str. K-12 substr. MG1655
GenBank accession: U00096.3

## Primary use cases
1. Explore a genome in a sequence-centric viewer.
2. Inspect genes, CDSs, RNAs, and promoter regions in genomic context.
3. Overlay measured or predicted promoter activity as a per-base signal.
4. Jump to positions, ranges, or sequence matches.
5. Upload external sequence/design files and map them to the genome.
6. Later: generate or redesign sequences for target promoter activity.

## v1 scope
- Full-screen genome viewer
- Zoom presets: 1500 bp, 5000 bp, 10000 bp
- Colored DNA letters
- Top and bottom feature tracks for forward/reverse strand
- GenBank-derived annotations
- Activity overlay from precomputed experimental signal
- Threshold-based promoter highlighting
- Position/range navigation
- Sequence search
- Feature detail panel with outbound links

## v2 scope
- Upload SBOL / GenBank / FASTA for visualization
- CDS and promoter prediction on user sequence
- Predicted activity on user sequence
- Sequence generation toward target activity
- Similarity retrieval among generated and experimental sequences

## Non-goals for v1
- General multi-genome browser
- Real-time model training
- Full SynBioHub editing
- Large-scale comparative genomics
