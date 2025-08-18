const WebSocket = require("ws");
const fetch = require("node-fetch");

const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });

let clients = new Set();

// Função para buscar tabela do Brasileirão (TheSportsDB)
async function getTabela() {
  try {
    const res = await fetch("https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=4328&s=2024-2025");
    const data = await res.json();
    return data.table || [];
  } catch (err) {
    console.error("Erro ao buscar tabela:", err);
    return [];
  }
}

// Enviar tabela para todos conectados
async function broadcast() {
  const tabela = await getTabela();
  const payload = JSON.stringify({ tabela });

  for (let client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("Novo cliente conectado (tabela). Total:", clients.size);

  // Envia tabela ao conectar
  broadcast();

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Cliente saiu (tabela). Total:", clients.size);
  });
});

// Atualiza tabela a cada 60 segundos
setInterval(broadcast, 60000);

console.log("Servidor de tabela rodando na porta " + PORT);
