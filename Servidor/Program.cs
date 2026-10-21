using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
var inboxes = new Dictionary<string, ConcurrentQueue<ChatMessage>>
{
	["cliente1"] = new(),
	["cliente2"] = new()
};
var clientPagePath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "client.html");

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/cliente1", () => Results.File(clientPagePath, "text/html"));
app.MapGet("/cliente2", () => Results.File(clientPagePath, "text/html"));

app.MapPost("/api/messages", (SendMessageRequest request) =>
{
	var from = request.From?.Trim();
	var to = request.To?.Trim();
	var text = request.Text?.Trim();

	if (from is null || to is null || !inboxes.ContainsKey(from) || !inboxes.TryGetValue(to, out var inbox))
	{
		return Results.BadRequest(new { error = "Origem ou destinatário inválido." });
	}

	if (string.IsNullOrWhiteSpace(text) || text.Length > 2000)
	{
		return Results.BadRequest(new { error = "A mensagem deve ter entre 1 e 2000 caracteres." });
	}

	var message = new ChatMessage(from, text, DateTimeOffset.UtcNow);
	inbox.Enqueue(message);
	return Results.Accepted($"/api/messages/{to}", message);
});

app.MapGet("/api/messages/{clientId}", (string clientId) =>
{
	if (!inboxes.TryGetValue(clientId, out var inbox))
	{
		return Results.NotFound(new { error = "Cliente não encontrado." });
	}

	var messages = new List<ChatMessage>();
	while (inbox.TryDequeue(out var message))
	{
		messages.Add(message);
	}

	return Results.Ok(messages);
});

app.Run();

record SendMessageRequest(string? From, string? To, string? Text);
record ChatMessage(string From, string Text, DateTimeOffset SentAt);
