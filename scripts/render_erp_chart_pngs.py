#!/usr/bin/env python3
"""Render Chart.js specs.json to PNG files with matplotlib."""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SPECS = ROOT / "exports/charts/specs.json"
OUT = ROOT / "exports/charts/png"


def render(spec: dict, out_path: Path) -> None:
    labels = [str(l) for l in spec["labels"]]
    datasets = spec["datasets"]
    horizontal = spec.get("layout") == "horizontal"
    n = len(labels)
    n_series = len(datasets)

    fig_w = 14 if not horizontal else 12
    fig_h = max(5.5, n * 0.28) if horizontal else 6.2
    fig, ax = plt.subplots(figsize=(fig_w, fig_h), dpi=160)

    if n_series == 1:
        vals = datasets[0]["data"]
        color = datasets[0].get("color") or "#e86161"
        if horizontal:
            bars = ax.barh(labels, vals, color=color, height=0.7)
            ax.bar_label(bars, fmt="%g", padding=3, fontsize=8)
            ax.set_xlabel(spec.get("yAxisLabel") or "")
            ax.set_ylabel(spec.get("xAxisLabel") or "")
        else:
            x = np.arange(n)
            bars = ax.bar(x, vals, color=color, width=0.75)
            ax.bar_label(bars, fmt="%g", padding=2, fontsize=7, rotation=90)
            ax.set_xticks(x)
            ax.set_xticklabels(labels, rotation=90, fontsize=8)
            ax.set_ylabel(spec.get("yAxisLabel") or "")
            ax.set_xlabel(spec.get("xAxisLabel") or "")
    else:
        x = np.arange(n)
        width = 0.8 / n_series
        if horizontal:
            for i, ds in enumerate(datasets):
                offset = (i - (n_series - 1) / 2) * width
                y = x + offset
                bars = ax.barh(
                    y,
                    ds["data"],
                    height=width,
                    label=ds["label"],
                    color=ds.get("color"),
                )
            ax.set_yticks(x)
            ax.set_yticklabels(labels, fontsize=8)
            ax.set_xlabel(spec.get("yAxisLabel") or "")
            ax.legend(fontsize=7, loc="lower right")
        else:
            for i, ds in enumerate(datasets):
                offset = (i - (n_series - 1) / 2) * width
                ax.bar(
                    x + offset,
                    ds["data"],
                    width=width,
                    label=ds["label"],
                    color=ds.get("color"),
                )
            ax.set_xticks(x)
            ax.set_xticklabels(labels, rotation=90, fontsize=8)
            ax.set_ylabel(spec.get("yAxisLabel") or "")
            ax.set_xlabel(spec.get("xAxisLabel") or "")
            ax.legend(fontsize=7, ncol=min(4, n_series), loc="upper center", bbox_to_anchor=(0.5, -0.18))

    ax.set_title(spec["heading"], fontsize=12, pad=10)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.set_axisbelow(True)
    ax.grid(axis="x" if horizontal else "y", linestyle="--", alpha=0.35)
    fig.tight_layout()
    fig.savefig(out_path, bbox_inches="tight", facecolor="white")
    plt.close(fig)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    specs = json.loads(SPECS.read_text(encoding="utf-8"))
    manifest = []
    for spec in specs:
        out = OUT / f"{spec['id']}.png"
        render(spec, out)
        manifest.append(
            {
                "id": spec["id"],
                "questionId": spec["questionId"],
                "question": spec["question"],
                "heading": spec["heading"],
                "path": str(out.relative_to(ROOT)),
            }
        )
        print(f"wrote {out.name}")
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Rendered {len(manifest)} PNGs")


if __name__ == "__main__":
    main()
