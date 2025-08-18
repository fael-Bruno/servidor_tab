// === Chat + Tabela em tempo real (Render) ===
const onlineCountEl = document.getElementById("online-count");
const chatMessages = document.querySelector("#chat-box .chat-messages");
const chatInput = document.getElementById("chat-input");

// Conecta no mesmo servidor Render
const ws = new WebSocket("wss://SEU-SERVIDOR.onrender.com"); // substitua pela URL do Render

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // Atualizar contador online
  if (data.online !== undefined) {
    onlineCountEl.textContent = data.online;
  }

  // Atualizar tabela
  if (data.tabela) {
    const tbody = document.querySelector("#tabela-serie-a tbody");
    tbody.innerHTML = "";
    data.tabela.forEach((time, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${time.strTeam}</td>
        <td>${time.intPlayed}</td>
        <td>${time.intWin}</td>
        <td>${time.intDraw}</td>
        <td>${time.intLoss}</td>
        <td>${time.intGoalsFor}</td>
        <td>${time.intGoalsAgainst}</td>
        <td>${time.intGoalDifference}</td>
        <td>${time.intPoints}</td>
      `;
      tbody.appendChild(row);
    });
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
