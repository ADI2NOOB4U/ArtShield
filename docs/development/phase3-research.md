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

Layers 13-15 are outside this experiment; they are implemented as separate defensive analysis endpoints documented in `docs/development/phase4-security.md`.

## Layer 3 perturbation evaluation

Layer 3's implemented protection mechanism is a deterministic seeded RGB pixel
perturbation with strength 1 or 2, equivalent to a maximum byte delta of 1 or
2 per channel. It does not use a target-model gradient in the production
protection path.

The local research endpoint `POST /v1/research/layer3/evaluate` evaluates that
mechanism on the same seeded 16x16 synthetic pattern dataset and a local
scikit-learn logistic-regression model. It reports baseline, existing
perturbation, and one-step input-gradient FGSM losses/predictions, exact
`L_inf`, `L2`, mean absolute change, seed, epsilon, reproducibility, and runtime.
The gradient experiment is a measurement of this one local model only; it is
not a claim of production robustness or adversarial protection against
external, generative, or adaptive models.

Example:

```powershell
$body = '{"seed":11,"samples_per_class":16,"sample_index":0,"strength":1}'
Invoke-RestMethod http://localhost:8000/v1/research/layer3/evaluate -Method Post -ContentType application/json -Body $body
```

Implemented: bounded deterministic perturbation and reproducibility checks.

Research evaluated: loss/prediction changes against the local synthetic
logistic-regression model and one bounded input-gradient experiment.

Not proven: robustness against arbitrary generative AI models, universal
adversarial protection, adaptive attackers, resizing, or compression.