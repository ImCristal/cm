// js/chat.js

document.addEventListener("DOMContentLoaded", () => {
  const userLabel = document.getElementById("user-label");
  const chatBox = document.getElementById("chat-box");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");

  const playersListEl = document.getElementById("players-list");
  const playersCountEl = document.getElementById("players-count");

  const editModalElement = document.getElementById("editModal");
  const editTextArea = document.getElementById("editText");
  const saveEditBtn = document.getElementById("saveEditBtn");

  let editModal = null;
  if (editModalElement && typeof bootstrap !== "undefined") {
    editModal = new bootstrap.Modal(editModalElement);
  }

  // 1) Cargar jugador desde localStorage
  const playerRaw = localStorage.getItem("dwjc2_player");
  if (!playerRaw) {
    // Si no hay jugador, regresar al login
    window.location.href = "index.html";
    return;
  }

  const player = JSON.parse(playerRaw);
  userLabel.textContent = `Jugador: ${player.name}`;

  // 2) Jugadores fake + tú
  const npcPlayers = [
    { name: "GM Cristal", role: "Narrador de la Luna" },
    { name: "Luna Negra", role: "Viajera oscura" },
    { name: "Viajero 404", role: "Buscando servidor..." },
  ];

  // Insertamos al jugador actual
  const allPlayers = [
    { name: player.name, role: "Tú", isMe: true },
    ...npcPlayers,
  ];

  function renderPlayers() {
    playersListEl.innerHTML = "";
    allPlayers.forEach((p) => {
      const li = document.createElement("li");
      li.className = "list-group-item player-item";
      if (p.isMe) {
        li.classList.add("me");
      }

      const dot = document.createElement("span");
      dot.className = "player-status-dot";

      const info = document.createElement("div");
      const nameSpan = document.createElement("div");
      nameSpan.className = "player-name";
      nameSpan.textContent = p.name;

      const roleSpan = document.createElement("div");
      roleSpan.className = "player-role";
      roleSpan.textContent = p.role;

      info.appendChild(nameSpan);
      info.appendChild(roleSpan);

      li.appendChild(dot);
      li.appendChild(info);

      playersListEl.appendChild(li);
    });

    playersCountEl.textContent = allPlayers.length.toString();
  }

  renderPlayers();

  // 3) Lógica básica de mensajes
  let messages = [];
  let messageIdCounter = 1;
  let currentEditId = null;

  function renderMessages() {
    chatBox.innerHTML = "";

    messages.forEach((msg) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("chat-message");
      if (msg.author === player.name) {
        wrapper.classList.add("mine");
      }

      const meta = document.createElement("div");
      meta.classList.add("chat-meta");
      meta.textContent = `${msg.author} — ${msg.time}`;

      const text = document.createElement("div");
      text.classList.add("chat-text");
      text.textContent = msg.text;

      wrapper.appendChild(meta);
      wrapper.appendChild(text);

      // Botón de editar solo para mis mensajes
      if (msg.author === player.name) {
        const btnEdit = document.createElement("button");
        btnEdit.className = "btn btn-sm btn-outline-light mt-1";
        btnEdit.textContent = "Editar";
        btnEdit.addEventListener("click", () => {
          currentEditId = msg.id;
          editTextArea.value = msg.text;
          editModal.show();
        });
        wrapper.appendChild(btnEdit);
      }

      chatBox.appendChild(wrapper);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function addMessage(text, author) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    messages.push({
      id: messageIdCounter++,
      author,
      text,
      time: timeString,
    });

    renderMessages();
  }

  // 4) Enviar mensaje
  sendBtn.addEventListener("click", () => {
    const text = messageInput.value.trim();
    if (!text) return;
    addMessage(text, player.name);
    messageInput.value = "";
    messageInput.focus();
  });

  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // 5) Guardar edición
  saveEditBtn.addEventListener("click", () => {
    if (currentEditId == null) return;

    const newText = editTextArea.value.trim();
    if (!newText) {
      alert("El mensaje no puede estar vacío.");
      return;
    }

    const msg = messages.find((m) => m.id === currentEditId);
    if (msg) {
      msg.text = newText;
      renderMessages();
    }

    editModal.hide();
    currentEditId = null;
  });

  // 6) Mensajes de bienvenida / ambientación inicial
  addMessage(
    `Las puertas del mundo de Cristal se abren para ti, ${player.name}.`,
    "GM Cristal"
  );

  addMessage(
    "De momento, esta sala solo existe en tu navegador. Pronto la conectaremos en tiempo real y con IA.",
    "Viajero 404"
  );
});
