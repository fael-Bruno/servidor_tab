import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;
const TOKEN = process.env.FOOTBALL_DATA_TOKEN || ""; // https://www.football-data.org/

let cache = { table: [], updatedAt: 0 };
const TTL = 1000 * 60 * 5; // 5 minutos

async function fetchStandings() {
  if (!TOKEN) {
    // Retorna erro explícito se não tiver token
    throw new Error("Token FOOTBALL_DATA_TOKEN não configurado");
  }

  const res = await fetch("https://api.football-data.org/v4/competitions/BSA/standings", {
    headers: { "X-Auth-Token": TOKEN },
  });

  if (!res.ok) {
    throw new Error("Erro na API football-data.org: " + res.status);
  }

  const j = await res.json();
  const table = (j.standings?.[0]?.table || []).map(r => ({
    position: r.position,
    team: r.team.name,
    points: r.points
  }));
  return table;
}

app.get("/api/standings", async (req, res) => {
  try {
    const now = Date.now();
    if (now - cache.updatedAt > TTL || cache.table.length === 0) {
      cache.table = await fetchStandings();
      cache.updatedAt = now;
    }
    res.json({ table: cache.table, updatedAt: cache.updatedAt });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get("/", (req, res) => res.send("Tabela-server OK"));

app.listen(PORT, () => console.log("📊 Tabela-server na porta " + PORT));
