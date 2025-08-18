const WebSocket = require("ws");
const fetch = require("node-fetch");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

let clients = new Set();

// === Buscar tabela do Brasileirão Série A 2025 ===
async function getTabela() {
  try {
    // ID do Brasileirão Série A = 4429
    const res = await fetch("https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=4429&s=2025");
    const data = await res.json();
    return data.table || [];
  } catch (err) {
    console.error("Erro ao buscar tabela:", err);
    return [];
  }
}

// === Enviar dados (chat + tabela) ===
async function broadcast() {
  const online = clients.size;
  const tabela = await getTabela();
  const payload = JSON.stringify({ online, tabela });

  for (let client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("Novo cliente conectado. Total:", clients.size);

  broadcast(); // envia dados iniciais

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Cliente saiu. Total:", clients.size);
    broadcast();
  });
});

// Atualiza a cada 60s
setInterval(broadcast, 60000);

console.log("Servidor rodando (chat + tabela Brasileirão 2025) na porta " + PORT);
