// js/chat.js

document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const typingIndicator = document.getElementById("typing-indicator");

  const playersListEl = document.getElementById("players-list");
  const playersCountEl = document.getElementById("players-count");
  const loreLogEl = document.getElementById("lore-log");

  const editOverlay = document.getElementById("edit-modal-overlay");
  const editTextArea = document.getElementById("editText");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");

  const userNameEl = document.getElementById("chat-user-name");
  const userTagEl = document.getElementById("chat-user-tag");
  const userAvatarEl = document.getElementById("chat-user-avatar");

  // 1) Cargar jugador desde localStorage (creado en el pasaporte)
  const playerRaw = localStorage.getItem("dwjc2_player");
  if (!playerRaw) {
    window.location.href = "index.html";
    return;
  }
  const player = JSON.parse(playerRaw);

  // 2) Header: nombre, ID y avatar
  userNameEl.textContent = player.name || "Viajero sin nombre";
  userTagEl.textContent = "ID: " + makeSerialFromName(player.name || "");

  if (player.avatarDataUrl) {
    userAvatarEl.style.backgroundImage = `url(${player.avatarDataUrl})`;
    userAvatarEl.style.backgroundSize = "cover";
    userAvatarEl.style.backgroundPosition = "center";
  } else {
    userAvatarEl.textContent = (player.name || "V").charAt(0).toUpperCase();
  }

  function makeSerialFromName(name) {
    let sum = 0;
    for (const ch of name) {
      sum += ch.charCodeAt(0);
    }
    const num = (sum % 9999).toString().padStart(4, "0");
    return `DW-${num}`;
  }

  // 3) Party de jugadores (fake + tú)
  const npcPlayers = [
    { name: "GM Cristal", role: "Narrador de la Luna", avatarType: "gm" },
    { name: "Luna Negra", role: "Viajera oscura", avatarType: "luna" },
    { name: "Viajero 404", role: "Glitch interdimensional", avatarType: "404" },
  ];
  const allPlayers = [
    { name: player.name, role: "Tú", isMe: true, avatarType: "me" },
    ...npcPlayers,
  ];

  function renderPlayers() {
    playersListEl.innerHTML = "";
    allPlayers.forEach((p) => {
      const li = document.createElement("li");
      li.className = "player-item";
      if (p.isMe) li.classList.add("me");

      const dot = document.createElement("span");
      dot.className = "player-dot";

      const info = document.createElement("div");
      info.className = "player-info";

      const nameEl = document.createElement("div");
      nameEl.className = "player-name";
      nameEl.textContent = p.name;

      const roleEl = document.createElement("div");
      roleEl.className = "player-role";
      roleEl.textContent = p.role;

      info.appendChild(nameEl);
      info.appendChild(roleEl);

      li.appendChild(dot);
      li.appendChild(info);

      playersListEl.appendChild(li);
    });
    playersCountEl.textContent = allPlayers.length.toString();
  }
  renderPlayers();

  // 4) Registro del mundo (lore)
  function addLore(text) {
    if (!loreLogEl) return;
    const p = document.createElement("p");
    p.textContent = text;
    loreLogEl.appendChild(p);
    loreLogEl.scrollTop = loreLogEl.scrollHeight;
  }

  addLore("Tu pasaporte ha sido sellado. Accedes a la Sala de Rol de la Luna de Cristal.");
  addLore("Consejo: usa la historia de tu personaje para dar sabor a tus mensajes.");
  if (player.history) {
    addLore(
      `Origen registrado: ${
        player.history.length > 140
          ? player.history.substring(0, 140) + "..."
          : player.history
      }`
    );
  }

  // 5) Mensajes
  let messages = [];
  let messageIdCounter = 1;
  let currentEditId = null;

  function createAvatarNode(author) {
    const avatar = document.createElement("div");
    avatar.classList.add("chat-avatar");

    if (author === player.name) {
      avatar.classList.add("me");
      if (player.avatarDataUrl) {
        const img = document.createElement("img");
        img.src = player.avatarDataUrl;
        img.alt = "Tú";
        avatar.appendChild(img);
      } else {
        avatar.textContent = (player.name || "V").charAt(0).toUpperCase();
      }
      return avatar;
    }

    if (author === "GM Cristal") {
      avatar.classList.add("npc-gm");
      avatar.textContent = "GM";
    } else if (author === "Luna Negra") {
      avatar.classList.add("npc-luna");
      avatar.textContent = "LN";
    } else if (author === "Viajero 404") {
      avatar.textContent = "404";
    } else {
      avatar.textContent = author.charAt(0).toUpperCase();
    }
    return avatar;
  }

  function renderMessages() {
    chatBox.innerHTML = "";
    messages.forEach((msg) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("chat-message");
      if (msg.author === player.name) {
        wrapper.classList.add("mine");
      }

      const inner = document.createElement("div");
      inner.classList.add("chat-message-inner");

      const avatar = createAvatarNode(msg.author);

      const bubble = document.createElement("div");
      bubble.classList.add("chat-bubble");

      const metaLine = document.createElement("div");
      metaLine.classList.add("chat-meta-line");

      const authorEl = document.createElement("span");
      authorEl.classList.add("chat-author");
      authorEl.textContent = msg.author;

      const timeEl = document.createElement("span");
      timeEl.classList.add("chat-time");
      timeEl.textContent = msg.time;

      metaLine.appendChild(authorEl);
      metaLine.appendChild(timeEl);

      const textEl = document.createElement("div");
      textEl.classList.add("chat-text");
      textEl.textContent = msg.text;

      bubble.appendChild(metaLine);
      bubble.appendChild(textEl);

      if (msg.edited) {
        const editedTag = document.createElement("div");
        editedTag.classList.add("chat-edited-tag");
        editedTag.textContent = "Editado";
        bubble.appendChild(editedTag);
      }

      inner.appendChild(avatar);
      inner.appendChild(bubble);
      wrapper.appendChild(inner);

      // Botón editar solo en mis mensajes
      if (msg.author === player.name) {
        const editBtn = document.createElement("button");
        editBtn.className = "chat-edit-btn";
        editBtn.textContent = "Editar mensaje";
        editBtn.addEventListener("click", () => {
          currentEditId = msg.id;
          editTextArea.value = msg.text;
          openEditModal();
        });
        wrapper.appendChild(editBtn);
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
      edited: false,
    });
    renderMessages();
  }

  // 6) Indicador "escribiendo" (para respuestas fake del GM)
  function showTyping() {
    if (!typingIndicator) return;
    typingIndicator.classList.remove("hidden");
  }
  function hideTyping() {
    if (!typingIndicator) return;
    typingIndicator.classList.add("hidden");
  }

  // 7) Enviar mensaje
  function handleSend() {
    const text = messageInput.value.trim();
    if (!text) return;
    addMessage(text, player.name);
    messageInput.value = "";
    messageInput.focus();

    // Respuesta de ambientación del GM
    showTyping();
    setTimeout(() => {
      hideTyping();
      addMessage("La Luna de Cristal escucha tus palabras...", "GM Cristal");
    }, 1200);
  }

  sendBtn.addEventListener("click", handleSend);
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // 8) Modal de edición (custom, sin Bootstrap)
  function openEditModal() {
    editOverlay.classList.add("open");
    editTextArea.focus();
  }

  function closeEditModal() {
    editOverlay.classList.remove("open");
    currentEditId = null;
  }

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
      msg.edited = true;
      renderMessages();
    }
    closeEditModal();
  });

  cancelEditBtn.addEventListener("click", () => {
    closeEditModal();
  });

  editOverlay.addEventListener("click", (e) => {
    if (e.target === editOverlay) {
      closeEditModal();
    }
  });

  // 9) Mensajes iniciales de ambientación
  addMessage(
    `Las puertas de la Sala de Rol se abren para ti, ${player.name}.`,
    "GM Cristal"
  );
  addMessage(
    "Recuerda: lo que digas aquí puede volverse canon en el Mundo de Cristal.",
    "Luna Negra"
  );
});
