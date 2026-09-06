# Phase 3 Controlled Research

Phase 3 uses a deterministic synthetic two-class image dataset generated in memory. It does not read arbitrary files, download models, or target external datasets/models.

## Reproduction

From `ml-service/`:

```powershell
python -m unittest discover -s tests -p "test_phase3_*.py" -v
```

The experiment configuration records the seed, dataset identifier, model identifier, sample counts, poisoning ratio, perturbation budget, metrics, and artifact reference. Results are written to `data/experimental/results/<experiment_id>.json`; an existing ID is never overwritten.

## Baseline

The baseline is scikit-learn logistic regression (`liblinear`) over flattened 16x16 synthetic patterns. Class 0 uses a horizontal intensity gradient and class 1 a vertical intensity gradient, each with seeded noise. The train/test split is stratified and seeded.

## Experimental conditions

The manipulated condition selects a bounded, seeded subset of training samples, applies a small bounded pixel perturbation, adds a clearly defined 2x2 bottom-right research marker, and flips the selected labels. This is a local research artifact only. The output compares clean and manipulated training metrics, trigger behavior, feature displacement, gradient shift, and a heuristic signature label. These outputs are experimental measurements, not claims about deployed models or real datasets.

Layers 13-15 are outside this experiment and are not implemented.