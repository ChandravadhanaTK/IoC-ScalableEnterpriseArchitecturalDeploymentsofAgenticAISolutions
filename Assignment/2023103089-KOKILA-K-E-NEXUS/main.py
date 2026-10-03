import os
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="NEXUS AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

store = {
    "tasks": [],
    "notes": [],
    "events": [],
    "knowledge": [],
}

class Task(BaseModel):
    name: str
    priority: Optional[str] = "medium"
    due: Optional[str] = ""

class Note(BaseModel):
    title: Optional[str] = "Quick Note"
    content: str

class Event(BaseModel):
    title: str
    date: Optional[str] = ""
    time: Optional[str] = ""

class KnowledgeItem(BaseModel):
    title: str
    content: str
    tags: Optional[List[str]] = []

class AICommand(BaseModel):
    command: str

@app.get("/")
def serve_frontend():
    return FileResponse("index.html")

@app.get("/style.css")
def serve_css():
    return FileResponse("style.css", media_type="text/css")

@app.get("/script.js")
def serve_js():
    return FileResponse("script.js", media_type="application/javascript")

@app.get("/health")
def health():
    return {"status": "ok", "agents": 6}

@app.post("/add-task")
def add_task(task: Task):
    item = {
        "id": len(store["tasks"]) + 1,
        "name": task.name,
        "priority": task.priority,
        "due": task.due,
        "done": False,
        "created": datetime.now().isoformat(),
    }
    store["tasks"].append(item)
    return {"success": True, "task": item, "total": len(store["tasks"])}

@app.get("/tasks")
def get_tasks():
    return {"tasks": store["tasks"], "total": len(store["tasks"])}

@app.patch("/tasks/{task_id}/toggle")
def toggle_task(task_id: int):
    for t in store["tasks"]:
        if t["id"] == task_id:
            t["done"] = not t["done"]
            return {"success": True, "task": t}
    raise HTTPException(status_code=404, detail="Task not found")

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    store["tasks"] = [t for t in store["tasks"] if t["id"] != task_id]
    return {"success": True}

@app.post("/add-note")
def add_note(note: Note):
    item = {
        "id": len(store["notes"]) + 1,
        "title": note.title,
        "content": note.content,
        "date": datetime.now().strftime("%b %d"),
        "created": datetime.now().isoformat(),
    }
    store["notes"].append(item)
    return {"success": True, "note": item, "total": len(store["notes"])}

@app.get("/notes")
def get_notes():
    return {"notes": store["notes"], "total": len(store["notes"])}

@app.delete("/notes/{note_id}")
def delete_note(note_id: int):
    store["notes"] = [n for n in store["notes"] if n["id"] != note_id]
    return {"success": True}

@app.post("/add-event")
def add_event(event: Event):
    item = {
        "id": len(store["events"]) + 1,
        "title": event.title,
        "date": event.date or datetime.now().strftime("%Y-%m-%d"),
        "time": event.time or "12:00 PM",
        "created": datetime.now().isoformat(),
    }
    store["events"].append(item)
    return {"success": True, "event": item, "total": len(store["events"])}

@app.get("/events")
def get_events():
    return {"events": store["events"], "total": len(store["events"])}

@app.post("/add-knowledge")
def add_knowledge(item: KnowledgeItem):
    entry = {
        "id": len(store["knowledge"]) + 1,
        "title": item.title,
        "content": item.content,
        "tags": item.tags,
        "created": datetime.now().isoformat(),
    }
    store["knowledge"].append(entry)
    return {"success": True, "item": entry, "total": len(store["knowledge"])}

@app.get("/knowledge")
def get_knowledge():
    return {"knowledge": store["knowledge"], "total": len(store["knowledge"])}

@app.delete("/knowledge/{item_id}")
def delete_knowledge(item_id: int):
    store["knowledge"] = [k for k in store["knowledge"] if k["id"] != item_id]
    return {"success": True}

@app.get("/weather")
def get_weather():
    return {
        "temp": "24°C",
        "condition": "Partly Cloudy",
        "humidity": "68%",
        "wind": "12 km/h",
        "visibility": "10 km",
        "icon": "⛅",
    }

@app.post("/ai-command")
async def ai_command(body: AICommand):
    cmd = body.command.lower().strip()

    if cmd.startswith("add task "):
        name = body.command[9:]
        result = add_task(Task(name=name))
        return {"agent": "TaskAgent", "response": f"✅ Task added: \"{name}\" — {result['total']} total tasks.", "data": result}

    if cmd.startswith("add note "):
        content = body.command[9:]
        result = add_note(Note(content=content))
        return {"agent": "NotesAgent", "response": f"📝 Note saved: \"{content[:50]}...\"", "data": result}

    if cmd.startswith("schedule ") or cmd.startswith("add event "):
        title = body.command[9:] if cmd.startswith("schedule ") else body.command[10:]
        result = add_event(Event(title=title))
        return {"agent": "CalendarAgent", "response": f"📅 Event scheduled: \"{title}\"", "data": result}

    if "weather" in cmd:
        data = get_weather()
        return {"agent": "WeatherAgent", "response": f"🌦️ {data['temp']}, {data['condition']}. Humidity {data['humidity']}, Wind {data['wind']}.", "data": data}

    if "show tasks" in cmd or "list tasks" in cmd:
        data = get_tasks()
        active = [t for t in data["tasks"] if not t["done"]]
        lines = "\n".join(f"{i+1}. {t['name']}" for i, t in enumerate(active))
        return {"agent": "TaskAgent", "response": f"📋 {len(active)} active tasks:\n{lines or 'None yet.'}", "data": data}

    if "show notes" in cmd or "list notes" in cmd:
        data = get_notes()
        return {"agent": "NotesAgent", "response": f"📝 {data['total']} notes stored.", "data": data}

    return {
        "agent": "RouterAgent",
        "response": "🤖 Try: 'add task [name]', 'add note [text]', 'schedule [event]', 'weather', 'show tasks'",
        "data": None,
    }
