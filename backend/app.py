import os
import uuid
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic
from supabase import create_client, Client

app = Flask(__name__)
CORS(app)

# Clients
anthropic_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_SERVICE_KEY")
)

CORE_VALUES = [
    "Justice",
    "Real Human Connection",
    "Courage",
    "Advocacy",
    "Goodness"
]

CATEGORIZE_PROMPT = """You are helping someone capture and organize ideas by their core values.

Core values to choose from:
- Justice
- Real Human Connection
- Courage
- Advocacy
- Goodness

Given this voice transcription of an idea, you must:
1. Write a 1-2 sentence summary of the idea (clear and compelling)
2. Assign it to EXACTLY ONE core value from the list above
3. Explain in 1-2 sentences why this idea connects to that value
4. Write a starter prompt for a future Claude chat to develop this idea further

Respond in this exact JSON format:
{
  "summary": "...",
  "value": "...",
  "reasoning": "...",
  "starterPrompt": "# Project: [idea summary]\\n\\n**Core Value:** [value name]\\n\\n---\\n\\nI have an idea I want to develop. Here\\'s what I\\'m thinking:\\n\\n[transcription or summary]\\n\\nThis connects to my core value of **[value]** because [reasoning].\\n\\nCan you help me:\\n1. Break this down into actionable steps\\n2. Identify potential blockers\\n3. Map out what success looks like\\n\\nLet\\'s start by clarifying the goal."
}

Transcription: {transcription}"""


@app.route("/api/ideas", methods=["POST"])
def create_idea():
    data = request.get_json()
    transcription = data.get("transcription", "").strip()

    if not transcription:
        return jsonify({"error": "Transcription is required"}), 400

    # Call Claude for categorization
    message = anthropic_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": CATEGORIZE_PROMPT.replace("{transcription}", transcription)
            }
        ]
    )

    import json
    raw = message.content[0].text
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    result = json.loads(raw.strip())

    idea = {
        "id": str(uuid.uuid4()),
        "transcription": transcription,
        "summary": result["summary"],
        "value": result["value"],
        "reasoning": result["reasoning"],
        "starter_prompt": result["starterPrompt"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    supabase.table("ideas").insert(idea).execute()

    return jsonify(idea), 201


@app.route("/api/ideas", methods=["GET"])
def get_ideas():
    response = supabase.table("ideas").select("*").order("created_at", desc=True).execute()
    return jsonify(response.data)


@app.route("/api/ideas/<idea_id>", methods=["DELETE"])
def delete_idea(idea_id):
    supabase.table("ideas").delete().eq("id", idea_id).execute()
    return jsonify({"success": True})


@app.route("/api/values", methods=["GET"])
def get_values():
    return jsonify(CORE_VALUES)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
