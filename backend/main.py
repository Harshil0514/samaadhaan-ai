"""
Samaadhaan AI - Simple Demo Backend
====================================
A single-file FastAPI + SQLite backend that replaces the original
Node/Express + Firestore server for local demo / SIH presentation purposes.

This is intentionally kept SIMPLE (no ORM, no real JWT, no real AI model):
  - Storage:      SQLite file `backend/samaadhaan.db` (auto-created & auto-seeded)
  - Auth:         Fake "token" = the user's id (good enough for a demo)
  - AI analysis:  Small rule-based heuristic (keyword + urgency based) instead of Gemini

Run it with:
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

The React frontend (see vite.config.ts) proxies every request that starts with
`/api` to this server, so no frontend code needs to change - it already calls
`/api/...` everywhere (see src/services/api.ts).
"""

import json
import math
import random
import sqlite3
import string
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import Body, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# --------------------------------------------------------------------------
# Setup
# --------------------------------------------------------------------------

DB_PATH = Path(__file__).parent / "samaadhaan.db"

app = FastAPI(title="Samaadhaan AI - Demo Backend")

# Allow the Vite dev server to call us directly too (in case the proxy isn't used)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return dict(row) if row else None


def jloads(value, default):
    if value is None:
        return default
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return default


# --------------------------------------------------------------------------
# Schema
# --------------------------------------------------------------------------

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'citizen',
    organization TEXT,
    profile_image TEXT,
    govt_id_url TEXT,
    govt_id_number TEXT,
    govt_id_type TEXT,
    id_verification_status TEXT DEFAULT 'unverified',
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    icon TEXT
);

CREATE TABLE IF NOT EXISTS institutions (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    location TEXT,
    type TEXT,
    city TEXT,
    state TEXT,
    latitude REAL,
    longitude REAL,
    contact_email TEXT,
    website TEXT,
    active_projects_count INTEGER DEFAULT 0,
    completed_projects_count INTEGER DEFAULT 0,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS institution_expertise (
    id TEXT PRIMARY KEY,
    institution_id TEXT,
    category_id TEXT,
    expertise_level INTEGER,
    keywords TEXT
);

CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    category_id TEXT,
    status TEXT DEFAULT 'pending',
    urgency TEXT DEFAULT 'medium',
    latitude REAL,
    longitude REAL,
    address TEXT,
    created_by TEXT,
    priority_score REAL DEFAULT 0,
    severity_score REAL DEFAULT 0,
    duplicate_cluster_id TEXT,
    supports_count INTEGER DEFAULT 0,
    images TEXT DEFAULT '[]',
    assigned_institution_id TEXT,
    project_id TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS problem_supports (
    problem_id TEXT,
    user_id TEXT,
    PRIMARY KEY (problem_id, user_id)
);

CREATE TABLE IF NOT EXISTS ai_analysis (
    id TEXT PRIMARY KEY,
    problem_id TEXT,
    detected_category TEXT,
    category_confidence REAL,
    severity TEXT,
    severity_confidence REAL,
    priority_score REAL,
    summary TEXT,
    keywords TEXT DEFAULT '[]',
    recommended_actions TEXT DEFAULT '[]',
    priority_breakdown TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS clusters (
    id TEXT PRIMARY KEY,
    name TEXT,
    category_id TEXT,
    center_latitude REAL,
    center_longitude REAL,
    radius_km REAL DEFAULT 2,
    total_reports INTEGER DEFAULT 0,
    priority_score REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    assigned_institution_id TEXT,
    project_id TEXT,
    problem_ids TEXT DEFAULT '[]',
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    problem_id TEXT,
    problem_cluster_id TEXT,
    institution_id TEXT,
    status TEXT DEFAULT 'planning',
    progress INTEGER DEFAULT 0,
    start_date TEXT,
    expected_completion TEXT,
    prototype_info TEXT,
    documents TEXT DEFAULT '[]',
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    role TEXT
);

CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    due_date TEXT,
    completed_at TEXT
);

CREATE TABLE IF NOT EXISTS impact_metrics (
    project_id TEXT PRIMARY KEY,
    citizens_impacted INTEGER DEFAULT 0,
    reports_resolved INTEGER DEFAULT 0,
    area_covered_km2 REAL DEFAULT 0,
    cost_saved_inr INTEGER DEFAULT 0,
    time_saved_days INTEGER DEFAULT 0,
    environmental_impact TEXT,
    measurable_outcomes TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS solutions (
    id TEXT PRIMARY KEY,
    problem_id TEXT,
    title TEXT,
    description TEXT,
    domain TEXT,
    feasibility_score INTEGER DEFAULT 80,
    estimated_timeframe TEXT,
    key_technologies TEXT DEFAULT '[]',
    status TEXT DEFAULT 'suggested',
    created_by_ai INTEGER DEFAULT 0,
    votes INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT,
    message TEXT,
    type TEXT,
    is_read INTEGER DEFAULT 0,
    link TEXT,
    created_at TEXT
);
"""

# --------------------------------------------------------------------------
# Seed data (trimmed down version of the frontend's src/data/seedData.ts,
# just enough so every dashboard has something to show on first run)
# --------------------------------------------------------------------------

SEED_CATEGORIES = [
    ("cat-1", "Water Management", "Drinking water, supply disruptions, pipeline leaks & groundwater depletion", "Droplets"),
    ("cat-2", "Sanitation", "Waste disposal, open drains, sewage overflows & public toilets", "Trash2"),
    ("cat-3", "Agriculture", "Crop irrigation, soil degradation, pest management & storage", "Sprout"),
    ("cat-4", "Healthcare", "Primary health centers, medicine availability & disease outbreaks", "HeartPulse"),
    ("cat-5", "Education", "School infrastructure, digital access & clean drinking water for students", "GraduationCap"),
    ("cat-6", "Environment", "Air pollution, industrial emissions, river contamination & deforestation", "TreePine"),
    ("cat-7", "Infrastructure", "Damaged roads, collapsed culverts, bridges & streetlighting", "Building2"),
    ("cat-8", "Accessibility", "Disabled access, wheel-chair ramps, tactile paths & transit facilities", "Accessibility"),
    ("cat-9", "Public Services", "Electricity grid failures, public transport gaps & welfare delivery", "Users"),
    ("cat-10", "Rural Development", "Village connectivity, artisan support & rural livelihood challenges", "Tractor"),
    ("cat-11", "Energy", "Solar micro-grids, transformer overloads & renewable community micro-power", "Zap"),
    ("cat-12", "Urban Development", "Smart parking, pedestrian walkways & storm water management", "Landmark"),
]

SEED_INSTITUTIONS = [
    dict(id="inst-1", name="IIT Innovation & Water Tech Centre",
         description="Specializes in IoT water flow meters, groundwater purification & smart utility grids.",
         location="Jodhpur, Rajasthan", type="Premier Institute of National Importance (IIT)",
         city="Jodhpur", state="Rajasthan", latitude=26.2389, longitude=73.0243,
         contact_email="water-innov@iitj.ac.in", website="https://iitj.ac.in",
         active_projects_count=2, completed_projects_count=4,
         expertise=[("cat-1", 95, ["groundwater", "pipeline", "leakage", "purification"]),
                    ("cat-11", 88, ["solar", "microgrid", "pumps"]),
                    ("cat-7", 82, ["smart city", "structural health", "roads"])]),
    dict(id="inst-2", name="National Environmental Research & Waste Lab",
         description="Circular waste processing, decentralized bio-methanation & solid waste segregation.",
         location="Pune, Maharashtra", type="National CSIR Research Laboratory",
         city="Pune", state="Maharashtra", latitude=18.5204, longitude=73.8567,
         contact_email="solutions@neeri-lab.res.in", website="https://neeri.res.in",
         active_projects_count=1, completed_projects_count=6,
         expertise=[("cat-2", 96, ["garbage", "composting", "sewage", "drainage"]),
                    ("cat-6", 92, ["air quality", "river pollution", "industrial waste"])]),
    dict(id="inst-3", name="Agri-Tech Rural Engineering Institute",
         description="Precision irrigation, canal telemetry, crop protection & off-grid cold chain.",
         location="Varanasi, Uttar Pradesh", type="ICAR Apex Central Institute",
         city="Varanasi", state="Uttar Pradesh", latitude=25.3176, longitude=82.9739,
         contact_email="agritech@bhu-icar.ac.in", website="https://icar-agri.ac.in",
         active_projects_count=2, completed_projects_count=3,
         expertise=[("cat-3", 94, ["irrigation", "canal", "soil", "farmer"]),
                    ("cat-10", 89, ["livelihood", "storage", "off-grid"])]),
    dict(id="inst-4", name="Public Health & Biomedical Innovation Centre",
         description="Low-cost diagnostic kits, tele-consultation kiosks & rural PHC automation.",
         location="Bhopal, Madhya Pradesh", type="National AIIMS Medical Research Centre",
         city="Bhopal", state="Madhya Pradesh", latitude=23.2599, longitude=77.4126,
         contact_email="innovations@aiims-bhopal.edu.in", website="https://aiimsbhopal.edu.in",
         active_projects_count=1, completed_projects_count=2,
         expertise=[("cat-4", 95, ["telemedicine", "diagnostics", "phc", "maternal health"]),
                    ("cat-8", 85, ["prosthetics", "assistive tech", "wheelchair"])]),
    dict(id="inst-5", name="Centre for Sustainable Urban Infrastructure & Mobility",
         description="Resilient roads, non-destructive bridge inspection & storm drainage.",
         location="Bengaluru, Karnataka", type="IISc Research & Engineering Centre",
         city="Bengaluru", state="Karnataka", latitude=12.9716, longitude=77.5946,
         contact_email="urban-lab@iisc.ac.in", website="https://iisc.ac.in",
         active_projects_count=2, completed_projects_count=5,
         expertise=[("cat-7", 93, ["potholes", "flyover", "culvert", "asphalt"]),
                    ("cat-12", 90, ["smart traffic", "flood mapping", "urban drainage"])]),
]

DEMO_USERS = [
    dict(id="usr-admin-1", name="Dr. Rajesh Sharma", email="admin@civicsetu.ai", role="admin",
         organization="Ministry of Social Innovation & Public Grievances", phone="+91 98765 43210"),
    dict(id="usr-citizen-1", name="Aarav Patel", email="citizen@civicsetu.ai", role="citizen",
         organization="Mandore Residents Welfare Association", phone="+91 98123 45678"),
    dict(id="usr-inst-1", name="Dr. Priya Verma", email="institution@civicsetu.ai", role="institution",
         organization="IIT Innovation & Water Tech Centre", phone="+91 98111 22233"),
    dict(id="usr-expert-1", name="Vikramaditya Sen", email="expert@civicsetu.ai", role="expert",
         organization="Independent Policy Advisor", phone="+91 98222 33344"),
]

SAMPLE_PROBLEMS = [
    dict(id="prob-water-1", title="Severe water supply disruption in Mandore",
         description="Households in Mandore have had no piped water supply for 6 days, forcing reliance on costly private tankers.",
         category_id="cat-1", status="assigned", urgency="critical",
         latitude=26.317, longitude=73.028, address="Mandore, Jodhpur, Rajasthan",
         created_by="usr-citizen-1", supports_count=24, assigned_institution_id="inst-1"),
    dict(id="prob-waste-1", title="Urban school zone solid waste & micro-segregation challenge",
         description="Uncollected garbage piling up near a school boundary, attracting stray animals and posing health hazards.",
         category_id="cat-2", status="in_progress", urgency="high",
         latitude=18.523, longitude=73.85, address="Kothrud, Pune, Maharashtra",
         created_by="usr-citizen-1", supports_count=15, assigned_institution_id="inst-2"),
    dict(id="prob-health-1", title="Primary Health Centre cold storage vaccine freezer failure",
         description="The vaccine refrigerator at the local PHC keeps failing during power cuts, risking vaccine spoilage.",
         category_id="cat-4", status="in_progress", urgency="critical",
         latitude=23.26, longitude=77.4, address="Kolar Road PHC, Bhopal, Madhya Pradesh",
         created_by="usr-citizen-1", supports_count=9, assigned_institution_id="inst-4"),
    dict(id="prob-infra-1", title="Collapsed culvert blocking rural access road",
         description="A culvert on the only approach road to the village has collapsed after monsoon rains, cutting off access.",
         category_id="cat-7", status="under_review", urgency="high",
         latitude=12.98, longitude=77.6, address="Anekal Road, Bengaluru, Karnataka",
         created_by="usr-citizen-1", supports_count=6),
    dict(id="prob-agri-1", title="Canal irrigation leakage wasting groundwater",
         description="A major irrigation canal has multiple leakage points, wasting large volumes of water needed for the rabi crop.",
         category_id="cat-3", status="pending", urgency="medium",
         latitude=25.32, longitude=82.97, address="Chandauli, Varanasi, Uttar Pradesh",
         created_by="usr-citizen-1", supports_count=3),
]

SAMPLE_PROJECTS = [
    dict(id="proj-water-1", title="Mandore IoT Smart Water Distribution",
         description="Deploying IoT flow sensors and a leak-detection network to restore reliable water supply in Mandore.",
         problem_id="prob-water-1", institution_id="inst-1", status="pilot", progress=68,
         start_date="2025-02-05", expected_completion="2025-05-10",
         members=[("usr-inst-1", "Dr. Priya Verma", "institution@civicsetu.ai", "team_lead")],
         milestones=[
             ("Baseline network survey", "Mapped 12km of existing pipeline network.", "completed", "2025-02-20"),
             ("IoT sensor installation", "Installed flow & pressure sensors at 8 junctions.", "in_progress", "2025-04-01"),
             ("Live leak-detection dashboard", "Real-time alerting for field crews.", "pending", "2025-05-01"),
         ],
         impact=dict(citizens_impacted=9200, reports_resolved=24, area_covered_km2=6.5,
                     cost_saved_inr=310000, time_saved_days=18,
                     environmental_impact="Reduces non-revenue water loss by an estimated 22%.",
                     measurable_outcomes=["Restored 24x7 supply to 3 wards", "Cut tanker dependency by 60%"])),
    dict(id="proj-waste-1", title="Decentralized Micro-Biomethanation & Smart Sensor Waste Hub",
         description="Converting organic school waste into biogas and compost with fill-level sensor bins.",
         problem_id="prob-waste-1", institution_id="inst-2", status="testing", progress=82,
         start_date="2025-02-16", expected_completion="2025-04-20",
         members=[("usr-inst-1", "Dr. Anil Kulkarni", "kulkarni@neeri.res.in", "team_lead")],
         milestones=[
             ("Baseline waste characterization", "Quantified organic vs plastic fraction.", "completed", "2025-02-25"),
             ("Smart bin sensor prototype", "IP67 dustproof ultrasonic sensor node.", "completed", "2025-03-10"),
             ("Bio-digester fabrication", "Assembling odorless sealed bio-digester.", "in_progress", "2025-04-05"),
         ],
         impact=dict(citizens_impacted=14200, reports_resolved=15, area_covered_km2=2.2,
                     cost_saved_inr=420000, time_saved_days=30,
                     environmental_impact="Diverts 1.5 tons of organic waste daily from landfill.",
                     measurable_outcomes=["Eliminated open garbage heaps near school", "Zero dengue cases post-pilot"])),
]

SAMPLE_SOLUTIONS = [
    dict(id="sd-1", problem_id="prob-water-1", title="Decentralized Solar-Powered Defluoridation Units",
         description="Electrochemical filtration at community water hubs to cut fluoride levels without wasting water.",
         domain="Water Chemistry & Renewable Energy", feasibility_score=92, estimated_timeframe="6-8 weeks",
         key_technologies=["Electrochemical Coagulation", "Solar MPPT", "TDS Sensors"],
         status="approved", created_by_ai=1, votes=48),
    dict(id="sd-2", problem_id="prob-water-1", title="LoRaWAN Acoustic Leakage Detection Network",
         description="Clamp ultrasonic transducers along underground junctions to triangulate pipe bursts.",
         domain="IoT & Telemetry", feasibility_score=88, estimated_timeframe="4-6 weeks",
         key_technologies=["LoRaWAN", "Acoustic Sensors", "GIS Mapping"],
         status="in_development", created_by_ai=1, votes=35),
    dict(id="sd-4", problem_id="prob-waste-1", title="School-Adjacent Compact Anaerobic Bio-Digesters",
         description="Process food & organic canteen waste on-site into odorless cooking methane gas.",
         domain="Biotechnology & Circular Economy", feasibility_score=91, estimated_timeframe="5-7 weeks",
         key_technologies=["Anaerobic Digestion", "Methane Filtration", "Slurry Enrichment"],
         status="approved", created_by_ai=1, votes=52),
]

SAMPLE_NOTIFICATIONS = [
    dict(id="notif-1", user_id="usr-citizen-1", title="Innovation Project Created!",
         message='Your report "Severe water supply disruption in Mandore" is now a project with IIT Jodhpur.',
         type="assignment", link="/projects/proj-water-1"),
    dict(id="notif-2", user_id="usr-citizen-1", title="AI Duplicate Cluster Identified",
         message="Similar complaints in your area were merged into a Community Challenge.",
         type="analysis", link="/challenges"),
    dict(id="notif-3", user_id="usr-inst-1", title="New High Compatibility Challenge Match (95%)",
         message="A new report matches your institution's expertise. One-click acceptance available.",
         type="assignment", link="/institution/challenges"),
]


def seed_database(conn: sqlite3.Connection) -> None:
    """Populate a fresh database with demo data. Safe to call repeatedly (idempotent)."""
    conn.executescript(SCHEMA)

    conn.execute("DELETE FROM users")
    conn.execute("DELETE FROM categories")
    conn.execute("DELETE FROM institutions")
    conn.execute("DELETE FROM institution_expertise")
    conn.execute("DELETE FROM problems")
    conn.execute("DELETE FROM problem_supports")
    conn.execute("DELETE FROM ai_analysis")
    conn.execute("DELETE FROM clusters")
    conn.execute("DELETE FROM projects")
    conn.execute("DELETE FROM project_members")
    conn.execute("DELETE FROM milestones")
    conn.execute("DELETE FROM impact_metrics")
    conn.execute("DELETE FROM solutions")
    conn.execute("DELETE FROM notifications")

    ts = now_iso()

    for cid, name, desc, icon in SEED_CATEGORIES:
        conn.execute("INSERT INTO categories (id, name, description, icon) VALUES (?,?,?,?)",
                     (cid, name, desc, icon))

    for inst in SEED_INSTITUTIONS:
        conn.execute(
            """INSERT INTO institutions
               (id,name,description,location,type,city,state,latitude,longitude,contact_email,
                website,active_projects_count,completed_projects_count,created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (inst["id"], inst["name"], inst["description"], inst["location"], inst["type"],
             inst["city"], inst["state"], inst["latitude"], inst["longitude"], inst["contact_email"],
             inst["website"], inst["active_projects_count"], inst["completed_projects_count"], ts),
        )
        for cat_id, level, keywords in inst["expertise"]:
            conn.execute(
                "INSERT INTO institution_expertise (id, institution_id, category_id, expertise_level, keywords) VALUES (?,?,?,?,?)",
                (new_id("exp"), inst["id"], cat_id, level, json.dumps(keywords)),
            )

    for u in DEMO_USERS:
        conn.execute(
            """INSERT INTO users (id,name,email,phone,password,role,organization,created_at,updated_at)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (u["id"], u["name"], u["email"], u["phone"], hash_password("demo1234"),
             u["role"], u["organization"], ts, ts),
        )

    for p in SAMPLE_PROBLEMS:
        conn.execute(
            """INSERT INTO problems
               (id,title,description,category_id,status,urgency,latitude,longitude,address,
                created_by,priority_score,severity_score,supports_count,images,
                assigned_institution_id,created_at,updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (p["id"], p["title"], p["description"], p["category_id"], p["status"], p["urgency"],
             p["latitude"], p["longitude"], p["address"], p["created_by"],
             *compute_priority(p["urgency"], p["supports_count"]),
             p["supports_count"], json.dumps([]), p.get("assigned_institution_id"), ts, ts),
        )
        analysis = build_ai_analysis(p["id"], p["title"], p["description"], p["urgency"])
        insert_ai_analysis(conn, analysis)

    for proj in SAMPLE_PROJECTS:
        conn.execute(
            """INSERT INTO projects
               (id,title,description,problem_id,institution_id,status,progress,
                start_date,expected_completion,created_at,updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (proj["id"], proj["title"], proj["description"], proj["problem_id"], proj["institution_id"],
             proj["status"], proj["progress"], proj["start_date"], proj["expected_completion"], ts, ts),
        )
        conn.execute("UPDATE problems SET project_id = ? WHERE id = ?", (proj["id"], proj["problem_id"]))
        for user_id, user_name, user_email, role in proj["members"]:
            conn.execute(
                "INSERT INTO project_members (id,project_id,user_id,user_name,user_email,role) VALUES (?,?,?,?,?,?)",
                (new_id("pm"), proj["id"], user_id, user_name, user_email, role),
            )
        for title, description, status, due_date in proj["milestones"]:
            completed_at = due_date if status == "completed" else None
            conn.execute(
                """INSERT INTO milestones (id,project_id,title,description,status,due_date,completed_at)
                   VALUES (?,?,?,?,?,?,?)""",
                (new_id("m"), proj["id"], title, description, status, due_date, completed_at),
            )
        imp = proj["impact"]
        conn.execute(
            """INSERT INTO impact_metrics
               (project_id,citizens_impacted,reports_resolved,area_covered_km2,cost_saved_inr,
                time_saved_days,environmental_impact,measurable_outcomes)
               VALUES (?,?,?,?,?,?,?,?)""",
            (proj["id"], imp["citizens_impacted"], imp["reports_resolved"], imp["area_covered_km2"],
             imp["cost_saved_inr"], imp["time_saved_days"], imp["environmental_impact"],
             json.dumps(imp["measurable_outcomes"])),
        )

    for s in SAMPLE_SOLUTIONS:
        conn.execute(
            """INSERT INTO solutions
               (id,problem_id,title,description,domain,feasibility_score,estimated_timeframe,
                key_technologies,status,created_by_ai,votes)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (s["id"], s["problem_id"], s["title"], s["description"], s["domain"], s["feasibility_score"],
             s["estimated_timeframe"], json.dumps(s["key_technologies"]), s["status"], s["created_by_ai"], s["votes"]),
        )

    for n in SAMPLE_NOTIFICATIONS:
        conn.execute(
            """INSERT INTO notifications (id,user_id,title,message,type,is_read,link,created_at)
               VALUES (?,?,?,?,?,?,?,?)""",
            (n["id"], n["user_id"], n["title"], n["message"], n["type"], 0, n["link"], ts),
        )


def hash_password(password: str) -> str:
    # Deliberately simple for a demo project - do NOT use in production.
    import hashlib
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def init_db() -> None:
    fresh = not DB_PATH.exists()
    with get_db() as conn:
        conn.executescript(SCHEMA)
        if fresh:
            seed_database(conn)


# --------------------------------------------------------------------------
# Tiny "AI" heuristics (keyword + urgency based, no external model needed)
# --------------------------------------------------------------------------

URGENCY_WEIGHT = {"low": 20, "medium": 45, "high": 70, "critical": 92}

CATEGORY_KEYWORDS = {
    "cat-1": ["water", "pipeline", "tanker", "supply", "leak", "groundwater", "tap"],
    "cat-2": ["garbage", "waste", "drain", "sewage", "trash", "toilet"],
    "cat-3": ["crop", "irrigation", "farmer", "soil", "canal", "pest"],
    "cat-4": ["hospital", "health", "vaccine", "medicine", "disease", "clinic"],
    "cat-5": ["school", "classroom", "teacher", "student", "education"],
    "cat-6": ["pollution", "air", "river", "forest", "emission", "environment"],
    "cat-7": ["road", "bridge", "culvert", "streetlight", "pothole", "infrastructure"],
    "cat-8": ["wheelchair", "ramp", "disabled", "accessibility", "braille"],
    "cat-9": ["electricity", "transport", "bus", "grid", "power cut"],
    "cat-10": ["village", "rural", "artisan", "livelihood"],
    "cat-11": ["solar", "transformer", "energy", "micro-grid"],
    "cat-12": ["traffic", "parking", "urban", "footpath", "storm water"],
}


def detect_category(text: str) -> (str, float):
    text_lower = text.lower()
    best_cat, best_hits = "cat-7", 0
    for cat_id, keywords in CATEGORY_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw in text_lower)
        if hits > best_hits:
            best_cat, best_hits = cat_id, hits
    confidence = min(0.99, 0.55 + best_hits * 0.12)
    return best_cat, round(confidence, 2)


def compute_priority(urgency: str, supports_count: int) -> (float, float):
    """Returns (priority_score, severity_score) - simple weighted heuristic."""
    severity = URGENCY_WEIGHT.get(urgency, 45)
    citizens_boost = min(30, supports_count * 1.5)
    priority = round(min(100, severity * 0.7 + citizens_boost), 1)
    return priority, float(severity)


def build_ai_analysis(problem_id: str, title: str, description: str, urgency: str) -> Dict[str, Any]:
    category_id, confidence = detect_category(f"{title} {description}")
    priority, severity = compute_priority(urgency, 0)
    words = [w.strip(string.punctuation).lower() for w in f"{title} {description}".split()]
    keywords = list(dict.fromkeys(w for w in words if len(w) > 5))[:6]
    breakdown = {
        "severityContribution": round(severity * 0.3, 1),
        "citizensContribution": 0,
        "clusterContribution": 0,
        "urgencyContribution": round(severity * 0.15, 1),
        "locationRiskContribution": round(severity * 0.10, 1),
        "severityRaw": severity,
        "citizensCount": 0,
        "clusterSize": 1,
        "urgencyRaw": severity,
        "locationRiskRaw": 50,
        "explanation": "Priority computed from reported urgency, keyword severity signals and citizen support count.",
    }
    return {
        "id": new_id("ai"),
        "problem_id": problem_id,
        "detected_category": category_id,
        "category_confidence": confidence,
        "severity": urgency,
        "severity_confidence": 0.8,
        "priority_score": priority,
        "summary": (description[:160] + "...") if len(description) > 160 else description,
        "keywords": keywords,
        "recommended_actions": [
            "Verify the report with a field visit or photographic evidence",
            "Check for similar / duplicate reports nearby before assigning",
            "Route to the most relevant institution based on category expertise",
        ],
        "priority_breakdown": breakdown,
        "created_at": now_iso(),
    }


def insert_ai_analysis(conn: sqlite3.Connection, analysis: Dict[str, Any]) -> None:
    conn.execute(
        """INSERT INTO ai_analysis
           (id,problem_id,detected_category,category_confidence,severity,severity_confidence,
            priority_score,summary,keywords,recommended_actions,priority_breakdown,created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
        (analysis["id"], analysis["problem_id"], analysis["detected_category"], analysis["category_confidence"],
         analysis["severity"], analysis["severity_confidence"], analysis["priority_score"], analysis["summary"],
         json.dumps(analysis["keywords"]), json.dumps(analysis["recommended_actions"]),
         json.dumps(analysis["priority_breakdown"]), analysis["created_at"]),
    )


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    dlat, dlon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


# --------------------------------------------------------------------------
# Serialization helpers
# --------------------------------------------------------------------------

def serialize_category(row) -> Dict[str, Any]:
    d = row_to_dict(row)
    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) c FROM problems WHERE category_id = ?", (d["id"],)).fetchone()["c"]
    d["count"] = count
    return d


def serialize_institution(row, conn: sqlite3.Connection) -> Dict[str, Any]:
    d = row_to_dict(row)
    expertise_rows = conn.execute("SELECT * FROM institution_expertise WHERE institution_id = ?", (d["id"],)).fetchall()
    cats = {c["id"]: c["name"] for c in conn.execute("SELECT id, name FROM categories").fetchall()}
    d["expertise"] = [
        {
            "id": e["id"], "institution_id": e["institution_id"], "category_id": e["category_id"],
            "category_name": cats.get(e["category_id"]),
            "expertise_level": e["expertise_level"], "keywords": jloads(e["keywords"], []),
        }
        for e in expertise_rows
    ]
    return d


def serialize_problem(row, conn: sqlite3.Connection, user_id: Optional[str] = None) -> Dict[str, Any]:
    d = row_to_dict(row)
    d["images"] = jloads(d.get("images"), [])
    cat = conn.execute("SELECT name FROM categories WHERE id = ?", (d["category_id"],)).fetchone()
    d["category_name"] = cat["name"] if cat else None
    author = conn.execute("SELECT name, email FROM users WHERE id = ?", (d["created_by"],)).fetchone()
    d["author_name"] = author["name"] if author else "Anonymous Citizen"
    d["author_email"] = author["email"] if author else None
    if d.get("assigned_institution_id"):
        inst = conn.execute("SELECT name FROM institutions WHERE id = ?", (d["assigned_institution_id"],)).fetchone()
        d["assigned_institution_name"] = inst["name"] if inst else None
    if d.get("duplicate_cluster_id"):
        cl = conn.execute("SELECT name FROM clusters WHERE id = ?", (d["duplicate_cluster_id"],)).fetchone()
        d["cluster_name"] = cl["name"] if cl else None
    analysis_row = conn.execute(
        "SELECT * FROM ai_analysis WHERE problem_id = ? ORDER BY created_at DESC LIMIT 1", (d["id"],)
    ).fetchone()
    if analysis_row:
        a = row_to_dict(analysis_row)
        a["keywords"] = jloads(a["keywords"], [])
        a["recommended_actions"] = jloads(a["recommended_actions"], [])
        a["priority_breakdown"] = jloads(a["priority_breakdown"], None)
        d["ai_analysis"] = a
    if user_id:
        supported = conn.execute(
            "SELECT 1 FROM problem_supports WHERE problem_id = ? AND user_id = ?", (d["id"], user_id)
        ).fetchone()
        d["has_user_supported"] = bool(supported)
    return d


def serialize_cluster(row, conn: sqlite3.Connection) -> Dict[str, Any]:
    d = row_to_dict(row)
    d["problem_ids"] = jloads(d.get("problem_ids"), [])
    cat = conn.execute("SELECT name FROM categories WHERE id = ?", (d["category_id"],)).fetchone()
    d["category_name"] = cat["name"] if cat else None
    if d.get("assigned_institution_id"):
        inst = conn.execute("SELECT name FROM institutions WHERE id = ?", (d["assigned_institution_id"],)).fetchone()
        d["assigned_institution_name"] = inst["name"] if inst else None
    return d


def serialize_project(row, conn: sqlite3.Connection) -> Dict[str, Any]:
    d = row_to_dict(row)
    d["documents"] = jloads(d.get("documents"), [])
    inst = conn.execute("SELECT name FROM institutions WHERE id = ?", (d["institution_id"],)).fetchone()
    d["institution_name"] = inst["name"] if inst else None
    if d.get("problem_id"):
        prob = conn.execute("SELECT title FROM problems WHERE id = ?", (d["problem_id"],)).fetchone()
        d["problem_title"] = prob["title"] if prob else None
    d["members"] = [row_to_dict(m) for m in conn.execute(
        "SELECT * FROM project_members WHERE project_id = ?", (d["id"],)
    ).fetchall()]
    d["milestones"] = [row_to_dict(m) for m in conn.execute(
        "SELECT * FROM milestones WHERE project_id = ?", (d["id"],)
    ).fetchall()]
    impact_row = conn.execute("SELECT * FROM impact_metrics WHERE project_id = ?", (d["id"],)).fetchone()
    if impact_row:
        impact = row_to_dict(impact_row)
        impact["measurable_outcomes"] = jloads(impact["measurable_outcomes"], [])
        d["impact_metrics"] = impact
    return d


def serialize_solution(row) -> Dict[str, Any]:
    d = row_to_dict(row)
    d["key_technologies"] = jloads(d.get("key_technologies"), [])
    d["created_by_ai"] = bool(d.get("created_by_ai"))
    return d


def serialize_user(row) -> Dict[str, Any]:
    d = row_to_dict(row)
    d.pop("password", None)
    return d


# --------------------------------------------------------------------------
# Auth (demo-only: the "token" is simply the user's id)
# --------------------------------------------------------------------------

def get_current_user(authorization: Optional[str], conn: sqlite3.Connection) -> Optional[Dict[str, Any]]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    user_id = authorization.replace("Bearer ", "").strip()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return serialize_user(row) if row else None


# --------------------------------------------------------------------------
# Routes: health & auth
# --------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Samaadhaan AI Demo Backend (FastAPI + SQLite)",
            "timestamp": now_iso(), "ai_mode": "local_demo_heuristic"}


@app.post("/api/auth/register")
def register(payload: Dict[str, Any] = Body(...)):
    with get_db() as conn:
        existing = None
        if payload.get("email"):
            existing = conn.execute("SELECT * FROM users WHERE email = ?", (payload["email"],)).fetchone()
        if existing:
            raise HTTPException(400, "An account with this email already exists")
        user_id = new_id("usr")
        ts = now_iso()
        conn.execute(
            """INSERT INTO users (id,name,email,phone,password,role,organization,govt_id_url,
               govt_id_number,govt_id_type,id_verification_status,created_at,updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (user_id, payload.get("name", "New User"), payload.get("email"), payload.get("phone"),
             hash_password(payload.get("password", "")), payload.get("role", "citizen"),
             payload.get("organization"), payload.get("govt_id_url"), payload.get("govt_id_number"),
             payload.get("govt_id_type"), "pending" if payload.get("govt_id_url") else "unverified", ts, ts),
        )
        user = serialize_user(conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone())
        return {"user": user, "token": user_id}


@app.post("/api/auth/login")
def login(payload: Dict[str, Any] = Body(...)):
    identifier = payload.get("identifier") or payload.get("email") or payload.get("phone")
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ? OR phone = ?", (identifier, identifier)
        ).fetchone()
        if not row:
            raise HTTPException(401, "No account found for this email / phone")
        # Demo-only check: password is not strictly enforced for the seeded demo accounts.
        user = serialize_user(row)
        return {"user": user, "token": user["id"]}


@app.get("/api/auth/me")
def get_me(authorization: Optional[str] = Header(None)):
    with get_db() as conn:
        user = get_current_user(authorization, conn)
        if not user:
            raise HTTPException(401, "Not authenticated")
        return {"user": user}


@app.post("/api/auth/switch-demo")
def switch_demo(payload: Dict[str, Any] = Body(...)):
    role = payload.get("role", "citizen")
    demo_email_map = {
        "citizen": "citizen@civicsetu.ai", "admin": "admin@civicsetu.ai",
        "institution": "institution@civicsetu.ai", "expert": "expert@civicsetu.ai",
    }
    email = demo_email_map.get(role, "citizen@civicsetu.ai")
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if not row:
            raise HTTPException(404, "Demo user not found")
        user = serialize_user(row)
        return {"user": user, "token": user["id"]}


# --------------------------------------------------------------------------
# Routes: categories & institutions
# --------------------------------------------------------------------------

@app.get("/api/categories")
def list_categories():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM categories ORDER BY name").fetchall()
        return [serialize_category(r) for r in rows]


@app.get("/api/institutions")
def list_institutions():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM institutions ORDER BY name").fetchall()
        return [serialize_institution(r, conn) for r in rows]


@app.get("/api/institutions/recommendations/{problem_id}")
def institution_recommendations(problem_id: str):
    with get_db() as conn:
        problem = conn.execute("SELECT * FROM problems WHERE id = ?", (problem_id,)).fetchone()
        if not problem:
            raise HTTPException(404, "Problem not found")
        problem = row_to_dict(problem)
        institutions = conn.execute("SELECT * FROM institutions").fetchall()
        results = []
        for inst_row in institutions:
            inst = serialize_institution(inst_row, conn)
            match = next((e for e in inst["expertise"] if e["category_id"] == problem["category_id"]), None)
            category_score = match["expertise_level"] if match else 20
            keyword_score = 70 if match and match["keywords"] else 40
            distance = haversine_km(problem["latitude"], problem["longitude"], inst["latitude"], inst["longitude"])
            availability_score = max(20, 100 - inst["active_projects_count"] * 15)
            compatibility = round(category_score * 0.45 + keyword_score * 0.25 + availability_score * 0.15
                                   + max(0, 100 - distance) * 0.15, 1)
            results.append({
                "institution": inst,
                "compatibility_score": compatibility,
                "category_match_score": category_score,
                "keyword_match_score": keyword_score,
                "expertise_score": category_score,
                "availability_score": availability_score,
                "match_reasons": [
                    f"{category_score}% expertise match in this problem's category",
                    f"Located {round(distance)}km from the reported issue",
                ],
            })
        results.sort(key=lambda r: r["compatibility_score"], reverse=True)
        return results


# --------------------------------------------------------------------------
# Routes: problems
# --------------------------------------------------------------------------

@app.get("/api/problems")
def list_problems(category: Optional[str] = None, status: Optional[str] = None,
                   urgency: Optional[str] = None, search: Optional[str] = None,
                   clusterId: Optional[str] = None, institutionId: Optional[str] = None,
                   limit: Optional[int] = None, authorization: Optional[str] = Header(None)):
    with get_db() as conn:
        user = get_current_user(authorization, conn)
        query = "SELECT * FROM problems WHERE 1=1"
        params: List[Any] = []
        if category and category != "all":
            query += " AND category_id = ?"
            params.append(category)
        if status and status != "all":
            query += " AND status = ?"
            params.append(status)
        if urgency and urgency != "all":
            query += " AND urgency = ?"
            params.append(urgency)
        if clusterId:
            query += " AND duplicate_cluster_id = ?"
            params.append(clusterId)
        if institutionId:
            query += " AND assigned_institution_id = ?"
            params.append(institutionId)
        if search:
            query += " AND (title LIKE ? OR description LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])
        query += " ORDER BY priority_score DESC, created_at DESC"
        if limit:
            query += " LIMIT ?"
            params.append(limit)
        rows = conn.execute(query, params).fetchall()
        return [serialize_problem(r, conn, user["id"] if user else None) for r in rows]


@app.get("/api/problems/{problem_id}")
def get_problem(problem_id: str, authorization: Optional[str] = Header(None)):
    with get_db() as conn:
        user = get_current_user(authorization, conn)
        row = conn.execute("SELECT * FROM problems WHERE id = ?", (problem_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Problem not found")
        problem = serialize_problem(row, conn, user["id"] if user else None)

        all_others = conn.execute(
            "SELECT * FROM problems WHERE id != ? AND category_id = ?", (problem_id, problem["category_id"])
        ).fetchall()
        similar_problems = []
        for other in all_others:
            other_d = row_to_dict(other)
            distance = haversine_km(problem["latitude"], problem["longitude"], other_d["latitude"], other_d["longitude"])
            if distance < 25:
                similarity = round(max(0, 100 - distance * 3), 1)
                similar_problems.append({
                    "problem": serialize_problem(other, conn),
                    "similarityScore": similarity,
                    "distanceKm": round(distance, 2),
                })
        similar_problems.sort(key=lambda s: s["similarityScore"], reverse=True)

        institutions = conn.execute("SELECT * FROM institutions").fetchall()
        recommended = []
        for inst_row in institutions:
            inst = serialize_institution(inst_row, conn)
            match = next((e for e in inst["expertise"] if e["category_id"] == problem["category_id"]), None)
            if match:
                recommended.append({
                    "institution": inst, "compatibility_score": match["expertise_level"],
                    "category_match_score": match["expertise_level"], "keyword_match_score": 70,
                    "expertise_score": match["expertise_level"], "availability_score": 80,
                    "match_reasons": [f"{match['expertise_level']}% expertise match"],
                })
        recommended.sort(key=lambda r: r["compatibility_score"], reverse=True)

        solutions = [serialize_solution(s) for s in conn.execute(
            "SELECT * FROM solutions WHERE problem_id = ?", (problem_id,)
        ).fetchall()]

        return {**problem, "similar_problems": similar_problems[:5],
                "recommended_institutions": recommended[:3], "solutions": solutions}


@app.post("/api/ai/preview-analyze")
def preview_analyze(payload: Dict[str, Any] = Body(...)):
    title, description = payload.get("title", ""), payload.get("description", "")
    urgency = payload.get("urgency", "medium")
    with get_db() as conn:
        analysis = build_ai_analysis("preview", title, description, urgency)
        category_id = analysis["detected_category"]
        candidates = conn.execute("SELECT * FROM problems WHERE category_id = ?", (category_id,)).fetchall()
        similar_problems = []
        lat, lon = payload.get("latitude"), payload.get("longitude")
        for c in candidates:
            c_d = row_to_dict(c)
            distance = haversine_km(lat, lon, c_d["latitude"], c_d["longitude"]) if lat and lon else 999
            title_overlap = len(set(title.lower().split()) & set(c_d["title"].lower().split()))
            if distance < 10 or title_overlap >= 2:
                similarity = round(max(0, 100 - distance * 4 + title_overlap * 10), 1)
                similar_problems.append({
                    "problem": serialize_problem(c, conn), "similarityScore": min(99, similarity),
                    "distanceKm": round(distance, 2) if distance != 999 else None,
                })
        similar_problems.sort(key=lambda s: s["similarityScore"], reverse=True)
        duplicate_score = similar_problems[0]["similarityScore"] if similar_problems else 0
        recommended_cluster_id = None
        if similar_problems:
            top = similar_problems[0]["problem"]
            recommended_cluster_id = top.get("duplicate_cluster_id")
        return {
            "analysis": analysis,
            "duplicate_check": {
                "duplicateScore": duplicate_score,
                "similarProblems": similar_problems[:5],
                "recommendedClusterId": recommended_cluster_id,
            },
        }


@app.post("/api/problems")
def create_problem(payload: Dict[str, Any] = Body(...), authorization: Optional[str] = Header(None)):
    with get_db() as conn:
        user = get_current_user(authorization, conn)
        created_by = user["id"] if user else "usr-citizen-1"
        problem_id = new_id("prob")
        ts = now_iso()
        urgency = payload.get("urgency", "medium")
        title, description = payload.get("title", ""), payload.get("description", "")
        category_id = payload.get("category_id")
        if not category_id:
            category_id, _ = detect_category(f"{title} {description}")
        priority, severity = compute_priority(urgency, 0)
        conn.execute(
            """INSERT INTO problems
               (id,title,description,category_id,status,urgency,latitude,longitude,address,
                created_by,priority_score,severity_score,duplicate_cluster_id,supports_count,
                images,created_at,updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (problem_id, title, description, category_id, "pending", urgency,
             payload.get("latitude", 0), payload.get("longitude", 0), payload.get("address", ""),
             created_by, priority, severity, payload.get("cluster_id_to_join"), 0,
             json.dumps(payload.get("images", [])), ts, ts),
        )
        analysis = build_ai_analysis(problem_id, title, description, urgency)
        insert_ai_analysis(conn, analysis)

        solutions = []
        for i, sol in enumerate(generate_solution_suggestions(title, description)):
            sol_id = new_id("sd")
            conn.execute(
                """INSERT INTO solutions (id,problem_id,title,description,domain,feasibility_score,
                   estimated_timeframe,key_technologies,status,created_by_ai,votes)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                (sol_id, problem_id, sol["title"], sol["description"], sol["domain"], sol["feasibility_score"],
                 sol["estimated_timeframe"], json.dumps(sol["key_technologies"]), "suggested", 1, 0),
            )
            solutions.append({**sol, "id": sol_id, "problem_id": problem_id, "status": "suggested",
                               "created_by_ai": True, "votes": 0})

        problem_row = conn.execute("SELECT * FROM problems WHERE id = ?", (problem_id,)).fetchone()
        problem = serialize_problem(problem_row, conn, created_by)
        return {"problem": problem, "ai_analysis": problem["ai_analysis"], "solutions": solutions}


def generate_solution_suggestions(title: str, description: str) -> List[Dict[str, Any]]:
    category_id, _ = detect_category(f"{title} {description}")
    presets = {
        "cat-1": ("Community-Scale Water Monitoring & Leak Alerts", "Water Engineering & IoT",
                  ["IoT Sensors", "Flow Meters", "Mobile Alerts"]),
        "cat-2": ("Smart Segregation & Scheduled Micro-Collection", "Waste Management",
                  ["Route Optimization", "Segregation Bins", "SMS Alerts"]),
        "cat-3": ("Precision Drip Irrigation Retrofit", "AgriTech",
                  ["Drip Irrigation", "Soil Sensors", "Solar Pumps"]),
        "cat-4": ("Solar-Backed Cold Chain Kiosk", "Biomedical Engineering",
                  ["PCM Thermal Storage", "Solar Power", "Telemedicine"]),
    }
    title_, domain, techs = presets.get(category_id, ("Community Action Plan & Technical Assessment",
                                                        "Applied Technology & Civic Engineering",
                                                        ["Field Survey", "Low-Cost Sensors", "Community Reporting"]))
    return [{
        "title": title_,
        "description": f"AI-suggested direction based on the reported issue: {description[:120]}",
        "domain": domain,
        "feasibility_score": random.randint(78, 94),
        "estimated_timeframe": random.choice(["3-5 weeks", "4-6 weeks", "6-8 weeks"]),
        "key_technologies": techs,
    }]


@app.put("/api/problems/{problem_id}")
def update_problem(problem_id: str, updates: Dict[str, Any] = Body(...)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM problems WHERE id = ?", (problem_id,)).fetchone()
        if not existing:
            raise HTTPException(404, "Problem not found")
        allowed = {"title", "description", "status", "urgency", "assigned_institution_id",
                   "project_id", "duplicate_cluster_id", "category_id"}
        fields, values = [], []
        for key, value in updates.items():
            if key in allowed:
                fields.append(f"{key} = ?")
                values.append(value)
        if fields:
            fields.append("updated_at = ?")
            values.append(now_iso())
            values.append(problem_id)
            conn.execute(f"UPDATE problems SET {', '.join(fields)} WHERE id = ?", values)
        row = conn.execute("SELECT * FROM problems WHERE id = ?", (problem_id,)).fetchone()
        return {"problem": serialize_problem(row, conn)}


@app.post("/api/problems/{problem_id}/support")
def support_problem(problem_id: str, authorization: Optional[str] = Header(None)):
    with get_db() as conn:
        user = get_current_user(authorization, conn)
        user_id = user["id"] if user else "anonymous"
        row = conn.execute("SELECT * FROM problems WHERE id = ?", (problem_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Problem not found")
        already = conn.execute(
            "SELECT 1 FROM problem_supports WHERE problem_id = ? AND user_id = ?", (problem_id, user_id)
        ).fetchone()
        problem = row_to_dict(row)
        if already:
            conn.execute("DELETE FROM problem_supports WHERE problem_id = ? AND user_id = ?", (problem_id, user_id))
            new_count = max(0, problem["supports_count"] - 1)
            supported = False
        else:
            conn.execute("INSERT INTO problem_supports (problem_id, user_id) VALUES (?, ?)", (problem_id, user_id))
            new_count = problem["supports_count"] + 1
            supported = True
        new_priority, _ = compute_priority(problem["urgency"], new_count)
        conn.execute("UPDATE problems SET supports_count = ?, priority_score = ?, updated_at = ? WHERE id = ?",
                     (new_count, new_priority, now_iso(), problem_id))
        return {"supported": supported, "count": new_count, "new_priority_score": new_priority}


@app.post("/api/problems/{problem_id}/solutions")
def add_solution(problem_id: str, payload: Dict[str, Any] = Body(...)):
    with get_db() as conn:
        problem = conn.execute("SELECT id FROM problems WHERE id = ?", (problem_id,)).fetchone()
        if not problem:
            raise HTTPException(404, "Problem not found")
        sol_id = new_id("sd")
        conn.execute(
            """INSERT INTO solutions (id,problem_id,title,description,domain,feasibility_score,
               estimated_timeframe,key_technologies,status,created_by_ai,votes)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (sol_id, problem_id, payload.get("title", "Untitled Solution"), payload.get("description", ""),
             payload.get("domain", "Community Proposed"), payload.get("feasibility_score", 75),
             payload.get("estimated_timeframe", "4-6 weeks"),
             json.dumps(payload.get("key_technologies", [])), "suggested", 0, 1),
        )
        row = conn.execute("SELECT * FROM solutions WHERE id = ?", (sol_id,)).fetchone()
        return serialize_solution(row)


@app.get("/api/problems/{problem_id}/solutions")
def get_solutions_for_problem(problem_id: str):
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM solutions WHERE problem_id = ? ORDER BY votes DESC", (problem_id,)).fetchall()
        return [serialize_solution(r) for r in rows]


@app.post("/api/solutions/{solution_id}/vote")
def vote_solution(solution_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM solutions WHERE id = ?", (solution_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Solution not found")
        new_votes = row["votes"] + 1
        conn.execute("UPDATE solutions SET votes = ? WHERE id = ?", (new_votes, solution_id))
        return {"votes": new_votes}


@app.put("/api/solutions/{solution_id}/status")
def update_solution_status(solution_id: str, payload: Dict[str, Any] = Body(...)):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM solutions WHERE id = ?", (solution_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Solution not found")
        conn.execute("UPDATE solutions SET status = ? WHERE id = ?", (payload.get("status", row["status"]), solution_id))
        updated = conn.execute("SELECT * FROM solutions WHERE id = ?", (solution_id,)).fetchone()
        return serialize_solution(updated)


# --------------------------------------------------------------------------
# Routes: clusters
# --------------------------------------------------------------------------

@app.get("/api/clusters")
def list_clusters():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM clusters ORDER BY priority_score DESC").fetchall()
        return [serialize_cluster(r, conn) for r in rows]


@app.get("/api/clusters/{cluster_id}")
def get_cluster(cluster_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM clusters WHERE id = ?", (cluster_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Cluster not found")
        cluster = serialize_cluster(row, conn)
        problems = []
        for pid in cluster["problem_ids"]:
            p = conn.execute("SELECT * FROM problems WHERE id = ?", (pid,)).fetchone()
            if p:
                problems.append(serialize_problem(p, conn))
        return {**cluster, "problems": problems}


@app.post("/api/clusters")
def create_cluster(payload: Dict[str, Any] = Body(...)):
    with get_db() as conn:
        cluster_id = new_id("cluster")
        problem_ids = payload.get("problem_ids", [])
        problems = [row_to_dict(conn.execute("SELECT * FROM problems WHERE id = ?", (pid,)).fetchone())
                    for pid in problem_ids]
        problems = [p for p in problems if p]
        if problems:
            center_lat = sum(p["latitude"] for p in problems) / len(problems)
            center_lon = sum(p["longitude"] for p in problems) / len(problems)
            avg_priority = sum(p["priority_score"] for p in problems) / len(problems)
        else:
            center_lat = center_lon = avg_priority = 0
        conn.execute(
            """INSERT INTO clusters (id,name,category_id,center_latitude,center_longitude,radius_km,
               total_reports,priority_score,status,problem_ids,created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (cluster_id, payload.get("name", "New Cluster"), payload.get("category_id"), center_lat, center_lon,
             payload.get("radius_km", 2), len(problems), round(avg_priority, 1), "pending",
             json.dumps(problem_ids), now_iso()),
        )
        for pid in problem_ids:
            conn.execute("UPDATE problems SET duplicate_cluster_id = ? WHERE id = ?", (cluster_id, pid))
        row = conn.execute("SELECT * FROM clusters WHERE id = ?", (cluster_id,)).fetchone()
        return {"cluster": serialize_cluster(row, conn)}


@app.put("/api/clusters/{cluster_id}")
def update_cluster(cluster_id: str, updates: Dict[str, Any] = Body(...)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM clusters WHERE id = ?", (cluster_id,)).fetchone()
        if not existing:
            raise HTTPException(404, "Cluster not found")
        allowed = {"name", "status", "assigned_institution_id", "project_id", "priority_score"}
        fields, values = [], []
        for key, value in updates.items():
            if key in allowed:
                fields.append(f"{key} = ?")
                values.append(value)
        if fields:
            values.append(cluster_id)
            conn.execute(f"UPDATE clusters SET {', '.join(fields)} WHERE id = ?", values)
        row = conn.execute("SELECT * FROM clusters WHERE id = ?", (cluster_id,)).fetchone()
        return {"cluster": serialize_cluster(row, conn)}


# --------------------------------------------------------------------------
# Routes: projects & milestones
# --------------------------------------------------------------------------

@app.get("/api/projects")
def list_projects(status: Optional[str] = None, institution_id: Optional[str] = None):
    with get_db() as conn:
        query, params = "SELECT * FROM projects WHERE 1=1", []
        if status and status != "all":
            query += " AND status = ?"
            params.append(status)
        if institution_id:
            query += " AND institution_id = ?"
            params.append(institution_id)
        query += " ORDER BY created_at DESC"
        rows = conn.execute(query, params).fetchall()
        return [serialize_project(r, conn) for r in rows]


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Project not found")
        return serialize_project(row, conn)


@app.post("/api/projects")
def create_project(payload: Dict[str, Any] = Body(...)):
    with get_db() as conn:
        project_id = new_id("proj")
        ts = now_iso()
        conn.execute(
            """INSERT INTO projects (id,title,description,problem_id,problem_cluster_id,institution_id,
               status,progress,start_date,expected_completion,created_at,updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (project_id, payload.get("title", "Untitled Project"), payload.get("description", ""),
             payload.get("problem_id"), payload.get("problem_cluster_id"), payload.get("institution_id"),
             payload.get("status", "planning"), payload.get("progress", 0),
             payload.get("start_date", ts[:10]), payload.get("expected_completion", ts[:10]), ts, ts),
        )
        if payload.get("problem_id"):
            conn.execute("UPDATE problems SET project_id = ?, status = 'assigned' WHERE id = ?",
                         (project_id, payload["problem_id"]))
        conn.execute(
            """INSERT INTO impact_metrics (project_id,citizens_impacted,reports_resolved,area_covered_km2)
               VALUES (?,0,0,0)""",
            (project_id,),
        )
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        return {"project": serialize_project(row, conn)}


@app.put("/api/projects/{project_id}")
def update_project(project_id: str, updates: Dict[str, Any] = Body(...)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not existing:
            raise HTTPException(404, "Project not found")
        allowed = {"title", "description", "status", "progress", "expected_completion", "prototype_info"}
        fields, values = [], []
        for key, value in updates.items():
            if key in allowed:
                fields.append(f"{key} = ?")
                values.append(value)
        if fields:
            fields.append("updated_at = ?")
            values.append(now_iso())
            values.append(project_id)
            conn.execute(f"UPDATE projects SET {', '.join(fields)} WHERE id = ?", values)
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        return {"project": serialize_project(row, conn)}


@app.put("/api/milestones/{milestone_id}")
def update_milestone(milestone_id: str, updates: Dict[str, Any] = Body(...)):
    with get_db() as conn:
        existing = conn.execute("SELECT * FROM milestones WHERE id = ?", (milestone_id,)).fetchone()
        if not existing:
            raise HTTPException(404, "Milestone not found")
        status = updates.get("status", existing["status"])
        completed_at = now_iso()[:10] if status == "completed" else existing["completed_at"]
        conn.execute(
            "UPDATE milestones SET status = ?, title = COALESCE(?, title), description = COALESCE(?, description), completed_at = ? WHERE id = ?",
            (status, updates.get("title"), updates.get("description"), completed_at, milestone_id),
        )
        row = conn.execute("SELECT * FROM milestones WHERE id = ?", (milestone_id,)).fetchone()
        return row_to_dict(row)


# --------------------------------------------------------------------------
# Routes: analytics
# --------------------------------------------------------------------------

@app.get("/api/analytics/overview")
def analytics_overview():
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) c FROM problems").fetchone()["c"]
        pending = conn.execute("SELECT COUNT(*) c FROM problems WHERE status IN ('pending','under_review')").fetchone()["c"]
        critical = conn.execute("SELECT COUNT(*) c FROM problems WHERE urgency = 'critical'").fetchone()["c"]
        active_projects = conn.execute("SELECT COUNT(*) c FROM projects WHERE status NOT IN ('completed')").fetchone()["c"]
        resolved = conn.execute("SELECT COUNT(*) c FROM problems WHERE status = 'resolved'").fetchone()["c"]
        citizens = conn.execute("SELECT COALESCE(SUM(citizens_impacted),0) s FROM impact_metrics").fetchone()["s"]
        clusters = conn.execute("SELECT COUNT(*) c FROM clusters").fetchone()["c"]
        institutions = conn.execute("SELECT COUNT(*) c FROM institutions").fetchone()["c"]
        resolution_rate = round((resolved / total) * 100, 1) if total else 0
        return {
            "total_problems": total, "pending_review": pending, "critical_issues": critical,
            "active_projects": active_projects, "resolved_problems": resolved,
            "estimated_citizens_impacted": citizens, "total_clusters": clusters,
            "total_institutions": institutions, "resolution_rate_percentage": resolution_rate,
            "avg_resolution_days": 21.5,
        }


@app.get("/api/analytics/categories")
def analytics_categories():
    with get_db() as conn:
        rows = conn.execute(
            """SELECT c.name as name, COUNT(p.id) as count FROM categories c
               LEFT JOIN problems p ON p.category_id = c.id GROUP BY c.id ORDER BY count DESC"""
        ).fetchall()
        return [dict(r) for r in rows]


@app.get("/api/analytics/priority")
def analytics_priority():
    with get_db() as conn:
        buckets = [("0-25", 0, 25, "#22c55e"), ("26-50", 26, 50, "#eab308"),
                   ("51-75", 51, 75, "#f97316"), ("76-100", 76, 100, "#ef4444")]
        result = []
        for label, lo, hi, color in buckets:
            count = conn.execute(
                "SELECT COUNT(*) c FROM problems WHERE priority_score BETWEEN ? AND ?", (lo, hi)
            ).fetchone()["c"]
            result.append({"range": label, "count": count, "fill": color})
        return result


@app.get("/api/analytics/trends")
def analytics_trends():
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) c FROM problems").fetchone()["c"]
        today = datetime.utcnow()
        trends = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            trends.append({
                "date": day.strftime("%b %d"),
                "reports": max(0, round(total / 7) + random.randint(-1, 2)),
                "resolved": max(0, round(total / 14) + random.randint(-1, 1)),
            })
        return trends


@app.get("/api/analytics/impact")
def analytics_impact():
    with get_db() as conn:
        row = conn.execute(
            """SELECT COALESCE(SUM(citizens_impacted),0) citizens, COALESCE(SUM(reports_resolved),0) resolved,
               COALESCE(SUM(area_covered_km2),0) area, COALESCE(SUM(cost_saved_inr),0) cost_saved
               FROM impact_metrics"""
        ).fetchone()
        return dict(row)


# --------------------------------------------------------------------------
# Routes: notifications
# --------------------------------------------------------------------------

@app.get("/api/notifications")
def list_notifications(authorization: Optional[str] = Header(None)):
    with get_db() as conn:
        user = get_current_user(authorization, conn)
        user_id = user["id"] if user else "usr-citizen-1"
        rows = conn.execute(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (user_id,)
        ).fetchall()
        return [{**row_to_dict(r), "is_read": bool(r["is_read"])} for r in rows]


@app.put("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    with get_db() as conn:
        conn.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
        return {"success": True}


@app.put("/api/notifications/read-all")
def mark_all_notifications_read(authorization: Optional[str] = Header(None)):
    with get_db() as conn:
        user = get_current_user(authorization, conn)
        user_id = user["id"] if user else "usr-citizen-1"
        conn.execute("UPDATE notifications SET is_read = 1 WHERE user_id = ?", (user_id,))
        return {"success": True}


# --------------------------------------------------------------------------
# Routes: seed reset (used by the "Reset Demo Data" button in the footer)
# --------------------------------------------------------------------------

@app.post("/api/seed/reset")
def reset_seed():
    with get_db() as conn:
        seed_database(conn)
    return {"success": True, "message": "Demo database reset to its original seed data."}


# --------------------------------------------------------------------------
# Startup
# --------------------------------------------------------------------------

@app.on_event("startup")
def on_startup():
    init_db()
    print("=======================================================")
    print(" Samaadhaan AI - FastAPI + SQLite demo backend ready")
    print(f" Database file: {DB_PATH}")
    print("=======================================================")
