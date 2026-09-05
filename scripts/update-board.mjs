// Pulls the newest weekly board JSON from dropsynth-ops into src/board.json.
// Run: node scripts/update-board.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OPS_DIR = process.env.OPS_DIR || "H:\\dropsynth-ops";
const ROOT = path.dirname(fileURLToPath(import.meta.url)); // scripts/
const OUT = path.join(ROOT, "..", "src", "board.json");

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const boardsDir = path.join(OPS_DIR, "boards");
const file = fs.readdirSync(boardsDir)
  .filter(f => /^board-.*\.json$/.test(f))
  .sort()
  .pop();
if (!file) throw new Error(`No board-*.json found in ${boardsDir}`);

const { week, products } = JSON.parse(fs.readFileSync(path.join(boardsDir, file), "utf8"));
const byRank = products.slice().sort((a, b) => a.rank - b.rank);
const rank1 = byRank.find(p => p.rank === 1);

const board = {
  week,
  top: {
    rank: 1,
    name: rank1.name,
    score: rank1.total,
    signals: rank1.signals.join(" · "),
    margin: `MARGIN ${rank1.margin}/5 · COMPETITION ${rank1.competition}/5`,
    risk: rank1.risk,
    angle: rank1.angle,
  },
  rows: byRank.filter(p => p.rank >= 2 && p.rank <= 10).map(p => ({
    rank: p.rank, name: p.name, niche: p.niche, score: p.total, angle: p.angle,
  })),
  termRows: [
    { rank: 1, label: rank1.name.toLowerCase().slice(0, 26), score: rank1.total, open: true },
    ...byRank.filter(p => p.rank >= 2 && p.rank <= 5).map(p => ({
      rank: p.rank, label: "█".repeat(clamp(p.name.length - 4, 12, 22)), score: p.total,
    })),
  ],
  niches: [...new Set(byRank.map(p => p.niche.split("/")[0].trim().toUpperCase()))],
};

fs.writeFileSync(OUT, JSON.stringify(board, null, 2) + "\n");
console.log(`Wrote ${OUT} from ${file}`);
