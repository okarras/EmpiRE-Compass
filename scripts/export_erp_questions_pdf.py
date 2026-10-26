#!/usr/bin/env python3
"""
Export Empirical Research Practice (R186491) questions, answers/interpretations,
and plot details from a Firebase backup into an HTML report (and optionally PDF).

Usage:
  python scripts/export_erp_questions_pdf.py
  python scripts/export_erp_questions_pdf.py --backup backups/....json --out exports/
"""

from __future__ import annotations

import argparse
import html
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup

TEMPLATE_ID = "R186491"
PREFIXES = """PREFIX orkgr: <http://orkg.org/orkg/resource/>
PREFIX orkgc: <http://orkg.org/orkg/class/>
PREFIX orkgp: <http://orkg.org/orkg/predicate/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
"""


def strip_html(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        parts = [strip_html(v) for v in value if v]
        return "\n\n".join(p for p in parts if p)
    text = str(value)
    soup = BeautifulSoup(text, "lxml")
    # Preserve links as "text (url)"
    for a in soup.find_all("a"):
        label = a.get_text(" ", strip=True)
        href = a.get("href") or ""
        a.replace_with(f"{label} ({href})" if href else label)
    cleaned = soup.get_text("\n", strip=True)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def as_html_block(value: Any) -> str:
    """Keep safe-ish HTML from content; fall back to escaped plain text."""
    if value is None:
        return "<p><em>Not provided.</em></p>"
    if isinstance(value, list):
        blocks = [as_html_block(v) for v in value if v]
        return "\n".join(blocks) if blocks else "<p><em>Not provided.</em></p>"
    text = str(value).strip()
    if not text:
        return "<p><em>Not provided.</em></p>"
    if "<" in text and ">" in text:
        return text
    return f"<p>{html.escape(text)}</p>"


def fmt_json(obj: Any) -> str:
    return html.escape(json.dumps(obj, indent=2, ensure_ascii=False))


def chart_details_html(settings: dict | None, label: str) -> str:
    if not settings:
        return f"<p><em>No {html.escape(label)} configured.</em></p>"

    heading = settings.get("heading") or "(no heading)"
    series = settings.get("series")
    x_axis = settings.get("xAxis")
    y_axis = settings.get("yAxis")
    rows = [
        ("Heading", html.escape(str(heading))),
        ("Height", html.escape(str(settings.get("height", "—")))),
        ("Layout", html.escape(str(settings.get("layout", "vertical (default)")))),
        ("Bar label", html.escape(str(settings.get("barLabel", "—")))),
        (
            "Hide detailed charts",
            html.escape(str(settings.get("hideDetailedCharts", False))),
        ),
        (
            "No normalization",
            html.escape(str(settings.get("doesntHaveNormalization", False))),
        ),
        (
            "Detailed chart heading",
            html.escape(str(settings.get("detailedChartHeading", "—"))),
        ),
    ]
    table_rows = "".join(
        f"<tr><th>{k}</th><td>{v}</td></tr>" for k, v in rows
    )
    return f"""
    <h4>{html.escape(label)}</h4>
    <table class="meta">
      {table_rows}
    </table>
    <details open>
      <summary>Series / axes (JSON)</summary>
      <pre>{fmt_json({"series": series, "xAxis": x_axis, "yAxis": y_axis})}</pre>
    </details>
    <details>
      <summary>Full chart settings (JSON)</summary>
      <pre>{fmt_json(settings)}</pre>
    </details>
    """


def load_template(backup_path: Path) -> dict:
    with backup_path.open(encoding="utf-8") as f:
        data = json.load(f)
    templates = data.get("Templates") or []
    for t in templates:
        if t.get("id") == TEMPLATE_ID:
            return t
    raise SystemExit(f"Template {TEMPLATE_ID} not found in {backup_path}")


def load_chart_manifest(charts_dir: Path) -> dict[int, list[dict]]:
    manifest_path = charts_dir / "png" / "manifest.json"
    if not manifest_path.exists():
        return {}
    items = json.loads(manifest_path.read_text(encoding="utf-8"))
    by_qid: dict[int, list[dict]] = {}
    for item in items:
        by_qid.setdefault(int(item["questionId"]), []).append(item)
    return by_qid


def chart_images_html(qid: int, charts_by_qid: dict[int, list[dict]], out_dir: Path) -> str:
    items = charts_by_qid.get(qid) or []
    if not items:
        return "<p><em>No rendered plot image available for this question.</em></p>"
    blocks = []
    root = out_dir.parent if out_dir.name == "exports" else out_dir
    # Prefer repo-root-relative paths from manifest; fall back to exports/charts/png
    for item in items:
        candidates = [
            Path(item["path"]),
            root / item["path"],
            out_dir / "charts" / "png" / f"{item['id']}.png",
            Path.cwd() / item["path"],
        ]
        png_path = next((p for p in candidates if p.exists()), candidates[-1])
        uri = png_path.resolve().as_uri()
        blocks.append(
            f"""
            <figure class="plot">
              <figcaption>{html.escape(item.get("heading") or item["id"])}</figcaption>
              <img src="{uri}" alt="{html.escape(item.get("heading") or item["id"])}" />
            </figure>
            """
        )
    return f"<h3>Plots</h3>{''.join(blocks)}"


def build_html(
    template: dict,
    backup_path: Path,
    out_dir: Path,
    charts_by_qid: dict[int, list[dict]] | None = None,
) -> str:
    questions = sorted(template.get("Questions") or [], key=lambda q: q.get("id", 0))
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    title = template.get("title") or "Empirical Research Practice"
    description = template.get("description") or ""
    charts_by_qid = charts_by_qid or {}
    n_plots = sum(len(v) for v in charts_by_qid.values())

    toc_items = []
    sections = []
    for q in questions:
        qid = q.get("id")
        dai = q.get("dataAnalysisInformation") or {}
        question = dai.get("question") or q.get("title") or f"Question {qid}"
        anchor = f"q-{qid}"
        toc_items.append(
            f'<li><a href="#{anchor}">Q{qid}. {html.escape(question)}</a></li>'
        )

        plots_html = chart_images_html(int(qid), charts_by_qid, out_dir)

        sections.append(
            f"""
            <section class="question" id="{anchor}">
              <h2>Q{qid}. {html.escape(question)}</h2>
              <p class="subtitle">{html.escape(str(q.get("title", "")))}</p>

              <h3>Question explanation</h3>
              <div class="content">{as_html_block(dai.get("questionExplanation"))}</div>

              <h3>Required data for analysis</h3>
              <div class="content">{as_html_block(dai.get("requiredDataForAnalysis"))}</div>

              <h3>Data analysis</h3>
              <div class="content">{as_html_block(dai.get("dataAnalysis"))}</div>

              {plots_html}

              <h3>Answer / data interpretation</h3>
              <div class="content answer">{as_html_block(dai.get("dataInterpretation"))}</div>
            </section>
            """
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>{html.escape(title)} — Questions, Answers &amp; Plot Details</title>
  <style>
    :root {{
      --ink: #1a1a1a;
      --muted: #555;
      --accent: #b33a3a;
      --border: #ddd;
      --bg: #fafafa;
    }}
    @page {{
      size: A4;
      margin: 18mm 16mm;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: var(--ink);
      line-height: 1.55;
      font-size: 11pt;
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
      background: white;
    }}
    h1 {{ font-size: 22pt; margin: 0 0 8px; color: var(--accent); }}
    h2 {{
      font-size: 15pt;
      color: var(--accent);
      border-bottom: 2px solid var(--accent);
      padding-bottom: 6px;
      margin-top: 36px;
      page-break-after: avoid;
    }}
    h3 {{ font-size: 12.5pt; margin-top: 20px; page-break-after: avoid; }}
    h4 {{ font-size: 11pt; margin-top: 14px; color: var(--muted); }}
    .meta-banner {{
      background: var(--bg);
      border: 1px solid var(--border);
      padding: 12px 14px;
      margin: 16px 0 28px;
      font-size: 10pt;
    }}
    .subtitle {{ color: var(--muted); font-style: italic; margin-top: -8px; }}
    .content p {{ margin: 0 0 10px; }}
    .answer {{
      background: #fff8f8;
      border-left: 4px solid var(--accent);
      padding: 10px 14px;
    }}
    figure.plot {{
      margin: 12px 0 20px;
      page-break-inside: avoid;
    }}
    figure.plot figcaption {{
      font-size: 10pt;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--muted);
    }}
    figure.plot img {{
      width: 100%;
      max-width: 100%;
      height: auto;
      border: 1px solid var(--border);
      background: #fff;
    }}
    table.meta {{
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px;
      font-size: 10pt;
    }}
    table.meta th, table.meta td {{
      border: 1px solid var(--border);
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }}
    table.meta th {{ width: 32%; background: var(--bg); }}
    pre {{
      background: #f4f4f4;
      border: 1px solid var(--border);
      padding: 10px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 8.5pt;
      line-height: 1.35;
    }}
    details {{ margin: 8px 0 12px; }}
    summary {{ cursor: pointer; font-weight: 600; }}
    .question {{ page-break-before: always; }}
    .question:first-of-type {{ page-break-before: auto; }}
    #toc ol {{ padding-left: 22px; }}
    #toc li {{ margin: 4px 0; }}
    a {{ color: var(--accent); text-decoration: none; }}
    .note {{
      font-size: 9.5pt;
      color: var(--muted);
      border-top: 1px solid var(--border);
      margin-top: 40px;
      padding-top: 12px;
    }}
    @media print {{
      body {{ padding: 0; max-width: none; }}
      a {{ color: inherit; }}
      details[open] summary {{ margin-bottom: 6px; }}
    }}
  </style>
</head>
<body>
  <header>
    <h1>{html.escape(title)}</h1>
    <p><strong>EmpiRE-Compass export</strong> — competency questions, analyses, interpretations (answers), and plots.</p>
    <div class="meta-banner">
      <div><strong>Template ID:</strong> {TEMPLATE_ID}</div>
      <div><strong>Questions:</strong> {len(questions)}</div>
      <div><strong>Rendered plots:</strong> {n_plots}</div>
      <div><strong>Generated:</strong> {generated}</div>
      <div><strong>Description:</strong> {html.escape(description)}</div>
    </div>
    <p>
      Plots were regenerated from live ORKG SPARQL results using the same data-processing functions as the dashboard
      (relative/normalized view).
    </p>
  </header>

  <nav id="toc">
    <h2>Contents</h2>
    <ol>
      {"".join(toc_items)}
    </ol>
  </nav>

  {"".join(sections)}

  <p class="note">
    Generated for research / paper drafting from EmpiRE-Compass (template R186491, Empirical Research Practice / KG-EmpiRE).
    Interpretations reflect the curated dashboard answers; plots reflect current ORKG query results.
  </p>
</body>
</html>
"""


def chrome_print_pdf(html_path: Path, pdf_path: Path) -> None:
    chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    html_uri = html_path.resolve().as_uri()
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path.resolve()}",
        html_uri,
    ]
    subprocess.run(cmd, check=True, capture_output=True, text=True)


def write_plain_text(template: dict, out_path: Path) -> None:
    """Companion plain-text dump — often easier for LLMs than PDF."""
    questions = sorted(template.get("Questions") or [], key=lambda q: q.get("id", 0))
    lines: list[str] = []
    lines.append("Empirical Research Practice (R186491) — Questions, Answers & Plot Details")
    lines.append("=" * 80)
    lines.append("")
    for q in questions:
        dai = q.get("dataAnalysisInformation") or {}
        qid = q.get("id")
        lines.append(f"Q{qid}. {dai.get('question') or q.get('title')}")
        lines.append("-" * 80)
        lines.append(f"Internal title: {q.get('title')}")
        lines.append(f"Chart type: {q.get('chartType')}")
        lines.append(f"UID: {q.get('uid')} | UID2: {q.get('uid_2')} | Merge: {q.get('uid_2_merge')}")
        lines.append("")
        lines.append("QUESTION EXPLANATION")
        lines.append(strip_html(dai.get("questionExplanation")))
        lines.append("")
        lines.append("REQUIRED DATA FOR ANALYSIS")
        lines.append(strip_html(dai.get("requiredDataForAnalysis")))
        lines.append("")
        lines.append("DATA ANALYSIS")
        lines.append(strip_html(dai.get("dataAnalysis")))
        lines.append("")
        lines.append("ANSWER / DATA INTERPRETATION")
        lines.append(strip_html(dai.get("dataInterpretation")))
        lines.append("")
        lines.append("")
    out_path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--backup",
        type=Path,
        default=Path("backups/firebase-backup-2026-03-30T08-56-42-479Z.json"),
    )
    parser.add_argument("--out", type=Path, default=Path("exports"))
    parser.add_argument("--skip-pdf", action="store_true")
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    template = load_template(args.backup)
    charts_by_qid = load_chart_manifest(args.out / "charts")

    stem = "empirical-research-practice-questions-answers-plots"
    html_path = args.out / f"{stem}.html"
    pdf_path = args.out / f"{stem}.pdf"
    txt_path = args.out / f"{stem}.txt"

    html_path.write_text(
        build_html(template, args.backup, args.out, charts_by_qid),
        encoding="utf-8",
    )
    write_plain_text(template, txt_path)
    print(f"Wrote {html_path}")
    print(f"Wrote {txt_path}")
    print(f"Embedded plots for {len(charts_by_qid)} questions")

    if not args.skip_pdf:
        chrome_print_pdf(html_path, pdf_path)
        print(f"Wrote {pdf_path} ({pdf_path.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
