from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape
import zipfile

PPTX = Path(__file__).with_name("phl-pne-crm-passenger-insights-executive-briefing.pptx")
TMP = PPTX.with_suffix(".tmp.pptx")

W, H = 12192000, 6858000
EMU = 914400

COLORS = {
    "navy": "0F3B63",
    "blue": "0F4D90",
    "gold": "F3C613",
    "green": "25805A",
    "amber": "B76500",
    "red": "B42318",
    "ink": "172536",
    "muted": "5C6F82",
    "line": "D9E2EC",
    "bg": "F5F8FB",
    "surface": "FFFFFF",
    "softblue": "EEF5FC",
    "softgreen": "E8F5EE",
    "softamber": "FFF5DF",
    "softred": "FDECEC",
}


def emu(value: float) -> int:
    return int(value * EMU)


def clean(text: object) -> str:
    return escape(str(text), {"\"": "&quot;"})


def solid(color: str) -> str:
    return f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'


def nofill() -> str:
    return "<a:noFill/>"


def line(color: str = COLORS["line"], width: int = 12700) -> str:
    return f'<a:ln w="{width}">{solid(color)}</a:ln>'


def xfrm(x: float, y: float, w: float, h: float) -> str:
    return (
        f'<a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/>'
        f'<a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
    )


def run(text: str, size: int, color: str, bold: bool = False) -> str:
    bold_attr = ' b="1"' if bold else ""
    return (
        f'<a:r><a:rPr lang="en-US" sz="{size}"{bold_attr}>'
        f'{solid(color)}<a:latin typeface="Arial"/><a:ea typeface="Arial"/><a:cs typeface="Arial"/>'
        f"</a:rPr><a:t>{clean(text)}</a:t></a:r>"
    )


def para(
    text: str,
    size: int = 1500,
    color: str = COLORS["ink"],
    bold: bool = False,
    align: str = "l",
    before: int = 0,
) -> str:
    return (
        f'<a:p><a:pPr algn="{align}" marL="0" indent="0">'
        f'<a:spcBef><a:spcPts val="{before}"/></a:spcBef></a:pPr>'
        f"{run(text, size, color, bold)}</a:p>"
    )


def textbox(
    shape_id: int,
    name: str,
    x: float,
    y: float,
    w: float,
    h: float,
    paragraphs: list[str],
    size: int = 1500,
    color: str = COLORS["ink"],
    bold: bool = False,
    fill: str | None = None,
    border: str | None = None,
    align: str = "l",
    radius: bool = False,
    inset: int = 91440,
    valign: str = "t",
) -> str:
    shape_fill = nofill() if fill is None else solid(fill)
    shape_line = "<a:ln><a:noFill/></a:ln>" if border is None else line(border)
    geom = "roundRect" if radius else "rect"
    body = "".join(
        para(p, size=size, color=color, bold=bold, align=align, before=(600 if i else 0))
        for i, p in enumerate(paragraphs)
    )
    return f"""
    <p:sp>
      <p:nvSpPr><p:cNvPr id="{shape_id}" name="{clean(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr>{xfrm(x, y, w, h)}<a:prstGeom prst="{geom}"><a:avLst/></a:prstGeom>{shape_fill}{shape_line}</p:spPr>
      <p:txBody><a:bodyPr wrap="square" anchor="{valign}" lIns="{inset}" tIns="{inset}" rIns="{inset}" bIns="{inset}"/><a:lstStyle/>{body}</p:txBody>
    </p:sp>"""


def rect(
    shape_id: int,
    name: str,
    x: float,
    y: float,
    w: float,
    h: float,
    fill: str,
    border: str | None = None,
    radius: bool = False,
) -> str:
    shape_line = "<a:ln><a:noFill/></a:ln>" if border is None else line(border)
    geom = "roundRect" if radius else "rect"
    return f"""
    <p:sp>
      <p:nvSpPr><p:cNvPr id="{shape_id}" name="{clean(name)}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>{xfrm(x, y, w, h)}<a:prstGeom prst="{geom}"><a:avLst/></a:prstGeom>{solid(fill)}{shape_line}</p:spPr>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>
    </p:sp>"""


def progress_bar(
    shape_id: int,
    x: float,
    y: float,
    w: float,
    h: float,
    value: int,
    color: str,
) -> tuple[str, int]:
    parts = [
        rect(shape_id, "bar-bg", x, y, w, h, COLORS["line"], None, radius=True),
        rect(shape_id + 1, "bar-fill", x, y, w * value / 100, h, color, None, radius=True),
    ]
    return "".join(parts), shape_id + 2


def card(
    shape_id: int,
    x: float,
    y: float,
    w: float,
    h: float,
    title: str,
    body: list[str],
    accent: str = COLORS["blue"],
    fill: str = COLORS["surface"],
    small: bool = False,
) -> tuple[str, int]:
    parts = [rect(shape_id, f"{title} accent", x, y, 0.08, h, accent, None)]
    shape_id += 1
    parts.append(
        textbox(
            shape_id,
            title,
            x + 0.08,
            y,
            w - 0.08,
            h,
            [title] + body,
            size=1200 if small else 1350,
            fill=fill,
            border=COLORS["line"],
            inset=76200,
        )
    )
    return "".join(parts), shape_id + 1


def split_card(
    shape_id: int,
    x: float,
    y: float,
    w: float,
    h: float,
    eyebrow: str,
    title: str,
    body: str,
    accent: str = COLORS["blue"],
) -> tuple[str, int]:
    parts = [
        rect(shape_id, f"{title} bg", x, y, w, h, COLORS["surface"], COLORS["line"]),
        rect(shape_id + 1, f"{title} top", x, y, w, 0.08, accent, None),
        textbox(
            shape_id + 2,
            f"{title} text",
            x + 0.05,
            y + 0.04,
            w - 0.1,
            h - 0.08,
            [eyebrow.upper(), title, body],
            size=1200,
            fill=None,
            border=None,
            inset=60960,
        ),
    ]
    return "".join(parts), shape_id + 3


def slide_xml(index: int, eyebrow: str, title: str, subtitle: str, body_shapes: str) -> str:
    shapes = []
    sid = 1
    shapes.append(rect(sid, "background", 0, 0, 13.333, 7.5, COLORS["bg"], None))
    sid += 1
    shapes.append(rect(sid, "service-bar", 0, 0, 13.333, 0.46, COLORS["navy"], None))
    sid += 1
    shapes.append(rect(sid, "gold-bar", 0, 0, 0.12, 0.46, COLORS["gold"], None))
    sid += 1
    shapes.append(
        textbox(
            sid,
            "agency",
            0.28,
            0.08,
            5.8,
            0.26,
            ["City of Philadelphia / Department of Aviation"],
            size=1050,
            color=COLORS["surface"],
            bold=True,
            fill=None,
            border=None,
            inset=0,
        )
    )
    sid += 1
    shapes.append(
        textbox(
            sid,
            "eyebrow",
            9.0,
            0.08,
            3.9,
            0.26,
            [eyebrow.upper()],
            size=950,
            color=COLORS["surface"],
            bold=True,
            fill=None,
            border=None,
            align="r",
            inset=0,
        )
    )
    sid += 1
    shapes.append(
        textbox(
            sid,
            "title",
            0.62,
            0.78,
            11.9,
            0.48,
            [title],
            size=2650,
            color=COLORS["navy"],
            bold=True,
            fill=None,
            border=None,
            inset=0,
        )
    )
    sid += 1
    shapes.append(
        textbox(
            sid,
            "subtitle",
            0.64,
            1.26,
            11.55,
            0.55,
            [subtitle],
            size=1250,
            color=COLORS["muted"],
            fill=None,
            border=None,
            inset=0,
        )
    )
    shapes.append(body_shapes)
    shapes.append(
        textbox(
            800,
            "footer",
            0.64,
            7.08,
            8.9,
            0.24,
            [
                "Public-source prototype. CRM, survey, accessibility, passenger, and PNE relationship records require approved internal systems and governance controls."
            ],
            size=850,
            color=COLORS["muted"],
            fill=None,
            border=None,
            inset=0,
        )
    )
    shapes.append(
        textbox(
            801,
            "slide-number",
            11.85,
            7.08,
            0.8,
            0.24,
            [f"{index:02d}"],
            size=900,
            color=COLORS["muted"],
            bold=True,
            fill=None,
            border=None,
            align="r",
            inset=0,
        )
    )
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    {"".join(shapes)}
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>"""


def build_slides() -> list[dict[str, str]]:
    slides: list[dict[str, str]] = []

    sid = 20
    parts = []
    for i, (title, body, color) in enumerate(
        [
            (
                "Mission",
                "Convert millions of passenger and customer interactions into intelligence that improves service, trust, and accountability.",
                COLORS["blue"],
            ),
            (
                "Operating model",
                "CRM stores organizational memory, engagement tools create communication loops, and enterprise data platforms reduce silos.",
                COLORS["green"],
            ),
            (
                "Executive output",
                "Show what happened, why it matters, what risk remains, who owns the action, and what outcome is expected.",
                COLORS["amber"],
            ),
        ]
    ):
        xml, sid = split_card(sid, 0.7 + i * 4.05, 2.0, 3.75, 1.45, "dashboard story", title, body, color)
        parts.append(xml)
    for i, (value, label) in enumerate(
        [
            ("30M+", "2025 PHL passengers as public scale context"),
            ("126", "PHL gates that shape journey-stage analytics"),
            ("PNE", "Reliever-airport relationship lens"),
            ("8", "Core passenger experience KPIs"),
        ]
    ):
        parts.append(
            textbox(
                sid,
                f"metric {i}",
                0.72 + i * 3.1,
                3.85,
                2.78,
                0.92,
                [value, label],
                size=1350,
                color=COLORS["navy"],
                bold=True,
                fill=COLORS["surface"],
                border=COLORS["line"],
                inset=76200,
            )
        )
        sid += 1
    parts.append(
        textbox(
            sid,
            "thesis",
            0.72,
            5.12,
            11.85,
            0.92,
            [
                "Revised thesis: the dashboard is not a complaint counter. It is a governed customer intelligence system that links journey friction, source confidence, privacy controls, forecast signals, and decision ownership."
            ],
            size=1450,
            fill=COLORS["softblue"],
            border=COLORS["line"],
        )
    )
    slides.append(
        {
            "eyebrow": "executive story",
            "title": "CRM & Passenger Intelligence Dashboard",
            "subtitle": "How PHL and PNE can convert passenger signals, feedback channels, and operational context into governed executive decisions.",
            "body": "".join(parts),
        }
    )

    sid = 20
    parts = []
    kpis = [
        ("Satisfaction", "7.8 / 10", "Target 8.5. Shows whether investments are visible to passengers.", COLORS["amber"]),
        ("NPS signal", "+34", "Target +45. Separates loyalty risk from one-time friction.", COLORS["amber"]),
        ("Effort score", "3.1 / 5", "Target 4.1. Measures how easy it is to park, navigate, request help, and resolve issues.", COLORS["amber"]),
        ("Complaint rate", "2.1 / 10k", "Target <1.5. Normalizes complaint volume against passenger scale.", COLORS["amber"]),
        ("Response time", "36 hours", "Target <24. Holds teams accountable for timely acknowledgment.", COLORS["red"]),
        ("Resolution time", "4.8 days", "Target <3. Distinguishes routing from actual closure.", COLORS["amber"]),
        ("Service quality", "71 / 100", "Target 84. Summarizes cleanliness, wayfinding, accessibility, helpfulness, and disruption communication.", COLORS["amber"]),
        ("Traffic context", "30M+", "Links feedback to public activity scale, peak periods, and disruption demand.", COLORS["green"]),
    ]
    for row in range(2):
        for col in range(4):
            title, value, body, accent = kpis[row * 4 + col]
            x, y = 0.65 + col * 3.12, 2.0 + row * 1.72
            parts.append(rect(sid, f"{title} card", x, y, 2.85, 1.38, COLORS["surface"], COLORS["line"]))
            sid += 1
            parts.append(rect(sid, f"{title} accent", x, y, 2.85, 0.08, accent, None))
            sid += 1
            parts.append(textbox(sid, f"{title} text", x + 0.1, y + 0.12, 2.65, 1.08, [title.upper(), value, body], size=950, inset=0))
            sid += 1
    parts.append(
        textbox(
            sid,
            "kpi-rule",
            0.72,
            5.58,
            11.7,
            0.48,
            [
                "KPI rule: every metric needs a data owner, source label, target, interpretation, and executive action path before it appears in leadership reporting."
            ],
            size=1300,
            fill=COLORS["softgreen"],
            border=COLORS["line"],
            inset=76200,
        )
    )
    slides.append(
        {
            "eyebrow": "kpi framework",
            "title": "Passenger Experience KPIs For Executive Review",
            "subtitle": "The dashboard keeps the metric set small enough for leadership, but complete enough to explain quality, effort, response, recovery, and scale.",
            "body": "".join(parts),
        }
    )

    sid = 20
    parts = []
    cycle = [
        ("1. Collect", "Surveys, complaints, compliments, service requests, digital signals, public activity context."),
        ("2. Integrate", "CRM, survey, digital, accessibility, PNE relationship, and operations context in one reporting layer."),
        ("3. Clean", "Duplicate cases, missing owners, inconsistent journey stages, and unreliable timestamps are corrected."),
        ("4. Analyze", "Segments, service themes, root causes, forecast signals, and quality scores explain what changed."),
        ("5. Report", "Cockpit, evidence chain, downloadable reports, and citations answer executive questions."),
        ("6. Act", "Owners, due dates, remediation, expected outcomes, and follow-up cadence close the loop."),
    ]
    for i, (title, body) in enumerate(cycle):
        xml, sid = card(sid, 0.65 + (i % 3) * 4.15, 2.0 + (i // 3) * 1.62, 3.72, 1.22, title, [body], accent=COLORS["blue" if i < 3 else "green"], small=True)
        parts.append(xml)
    parts.append(
        textbox(
            sid,
            "cycle-note",
            0.72,
            5.46,
            11.7,
            0.64,
            ["Closed-loop standard: analysis without action has no value. The deck and dashboard show the path from customer signal to assigned improvement, not only the chart."],
            size=1400,
            fill=COLORS["softblue"],
            border=COLORS["line"],
            inset=76200,
        )
    )
    slides.append(
        {
            "eyebrow": "customer intelligence cycle",
            "title": "From CRM Memory To Service Improvement",
            "subtitle": "CRM captures the relationship history; engagement platforms create feedback loops; enterprise data systems make the signals reliable enough for decisions.",
            "body": "".join(parts),
        }
    )

    sid = 20
    parts = [
        textbox(
            sid,
            "table-head",
            0.72,
            1.9,
            11.82,
            0.36,
            ["Segment | Behavioral signal | Executive use"],
            size=1150,
            color=COLORS["surface"],
            bold=True,
            fill=COLORS["blue"],
            border=None,
            inset=76200,
        )
    ]
    sid += 1
    segments = [
        ("Business / frequent", "Time sensitivity, repeat use, disruption impact", "Protect reliability and loyalty."),
        ("Leisure / families", "Wayfinding, amenities, plain-language support", "Reduce journey effort."),
        ("International / first-time", "Customs, language, connection questions", "Improve pre-arrival and multilingual guidance."),
        ("Accessibility users", "Support requests, handoffs, alternative formats", "Analyze trends with restricted privacy controls."),
        ("Disrupted passengers", "Delay context, crowding, recovery needs", "Trigger proactive communication."),
        ("PNE relationships", "Pilots, tenants, corporate aviation, facility requests", "Manage relationship health and follow-up."),
    ]
    for i, (segment, signal, use) in enumerate(segments):
        y = 2.36 + i * 0.55
        fill = COLORS["surface"] if i % 2 == 0 else "FBFDFF"
        parts.append(rect(sid, f"seg row {i}", 0.72, y, 11.82, 0.48, fill, COLORS["line"]))
        sid += 1
        parts.append(textbox(sid, f"seg {i}", 0.82, y + 0.07, 2.15, 0.32, [segment], size=950, color=COLORS["navy"], bold=True, fill=None, border=None, inset=0))
        sid += 1
        parts.append(textbox(sid, f"sig {i}", 3.05, y + 0.07, 4.25, 0.32, [signal], size=900, fill=None, border=None, inset=0))
        sid += 1
        parts.append(textbox(sid, f"use {i}", 7.45, y + 0.07, 4.6, 0.32, [use], size=900, fill=None, border=None, inset=0))
        sid += 1
    parts.append(
        textbox(
            sid,
            "seg-note",
            0.72,
            5.92,
            11.82,
            0.42,
            ["Segmentation prevents averages from hiding who is affected, what context matters, and which stakeholder owns the fix."],
            size=1250,
            fill=COLORS["softamber"],
            border=COLORS["line"],
            inset=76200,
        )
    )
    slides.append(
        {
            "eyebrow": "segmentation lens",
            "title": "Segmentation Makes Airport Experience Data Actionable",
            "subtitle": "Passengers and airport customers are not one group. The dashboard separates behavior, journey context, sensitivity, and PNE relationship needs.",
            "body": "".join(parts),
        }
    )

    sid = 20
    parts = []
    forecasts = [
        ("Complaint volume forecast", 71, "Passenger volume, delay context, website search spikes, past complaint rate", "Pre-stage communications and owner coverage before peak windows.", COLORS["amber"]),
        ("Customer effort risk", 67, "Digital drop-off, search terms, information desk contacts, accessibility requests", "Fix content and wayfinding where digital intent clusters.", COLORS["amber"]),
        ("Accessibility escalation", 64, "Program contacts, alternate-format requests, handoff owner gaps, repeat themes", "Approve restricted analytics and anonymized trend reporting.", COLORS["red"]),
        ("PNE follow-up risk", 62, "Open facility requests, tenant contacts, customs coordination, owner gaps", "Launch PNE service request template with owner, response, closure fields.", COLORS["red"]),
    ]
    for i, (name, confidence, indicators, move, accent) in enumerate(forecasts):
        x = 0.72 + (i % 2) * 6.1
        y = 2.0 + (i // 2) * 1.8
        parts.append(rect(sid, f"forecast {i}", x, y, 5.65, 1.45, COLORS["surface"], COLORS["line"]))
        sid += 1
        parts.append(rect(sid, f"forecast accent {i}", x, y, 0.08, 1.45, accent, None))
        sid += 1
        parts.append(textbox(sid, f"forecast text {i}", x + 0.18, y + 0.12, 5.25, 0.72, [name, indicators], size=950, fill=None, border=None, inset=0))
        sid += 1
        parts.append(textbox(sid, f"forecast move {i}", x + 0.18, y + 0.88, 4.4, 0.33, [move], size=850, color=COLORS["muted"], fill=None, border=None, inset=0))
        sid += 1
        bars, sid = progress_bar(sid, x + 4.58, y + 0.97, 0.72, 0.10, confidence, accent)
        parts.append(bars)
        parts.append(textbox(sid, f"confidence {i}", x + 4.58, y + 1.10, 0.82, 0.18, [f"{confidence}% conf."], size=700, color=COLORS["muted"], fill=None, border=None, align="r", inset=0))
        sid += 1
    parts.append(
        textbox(
            sid,
            "forecast-note",
            0.72,
            5.83,
            11.7,
            0.45,
            ["Forecasting standard: use leading indicators to move from reactive service recovery to proactive staffing, communication, content, and relationship actions."],
            size=1250,
            fill=COLORS["softblue"],
            border=COLORS["line"],
            inset=76200,
        )
    )
    slides.append(
        {
            "eyebrow": "forecast signals",
            "title": "Predict Where Experience Risk Is Likely To Surface",
            "subtitle": "The first forecasting layer is intentionally explainable: leading indicators, confidence, predicted risk, and the executive move are shown together.",
            "body": "".join(parts),
        }
    )

    sid = 20
    parts = []
    chain = [
        ("Posting requirement", "CRM, feedback systems, dashboards, governance, privacy, IT partnership."),
        ("Public source fact", "PHL/PNE, accessibility, FAA/BTS, and public activity anchors."),
        ("CX question", "Which passenger or customer friction needs executive attention?"),
        ("Internal data needed", "CRM cases, surveys, timestamps, owner, segment, closure outcome."),
        ("Dashboard artifact", "KPI cockpit, journey map, evidence chain, report export."),
        ("Decision supported", "Approve feed, fix service gap, train staff, or govern privacy lane."),
    ]
    for i, (title, body) in enumerate(chain):
        xml, sid = card(sid, 0.7 + i * 2.05, 2.08, 1.8, 1.65, title, [body], accent=COLORS["blue" if i < 2 else "green" if i < 5 else "amber"], small=True)
        parts.append(xml)
        if i < len(chain) - 1:
            parts.append(textbox(sid, f"arrow {i}", 2.42 + i * 2.05, 2.72, 0.3, 0.25, [">"], size=1500, color=COLORS["muted"], bold=True, fill=None, border=None, inset=0))
            sid += 1
    examples = [
        ("PHL", "30M+ passengers and 126 gates", "Journey-stage friction and self-service gaps."),
        ("Accessibility", "AIRA, TSA Cares, Sunflower, ADA/Title VI routes", "High-value trend reporting with restricted details."),
        ("PNE", "Reliever airport, based aircraft, customs services", "Relationship register for pilots, tenants, facility requests."),
    ]
    for i, (label, fact, use) in enumerate(examples):
        xml, sid = split_card(sid, 0.72 + i * 4.05, 4.28, 3.65, 1.18, label, fact, use, COLORS["navy"])
        parts.append(xml)
    slides.append(
        {
            "eyebrow": "evidence chain",
            "title": "Credibility Comes From Showing The Derivation",
            "subtitle": "The dashboard makes every insight traceable from public evidence to internal data request, reporting artifact, and leadership decision.",
            "body": "".join(parts),
        }
    )

    sid = 20
    parts = []
    feeds = [
        ("CRM cases", "Case volume, owner, response SLA, theme, closure reason"),
        ("Survey platform", "Satisfaction, sentiment, journey stage, open text"),
        ("Digital touchpoints", "Search intent, page path, drop-off, language need"),
        ("Accessibility workflow", "Restricted request category, program, resolution"),
        ("Operations context", "Delay, terminal zone, facility event, recovery action"),
        ("PNE relationships", "Contact type, facility, owner, follow-up status"),
    ]
    for i, (title, body) in enumerate(feeds):
        xml, sid = card(sid, 0.75 + (i % 3) * 3.95, 2.0 + (i // 3) * 1.0, 3.45, 0.78, title, [body], accent=COLORS["green"], small=True)
        parts.append(xml)
    parts.append(
        textbox(
            sid,
            "platform",
            1.25,
            4.38,
            10.85,
            0.66,
            ["Enterprise reporting layer: source owner + cadence + field dictionary + quality gate + privacy treatment + reconciliation rule + escalation path."],
            size=1350,
            color=COLORS["surface"],
            bold=True,
            fill=COLORS["blue"],
            border=None,
            inset=76200,
        )
    )
    sid += 1
    parts.append(
        textbox(
            sid,
            "ml",
            1.25,
            5.18,
            10.85,
            0.58,
            ["Upload/update workflow: team template -> metadata capture -> source-quality score -> illustrative readiness prediction -> dashboard refresh -> executive action record."],
            size=1250,
            fill=COLORS["softgreen"],
            border=COLORS["line"],
            inset=76200,
        )
    )
    slides.append(
        {
            "eyebrow": "architecture",
            "title": "Connect Feeds Without Losing Department Workflows",
            "subtitle": "Teams can keep their templates and processes, while the dashboard centralizes metadata, quality controls, reporting logic, and decision ownership.",
            "body": "".join(parts),
        }
    )

    sid = 20
    parts = []
    for i, (name, score, accent) in enumerate(
        [
            ("Public facts", 87, COLORS["green"]),
            ("CRM case system", 61, COLORS["red"]),
            ("Survey platform", 70, COLORS["amber"]),
            ("Accessibility workflow", 58, COLORS["red"]),
            ("PNE register", 53, COLORS["red"]),
        ]
    ):
        x = 0.78 + i * 2.48
        parts.append(rect(sid, f"quality {name}", x, 2.02, 2.16, 1.35, COLORS["surface"], COLORS["line"]))
        sid += 1
        parts.append(textbox(sid, f"quality label {name}", x + 0.15, 2.16, 1.86, 0.35, ["SCORE"], size=750, color=COLORS["muted"], bold=True, fill=None, border=None, align="c", inset=0))
        sid += 1
        parts.append(textbox(sid, f"score number {name}", x + 0.15, 2.48, 1.86, 0.35, [f"{score}/100"], size=1700, color=accent, bold=True, fill=None, border=None, align="c", inset=0))
        sid += 1
        parts.append(textbox(sid, f"q text {name}", x + 0.12, 2.9, 1.92, 0.32, [name], size=850, bold=True, fill=None, border=None, align="c", inset=0))
        sid += 1
        bars, sid = progress_bar(sid, x + 0.22, 3.18, 1.72, 0.08, score, accent)
        parts.append(bars)
    for i, (title, body) in enumerate(
        [
            ("Public Source", "Directly available source content used as a citation anchor."),
            ("Derived From Public", "Analytical inference from public facts, kept separate from official claims."),
            ("Illustrative Model", "Mock internal CRM, survey, SLA, privacy, and feed-readiness data until approved systems are connected."),
        ]
    ):
        xml, sid = split_card(sid, 0.72 + i * 4.05, 4.35, 3.65, 1.1, "provenance", title, body, COLORS["blue" if i == 0 else "green" if i == 1 else "amber"])
        parts.append(xml)
    parts.append(
        textbox(
            sid,
            "privacy-rule",
            0.72,
            5.78,
            11.72,
            0.36,
            ["Privacy rule: PII, accessibility detail, and sensitive case notes stay out of executive reporting unless minimum-necessary fields, access roles, retention, and audit trails are approved."],
            size=1050,
            fill=COLORS["softred"],
            border=COLORS["line"],
            inset=76200,
        )
    )
    slides.append(
        {
            "eyebrow": "governance and privacy",
            "title": "Trust The Data Before Scaling The Insight",
            "subtitle": "Source-quality scoring keeps executive confidence, privacy, and accountability visible before CRM analytics becomes an automated operating rhythm.",
            "body": "".join(parts),
        }
    )

    sid = 20
    parts = [
        textbox(sid, "phl-head", 0.72, 1.95, 5.75, 0.38, ["PHL leadership lens"], size=1350, color=COLORS["surface"], bold=True, fill=COLORS["blue"], border=None, inset=76200),
        textbox(sid + 1, "pne-head", 6.86, 1.95, 5.75, 0.38, ["PNE leadership lens"], size=1350, color=COLORS["surface"], bold=True, fill=COLORS["green"], border=None, inset=76200),
    ]
    sid += 2
    phl_points = [
        "Passenger-scale journey analytics across parking, terminal, gates, digital, accessibility, and recovery touchpoints.",
        "Service themes ranked by journey stage, owner, sentiment, case volume, and expected outcome.",
        "Forecast spikes from passenger activity, disruption context, searches, and complaint history.",
        "Privacy-aware accessibility lane for high-sensitivity trends and restricted details.",
    ]
    pne_points = [
        "Reliever-airport CRM built around pilots, tenants, corporate aviation users, customs coordination, and facility requests.",
        "Relationship register tracks contact type, owner, facility, follow-up status, and satisfaction note.",
        "PNE public-fact reconciliation treated as governance signal before external claims.",
        "Template-first approach avoids forcing PNE into a terminal passenger model.",
    ]
    for i, text in enumerate(phl_points):
        parts.append(textbox(sid, f"phl {i}", 0.82, 2.55 + i * 0.74, 5.38, 0.5, [f"- {text}"], size=1050, fill=COLORS["surface"], border=COLORS["line"], inset=60960))
        sid += 1
    for i, text in enumerate(pne_points):
        parts.append(textbox(sid, f"pne {i}", 6.96, 2.55 + i * 0.74, 5.38, 0.5, [f"- {text}"], size=1050, fill=COLORS["surface"], border=COLORS["line"], inset=60960))
        sid += 1
    parts.append(
        textbox(
            sid,
            "shared",
            0.72,
            5.72,
            11.88,
            0.42,
            ["Shared backbone: common source controls, privacy rules, evidence chain, exports, training cadence, and executive decision queue."],
            size=1250,
            fill=COLORS["softblue"],
            border=COLORS["line"],
            inset=76200,
        )
    )
    slides.append(
        {
            "eyebrow": "leadership lenses",
            "title": "Same Governance Backbone, Different Airport Questions",
            "subtitle": "PHL needs passenger journey scale; PNE needs relationship management. A credible CRM program supports both without flattening their operating realities.",
            "body": "".join(parts),
        }
    )

    sid = 20
    parts = []
    roadmap = [
        ("1-15", "Inventory", "Map CRM, surveys, digital, accessibility, ops context, PNE records."),
        ("16-30", "Taxonomy", "Define journey stage, theme, severity, owner, outcome."),
        ("31-45", "Controls", "Set PII, restricted records, retention, lineage, quality scoring."),
        ("46-60", "Prototype", "Publish cockpit, feedback, program, governance reports."),
        ("61-75", "Adoption", "Train stakeholders on templates, issue taxonomy, escalation."),
        ("76-90", "Scale", "Prioritize automation and AI-assisted theme detection with review."),
    ]
    for i, (days, title, body) in enumerate(roadmap):
        x = 0.65 + i * 2.08
        color = COLORS["green"] if i == 3 else COLORS["red"] if i == 2 else COLORS["amber"]
        parts.append(rect(sid, f"road {i}", x, 2.05, 1.78, 1.62, COLORS["surface"], COLORS["line"]))
        sid += 1
        parts.append(rect(sid, f"road top {i}", x, 2.05, 1.78, 0.08, color, None))
        sid += 1
        parts.append(textbox(sid, f"road text {i}", x + 0.08, 2.18, 1.62, 1.25, [f"Days {days}", title, body], size=850, fill=None, border=None, inset=0))
        sid += 1
    choices = [
        ("First production source", "CRM case feed with minimum fields and sensitive-note suppression."),
        ("First privacy decision", "Accessibility trend lane with restricted detail and anonymized reporting."),
        ("First adoption move", "Shared taxonomy and template training before large-scale automation."),
    ]
    for i, (title, body) in enumerate(choices):
        xml, sid = split_card(sid, 0.72 + i * 4.05, 4.32, 3.65, 1.08, "executive decision", title, body, COLORS["blue" if i == 0 else "red" if i == 1 else "amber"])
        parts.append(xml)
    parts.append(
        textbox(
            sid,
            "close",
            0.72,
            5.82,
            11.72,
            0.34,
            ["Briefing takeaway: the revised dashboard shows a feasible CRM analytics pathway from public evidence to governed data feeds, predictive signals, and accountable passenger experience improvements."],
            size=1050,
            fill=COLORS["softgreen"],
            border=COLORS["line"],
            inset=76200,
        )
    )
    slides.append(
        {
            "eyebrow": "roadmap and decisions",
            "title": "The Dashboard Story Ends With Choices",
            "subtitle": "The 90-day plan organizes source trust, taxonomy, privacy controls, prototype reporting, stakeholder adoption, and responsible AI-assisted analysis.",
            "body": "".join(parts),
        }
    )

    return slides


def content_types(slide_count: int) -> str:
    overrides = [
        ("/docProps/app.xml", "application/vnd.openxmlformats-officedocument.extended-properties+xml"),
        ("/docProps/core.xml", "application/vnd.openxmlformats-package.core-properties+xml"),
        ("/ppt/presentation.xml", "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"),
        ("/ppt/theme/theme1.xml", "application/vnd.openxmlformats-officedocument.theme+xml"),
        ("/ppt/slideMasters/slideMaster1.xml", "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"),
        ("/ppt/slideMasters/theme/theme2.xml", "application/vnd.openxmlformats-officedocument.theme+xml"),
        ("/ppt/slideLayouts/slideLayout1.xml", "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"),
        ("/ppt/notesMasters/notesMaster1.xml", "application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"),
        ("/ppt/notesMasters/theme/theme3.xml", "application/vnd.openxmlformats-officedocument.theme+xml"),
        ("/ppt/presProps.xml", "application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"),
        ("/ppt/tableStyles.xml", "application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"),
    ]
    overrides.extend(
        (f"/ppt/slides/slide{i}.xml", "application/vnd.openxmlformats-officedocument.presentationml.slide+xml")
        for i in range(1, slide_count + 1)
    )
    body = "".join(f'<Override PartName="{part}" ContentType="{content_type}"/>' for part, content_type in overrides)
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        f"{body}</Types>"
    )


def presentation_xml(slide_count: int) -> str:
    slide_ids = "".join(f'<p:sldId id="{255 + i}" r:id="rIdSlide{i}"/>' for i in range(1, slide_count + 1))
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdMaster1"/></p:sldMasterIdLst>
  <p:notesMasterIdLst><p:notesMasterId r:id="rIdNotesMaster1"/></p:notesMasterIdLst>
  <p:sldIdLst>{slide_ids}</p:sldIdLst>
  <p:sldSz cx="{W}" cy="{H}" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr></p:defaultTextStyle>
</p:presentation>"""


def presentation_rels(slide_count: int) -> str:
    rels = [
        ("rIdTheme1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme", "theme/theme1.xml"),
        ("rIdMaster1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster", "slideMasters/slideMaster1.xml"),
        ("rIdNotesMaster1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster", "notesMasters/notesMaster1.xml"),
        ("rIdPresProps", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps", "presProps.xml"),
        ("rIdTableStyles", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles", "tableStyles.xml"),
    ]
    rels.extend(
        (f"rIdSlide{i}", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide", f"slides/slide{i}.xml")
        for i in range(1, slide_count + 1)
    )
    body = "".join(f'<Relationship Id="{rid}" Type="{rel_type}" Target="{target}"/>' for rid, rel_type, target in rels)
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{body}</Relationships>'
    )


def slide_rels() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rIdLayout1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
        "</Relationships>"
    )


def app_xml(slide_count: int) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex OpenXML</Application>
  <PresentationFormat>On-screen Show (16:9)</PresentationFormat>
  <Slides>{slide_count}</Slides>
  <Notes>0</Notes>
  <HiddenSlides>0</HiddenSlides>
  <MMClips>0</MMClips>
  <ScaleCrop>false</ScaleCrop>
  <Company>City of Philadelphia / Department of Aviation prototype</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0000</AppVersion>
</Properties>"""


def core_xml() -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>PHL + PNE CRM Passenger Insights Executive Briefing</dc:title>
  <dc:subject>CRM, passenger intelligence, KPI framework, segmentation, forecasting, governance</dc:subject>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>
</cp:coreProperties>"""


def generate_deck() -> None:
    # The script reuses the existing package's masters/themes and replaces only
    # slide content. That keeps the deck editable while avoiding a heavyweight
    # presentation-generation dependency.
    slides = build_slides()
    slide_xmls = [
        slide_xml(index + 1, slide["eyebrow"], slide["title"], slide["subtitle"], slide["body"])
        for index, slide in enumerate(slides)
    ]
    exclude_exact = {
        "[Content_Types].xml",
        "ppt/presentation.xml",
        "ppt/_rels/presentation.xml.rels",
        "docProps/app.xml",
        "docProps/core.xml",
    }
    exclude_prefixes = ("ppt/slides/", "ppt/notesSlides/")

    with zipfile.ZipFile(PPTX, "r") as source, zipfile.ZipFile(TMP, "w", compression=zipfile.ZIP_DEFLATED) as target:
        for item in source.infolist():
            if item.filename in exclude_exact or any(item.filename.startswith(prefix) for prefix in exclude_prefixes):
                continue
            target.writestr(item, source.read(item.filename))
        count = len(slide_xmls)
        target.writestr("[Content_Types].xml", content_types(count))
        target.writestr("docProps/app.xml", app_xml(count))
        target.writestr("docProps/core.xml", core_xml())
        target.writestr("ppt/presentation.xml", presentation_xml(count))
        target.writestr("ppt/_rels/presentation.xml.rels", presentation_rels(count))
        for index, xml in enumerate(slide_xmls, 1):
            target.writestr(f"ppt/slides/slide{index}.xml", xml)
            target.writestr(f"ppt/slides/_rels/slide{index}.xml.rels", slide_rels())

    TMP.replace(PPTX)
    print(f"Updated {PPTX.name} with {len(slide_xmls)} slides.")


if __name__ == "__main__":
    generate_deck()
