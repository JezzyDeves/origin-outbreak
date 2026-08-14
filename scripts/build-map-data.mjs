import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import shapefile from "shapefile";
const FIPS = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
  "09": "CT", "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI",
  "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
  "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
  "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY",
};

const projection = geoAlbersUsa().scale(1070).translate([487.5, 305]);
const path = geoPath(projection);
const WIDTH = 975;
const HEIGHT = 610;

function project(lng, lat) {
  const p = projection([lng, lat]);
  if (!p || Number.isNaN(p[0]) || Number.isNaN(p[1])) return null;
  return [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
}

function simplifyLine(pts, min = 6) {
  if (pts.length <= min) return pts;
  const out = [pts[0]];
  let last = pts[0];
  const eps = 1.6;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i][0] - last[0], pts[i][1] - last[1]);
    if (d >= eps) {
      out.push(pts[i]);
      last = pts[i];
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

async function buildStates() {
  const topo = JSON.parse(readFileSync("/tmp/mapdata/states-albers.json", "utf8"));
  const fc = feature(topo, topo.objects.states);
  const identityPath = geoPath();
  const states = [];
  for (const f of fc.features) {
    const id = FIPS[String(f.id).padStart(2, "0")];
    if (!id) continue;
    const d = identityPath(f);
    if (!d) continue;
    states.push({ id, name: f.properties.name, d });
  }
  return states;
}

function loadZips() {
  const map = new Map();
  for (const line of readFileSync("/tmp/mapdata/US.txt", "utf8").split("\n")) {
    if (!line) continue;
    const p = line.split("\t");
    const zip = (p[1] || "").padStart(5, "0");
    const lat = Number(p[9]);
    const lng = Number(p[10]);
    if (zip && Number.isFinite(lat) && Number.isFinite(lng)) map.set(zip, [lng, lat]);
  }
  return map;
}

function estimateBeds(type, rating) {
  const r = Number(rating);
  const stars = Number.isFinite(r) ? r : 3;
  const t = (type || "").toLowerCase();
  if (t.includes("critical access")) return 18 + stars * 2;
  if (t.includes("children")) return 160 + stars * 30;
  if (t.includes("va")) return 140 + stars * 20;
  if (t.includes("psychiatric") || t.includes("psych")) return 50 + stars * 10;
  if (t.includes("acute")) return 90 + stars * 45;
  return 40 + stars * 12;
}

function parseCsv(text) {
  const lines = [];
  let row = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur.replace(/\r$/, ""));
      lines.push(row);
      row = [];
      cur = "";
    } else cur += c;
  }
  if (cur || row.length) {
    row.push(cur.replace(/\r$/, ""));
    lines.push(row);
  }
  return lines;
}

function buildHospitals() {
  const zips = loadZips();
  const rows = parseCsv(readFileSync("/tmp/mapdata/cms_hospitals.csv", "utf8"));
  const header = rows[0].map((h) => h.replace(/^\uFEFF/, ""));
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const hospitals = [];
  const byState = {};
  for (const r of rows.slice(1)) {
    if (!r[idx["Facility ID"]]) continue;
    const state = r[idx["State"]];
    if (!FIPS || !state || state.length !== 2) continue;
    const zip = String(r[idx["ZIP Code"]] || "").padStart(5, "0").slice(0, 5);
    const ll = zips.get(zip);
    if (!ll) continue;
    const xy = project(ll[0], ll[1]);
    if (!xy) continue;
    const type = r[idx["Hospital Type"]] || "";
    const rating = r[idx["Hospital overall rating"]] || "";
    const beds = estimateBeds(type, rating);
    const rec = {
      id: r[idx["Facility ID"]],
      n: r[idx["Facility Name"]],
      c: r[idx["City/Town"]],
      s: state,
      t: type.replace(" Hospitals", "").replace("Hospital", "").trim(),
      o: (r[idx["Hospital Ownership"]] || "").split(" - ")[0],
      e: r[idx["Emergency Services"]] === "Yes",
      r: /^\d$/.test(rating) ? Number(rating) : null,
      b: beds,
      x: xy[0],
      y: xy[1],
    };
    hospitals.push(rec);
    byState[state] = (byState[state] || 0) + beds;
  }

  // Flagship set for national markers
  const ranked = [...hospitals].sort((a, b) => {
    const sa = (a.e ? 2 : 0) + (a.r ?? 0) + a.b / 120;
    const sb = (b.e ? 2 : 0) + (b.r ?? 0) + b.b / 120;
    return sb - sa;
  });
  const seen = new Set();
  const major = [];
  for (const h of ranked) {
    if (major.length >= 220) break;
    if ((h.r ?? 0) >= 3 || h.t.includes("Children") || h.b >= 200) {
      major.push(h.id);
      seen.add(h.id);
    }
  }
  for (const st of Object.keys(FIPS).map((k) => FIPS[k])) {
    const local = ranked.filter((h) => h.s === st);
    if (!local.some((h) => seen.has(h.id)) && local[0]) {
      major.push(local[0].id);
    }
  }

  return { hospitals, major: [...new Set(major)], bedsByState: byState };
}

async function buildAirports() {
  // FAA sheet via unzip + xml
  const { execFileSync } = await import("node:child_process");
  const text = execFileSync("python3", ["-c", `
import zipfile
from xml.etree import ElementTree as ET
z = zipfile.ZipFile("/tmp/mapdata/faa2025.xlsx")
ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
ss = ET.fromstring(z.read("xl/sharedStrings.xml"))
strings = []
for si in ss.findall("m:si", ns):
    texts = [t.text or "" for t in si.findall(".//m:t", ns)]
    strings.append("".join(texts))
sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
for row in sheet.findall("m:sheetData/m:row", ns):
    vals = []
    for c in row.findall("m:c", ns):
        t = c.get("t")
        v = c.find("m:v", ns)
        if v is None:
            vals.append("")
            continue
        vals.append(strings[int(v.text)] if t == "s" else v.text)
    print("\\t".join(vals[:11]))
`]).toString();
  const faa = [];
  for (const line of text.split("\n")) {
    const p = line.split("\t");
    if (!/^\d+$/.test(p[0] || "")) continue;
    faa.push({
      rank: Number(p[0]),
      state: p[2],
      code: p[3],
      city: p[4],
      name: p[5],
      hub: p[7],
      pax25: Number(p[8]) || 0,
      pax24: Number(p[9]) || 0,
    });
  }

  const airCsv = readFileSync("/tmp/mapdata/airports.csv", "utf8");
  const byIata = new Map();
  for (const line of airCsv.split("\n").slice(1)) {
    // naive CSV for ourairports - quoted fields
    const rec = parseCsvLine(line);
    if (!rec) continue;
    const iata = rec[13];
    const iso = rec[8];
    if (iso === "US" && iata && iata.length === 3) {
      byIata.set(iata, {
        lat: Number(rec[4]),
        lng: Number(rec[5]),
        type: rec[2],
        name: rec[3],
      });
    }
  }

  const airports = [];
  for (const a of faa) {
    if (a.pax25 < 400000) continue;
    const geo = byIata.get(a.code);
    if (!geo || !Number.isFinite(geo.lat)) continue;
    const xy = project(geo.lng, geo.lat);
    if (!xy) continue;
    airports.push({
      id: a.code,
      n: a.name,
      c: a.city,
      s: a.state,
      hub: a.hub,
      pax: a.pax25,
      pax24: a.pax24,
      x: xy[0],
      y: xy[1],
      lat: Math.round(geo.lat * 1000) / 1000,
      lng: Math.round(geo.lng * 1000) / 1000,
    });
  }
  airports.sort((a, b) => b.pax - a.pax);
  return airports.slice(0, 70);
}

function parseCsvLine(line) {
  const row = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else cur += c;
  }
  row.push(cur);
  return row.length > 14 ? row : null;
}

function buildRoutes(airports) {
  const routes = [];
  const n = Math.min(airports.length, 36);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = airports[i];
      const b = airports[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      const w = (a.pax * b.pax) / (d * d);
      routes.push({ a: a.id, b: b.id, w });
    }
  }
  routes.sort((x, y) => y.w - x.w);
  const top = routes.slice(0, 90);
  const max = top[0]?.w || 1;
  return top.map((r) => ({
    a: r.a,
    b: r.b,
    w: Math.round((r.w / max) * 1000) / 1000,
  }));
}

async function buildHighways() {
  const source = await shapefile.open("/tmp/mapdata/ne_roads/ne_10m_roads.shp");
  const lines = [];
  while (true) {
    const r = await source.read();
    if (r.done) break;
    const p = r.value.properties;
    if (p.sov_a3 !== "USA") continue;
    const type = p.type || "";
    const level = p.level || "";
    const keep =
      type === "Major Highway" ||
      (type === "Beltway" && (p.scalerank ?? 9) <= 4) ||
      (p.expressway === 1 && (p.scalerank ?? 9) <= 4);
    if (!keep) continue;
    if ((p.scalerank ?? 9) > 5) continue;
    const geom = r.value.geometry;
    const rings =
      geom.type === "LineString"
        ? [geom.coordinates]
        : geom.type === "MultiLineString"
          ? geom.coordinates
          : [];
    for (const ring of rings) {
      const pts = [];
      for (const [lng, lat] of ring) {
        const xy = project(lng, lat);
        if (xy) pts.push(xy);
      }
      const simp = simplifyLine(pts);
      if (simp.length >= 2) {
        lines.push({
          n: String(p.name || p.label || ""),
          t: type === "Beltway" ? "belt" : "hwy",
          pts: simp,
        });
      }
    }
  }
  return lines;
}

const outDir = "/workspace/src/data";
mkdirSync(outDir, { recursive: true });

const states = await buildStates();
const { hospitals, major, bedsByState } = buildHospitals();
const airports = await buildAirports();
const routes = buildRoutes(airports);
const highways = await buildHighways();

writeFileSync(`${outDir}/geo-states.json`, JSON.stringify({ w: WIDTH, h: HEIGHT, states }));
writeFileSync(`${outDir}/hospitals.json`, JSON.stringify({ src: "CMS Hospital General Information, Jul 2026", major, hospitals }));
writeFileSync(`${outDir}/airports.json`, JSON.stringify({ src: "FAA CY2025 commercial enplanements (prelim.)", airports }));
writeFileSync(`${outDir}/air-routes.json`, JSON.stringify(routes));
writeFileSync(`${outDir}/highways.json`, JSON.stringify({ src: "Natural Earth 10m roads", highways }));
writeFileSync(`${outDir}/beds-by-state.json`, JSON.stringify(bedsByState));

console.log({
  states: states.length,
  hospitals: hospitals.length,
  major: major.length,
  airports: airports.length,
  routes: routes.length,
  highways: highways.length,
  sizes: {
    states: states.reduce((s, x) => s + x.d.length, 0),
    hw: JSON.stringify(highways).length,
    hosp: JSON.stringify(hospitals).length,
  },
});
