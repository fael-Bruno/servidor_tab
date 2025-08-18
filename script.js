// === Função do Player ===
const reprodutores = {
  1: "//%72%65%64%65%63%61%6E%61%69%73%74%76%2E%67%64/player3/ch.php?canal=sportv1",
  2: "//%72%65%64%65%63%61%6E%61%69%73%74%76%2E%67%64/player3/ch.php?canal=premiereclubes",
  3: ""
};

function trocarPlayer(opcao) {
  const player = document.getElementById("video-player");
  if (player && reprodutores[opcao]) {
    player.src = reprodutores[opcao];
  }
}

// === Placar (Cruzeiro) via TheSportsDB ===
const TSD_BASE = "https://www.thesportsdb.com/api/v1/json/123";

async function getCruzeiroTeamId() {
  const res = await fetch(`${TSD_BASE}/searchteams.php?t=${encodeURIComponent("Cruzeiro")}`);
  const data = await res.json();
  const teams = data?.teams || [];
  const chosen = teams.find(
    t =>
      (t.strCountry === "Brazil" || /Brazil/i.test(t.strLeague || "")) &&
      t.strSport === "Soccer" &&
      (/cruzeiro/i.test(t.strTeam) || /cruzeiro/i.test(t.strAlternate || ""))
  ) || teams[0];
  return chosen ? chosen.idTeam : null;
}

async function getNextEvent(teamId) {
  const res = await fetch(`${TSD_BASE}/eventsnext.php?id=${teamId}`);
  const data = await res.json();
  const events = data?.events || [];
  return events.find(e => /cruzeiro/i.test(e.strHomeTeam) || /cruzeiro/i.test(e.strAwayTeam)) || null;
}

function formatarDataHora(ev) {
  const ts = ev.strTimestamp || (ev.dateEvent && ev.strTime ? `${ev.dateEvent} ${ev.strTime}` : null);
  let d;
  if (ts) {
    const iso = ts.replace(" ", "T");
    d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  } else {
    d = new Date();
  }
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

async function atualizarPlacarOuProximo() {
  const el = document.getElementById("live-score");
  if (!el) return;
  el.innerHTML = "<p>⏳ Carregando...</p>";

  try {
    const teamId = await getCruzeiroTeamId();
    if (!teamId) {
      el.innerHTML = "<p>⚠️ Não foi possível identificar o time Cruzeiro.</p>";
      return;
    }

    const proximo = await getNextEvent(teamId);
    if (proximo) {
      const quando = formatarDataHora(proximo);
      el.innerHTML = `
        <p>📅 Próximo jogo do Cruzeiro:<br>
        <strong>${proximo.strHomeTeam} x ${proximo.strAwayTeam}</strong><br>
        ${quando}</p>`;
    } else {
      el.innerHTML = "<p>⚠️ Não encontramos partidas futuras.</p>";
    }
  } catch (e) {
    console.error(e);
    el.innerHTML = "<p>⚠️ Erro ao carregar dados do placar.</p>";
  }
}

atualizarPlacarOuProximo();
setInterval(atualizarPlacarOuProximo, 60000);

// === Chat em tempo real (Render) ===
const onlineCountEl = document.getElementById("online-count");
const chatMessages = document.querySelector("#chat-box .chat-messages");
const chatInput = document.getElementById("chat-input");

// Conecta ao servidor WebSocket do Render
const ws = new WebSocket("wss://servidor-jizn.onrender.com");

// Atualiza contagem de usuários online
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.online !== undefined) {
    onlineCountEl.textContent = data.online;
  }
};

// Enviar mensagem no chat (local)
chatInput.addEventListener("keypress", e => {
  if (e.key === "Enter" && chatInput.value.trim() !== "") {
    const msg = document.createElement("p");
    msg.textContent = "Você: " + chatInput.value;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.value = "";
  }
});
// === Tabela Brasileirão em tempo real (Render) ===
const wsTabela = new WebSocket("wss://SEU-SERVIDOR-TABELA.onrender.com");

wsTabela.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.tabela) {
    const tbody = document.querySelector("#tabela-serie-a tbody");
    tbody.innerHTML = "";
    data.tabela.forEach((time, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${time.strTeam}</td>
        <td>${time.intPoints}</td>
      `;
      tbody.appendChild(row);
    });
  }
};
