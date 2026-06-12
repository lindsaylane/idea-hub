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
    "Advocacy",
    "Connection",
    "Creativity",
    "Family",
    "Integrity"
]

CATEGORIZE_PROMPT = """You are helping someone capture and organize ideas by their core values.

Core values to choose from:
- Advocacy
- Connection
- Creativity
- Family
- Integrity

Given this voice transcription of an idea, you must:
1. Write a 1-2 sentence summary of the idea (clear and compelling)
2. Assign it to EXACTLY ONE core value from the list above (use the exact name)
3. Explain in 1-2 sentences why this idea connects to that value
4. Write a starter prompt for a future Claude chat to develop this idea further

The starter prompt must follow this template (fill in the bracketed parts):

# Project: [idea summary]

**Core Value:** [value name]

---

I have an idea I want to develop. Here is what I am thinking:

[transcription or summary]

This connects to my core value of **[value]** because [reasoning].

Can you help me:
1. Break this down into actionable steps
2. Identify potential blockers
3. Map out what success looks like

Let us start by clarifying the goal.

Respond ONLY with valid JSON in exactly this structure, no other text:
{"summary": "...", "value": "...", "reasoning": "...", "starterPrompt": "..."}

Transcription: {transcription}"""


@app.route("/api/ideas", methods=["POST"])
def create_idea():
    data = request.get_json()
    transcription = data.get("transcription", "").strip()

    if not transcription:
        return jsonify({"error": "Transcription is required"}), 400

    import json
    try:
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
    except Exception as e:
        app.logger.error(f"Claude API error: {e}")
        return jsonify({"error": f"Claude API error: {str(e)}"}), 502

    try:
        raw = message.content[0].text.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
    except Exception as e:
        app.logger.error(f"Failed to parse Claude response: {e} — raw: {message.content[0].text[:500]}")
        return jsonify({"error": "Could not parse Claude response"}), 502

    idea = {
        "id": str(uuid.uuid4()),
        "transcription": transcription,
        "summary": result["summary"],
        "value": result["value"],
        "reasoning": result["reasoning"],
        "starter_prompt": result["starterPrompt"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    try:
        supabase.table("ideas").insert(idea).execute()
    except Exception as e:
        app.logger.error(f"Supabase insert error: {e}")
        return jsonify({"error": f"Database error: {str(e)}"}), 502

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
