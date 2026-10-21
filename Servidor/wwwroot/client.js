const clientId = window.location.pathname.endsWith("1") ? "cliente1" : "cliente2";
const otherClient = clientId === "cliente1" ? "cliente2" : "cliente1";
const messageList = document.querySelector("#message-list");
const emptyState = document.querySelector("#empty-state");
const connectionStatus = document.querySelector("#connection-status");
const sendStatus = document.querySelector("#send-status");
const messageInput = document.querySelector("#message-text");
const recipient = document.querySelector("#recipient");
const sendButton = document.querySelector("#send-button");

document.body.dataset.client = clientId;
document.querySelector("#page-title").textContent = `Cliente ${clientId.slice(-1)}`;
document.title = `Cliente ${clientId.slice(-1)} | Mensagens locais`;
recipient.value = otherClient;

function showMessage(message) {
  emptyState?.remove();

  const item = document.createElement("li");
  item.className = "message-item";

  const heading = document.createElement("div");
  heading.className = "message-heading";

  const sender = document.createElement("strong");
  sender.textContent = message.from;

  const time = document.createElement("time");
  time.dateTime = message.sentAt;
  time.textContent = new Date(message.sentAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const text = document.createElement("p");
  text.textContent = message.text;

  heading.append(sender, time);
  item.append(heading, text);
  messageList.append(item);
  item.scrollIntoView({ block: "nearest" });
}

async function pollInbox() {
  try {
    const response = await fetch(`/api/messages/${clientId}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Falha ao consultar mensagens.");

    const messages = await response.json();
    messages.forEach(showMessage);
    connectionStatus.textContent = "Conectado";
    connectionStatus.classList.add("is-connected");
  } catch {
    connectionStatus.textContent = "Reconectando...";
    connectionStatus.classList.remove("is-connected");
  }

  window.setTimeout(pollInbox, 800);
}

document.querySelector("#message-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  sendButton.disabled = true;
  sendStatus.textContent = "Enviando...";

  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: clientId, to: recipient.value, text })
    });

    if (!response.ok) throw new Error("Não foi possível enviar a mensagem.");

    messageInput.value = "";
    sendStatus.textContent = `Mensagem enviada para ${recipient.value}.`;
  } catch {
    sendStatus.textContent = "Falha no envio. Confira a conexão com o servidor.";
  } finally {
    sendButton.disabled = false;
    messageInput.focus();
  }
});

pollInbox();