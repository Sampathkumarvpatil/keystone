from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson.objectid import ObjectId
from pydantic import BaseModel, Field
import os
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any, Union

# Create FastAPI app
app = FastAPI(title="Agile Tracker API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure MongoDB client
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(mongo_url)
db = client.agile_tracker

# Models
class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    status: str
    priority: str
    startDate: datetime
    endDate: datetime
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: Optional[datetime] = None

class Sprint(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    projectId: int
    name: str
    startDate: datetime
    endDate: datetime
    status: str
    committedPoints: int = 0
    acceptedPoints: int = 0
    addedPoints: int = 0
    descopedPoints: int = 0
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: Optional[datetime] = None

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    projectId: int
    sprintId: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    assigneeId: Optional[str] = None
    assignee: Optional[str] = None
    estimatedHours: float = 0
    actualHours: float = 0
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: Optional[datetime] = None

class Bug(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    taskId: Optional[int] = None
    projectId: int
    sprintId: Optional[int] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    severity: str
    assigneeId: Optional[str] = None
    assignee: Optional[str] = None
    estimatedHours: float = 0
    actualHours: float = 0
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: Optional[datetime] = None

class TeamMember(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: str
    capacity: int
    avatar: Optional[str] = None
    projectId: Optional[int] = None
    sprintId: Optional[int] = None
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: Optional[datetime] = None

class TimeEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    taskId: int
    projectId: int
    sprintId: Optional[int] = None
    isTaskEntry: bool = True
    isBugEntry: bool = False
    date: str
    hours: float
    description: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.now)

# Root endpoint
@app.get("/api")
async def root():
    return {"message": "Agile Tracker API"}

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# Status check endpoint
@app.get("/api/status")
async def status():
    return {
        "status": "operational",
        "version": "1.0.0",
        "uptime": "N/A",
        "timestamp": datetime.now().isoformat()
    }

# Sprints endpoints
@app.get("/api/sprints")
async def get_sprints(project_id: Optional[int] = None):
    query = {}
    if project_id:
        query["projectId"] = project_id
    sprints = list(db.sprints.find(query))
    return [format_document(sprint) for sprint in sprints]

@app.post("/api/sprints", status_code=201)
async def create_sprint(sprint: dict):
    sprint["id"] = str(uuid.uuid4())
    sprint["createdAt"] = datetime.now()
    
    # Convert dates to datetime objects if they are strings
    if isinstance(sprint.get("startDate"), str):
        sprint["startDate"] = datetime.fromisoformat(sprint["startDate"].replace("Z", "+00:00"))
    if isinstance(sprint.get("endDate"), str):
        sprint["endDate"] = datetime.fromisoformat(sprint["endDate"].replace("Z", "+00:00"))
    
    result = db.sprints.insert_one(sprint)
    created_sprint = db.sprints.find_one({"_id": result.inserted_id})
    return format_document(created_sprint)

@app.get("/api/sprints/{sprint_id}")
async def get_sprint(sprint_id: str):
    sprint = db.sprints.find_one({"id": sprint_id})
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return format_document(sprint)

@app.put("/api/sprints/{sprint_id}")
async def update_sprint(sprint_id: str, update_data: dict):
    sprint = db.sprints.find_one({"id": sprint_id})
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    update_data["updatedAt"] = datetime.now()
    
    # Convert dates to datetime objects if they are strings
    if isinstance(update_data.get("startDate"), str):
        update_data["startDate"] = datetime.fromisoformat(update_data["startDate"].replace("Z", "+00:00"))
    if isinstance(update_data.get("endDate"), str):
        update_data["endDate"] = datetime.fromisoformat(update_data["endDate"].replace("Z", "+00:00"))
    
    db.sprints.update_one({"id": sprint_id}, {"$set": update_data})
    updated_sprint = db.sprints.find_one({"id": sprint_id})
    return format_document(updated_sprint)

@app.delete("/api/sprints/{sprint_id}")
async def delete_sprint(sprint_id: str):
    sprint = db.sprints.find_one({"id": sprint_id})
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    # Check for related tasks and bugs
    tasks = list(db.tasks.find({"sprintId": sprint_id}))
    bugs = list(db.bugs.find({"sprintId": sprint_id}))
    
    # Update tasks and bugs to remove the sprint association
    if tasks:
        db.tasks.update_many({"sprintId": sprint_id}, {"$set": {"sprintId": None}})
    
    if bugs:
        db.bugs.update_many({"sprintId": sprint_id}, {"$set": {"sprintId": None}})
    
    # Delete the sprint
    db.sprints.delete_one({"id": sprint_id})
    return {"message": "Sprint deleted successfully"}

# Tasks endpoints
@app.get("/api/tasks")
async def get_tasks(project_id: Optional[int] = None, sprint_id: Optional[int] = None):
    query = {}
    if project_id:
        query["projectId"] = project_id
    if sprint_id:
        query["sprintId"] = sprint_id
    tasks = list(db.tasks.find(query))
    return [format_document(task) for task in tasks]

@app.post("/api/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(task: dict):
    task["id"] = str(uuid.uuid4())
    task["createdAt"] = datetime.now()
    result = db.tasks.insert_one(task)
    created_task = db.tasks.find_one({"_id": result.inserted_id})
    return format_document(created_task)

@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str):
    task = db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return format_document(task)

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, update_data: dict):
    task = db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data["updatedAt"] = datetime.now()
    db.tasks.update_one({"id": task_id}, {"$set": update_data})
    updated_task = db.tasks.find_one({"id": task_id})
    return format_document(updated_task)

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    task = db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check for related bugs and time entries
    bugs = list(db.bugs.find({"taskId": task_id}))
    time_entries = list(db.time_entries.find({"taskId": task_id}))
    
    # Update bugs to remove the task association
    if bugs:
        db.bugs.update_many({"taskId": task_id}, {"$set": {"taskId": None}})
    
    # Delete related time entries
    if time_entries:
        db.time_entries.delete_many({"taskId": task_id})
    
    # Delete the task
    db.tasks.delete_one({"id": task_id})
    return {"message": "Task deleted successfully"}

# Bugs endpoints
@app.get("/api/bugs")
async def get_bugs(project_id: Optional[int] = None, sprint_id: Optional[int] = None, task_id: Optional[int] = None):
    query = {}
    if project_id:
        query["projectId"] = project_id
    if sprint_id:
        query["sprintId"] = sprint_id
    if task_id:
        query["taskId"] = task_id
    bugs = list(db.bugs.find(query))
    return [format_document(bug) for bug in bugs]

@app.post("/api/bugs", status_code=status.HTTP_201_CREATED)
async def create_bug(bug: dict):
    bug["id"] = str(uuid.uuid4())
    bug["createdAt"] = datetime.now()
    result = db.bugs.insert_one(bug)
    created_bug = db.bugs.find_one({"_id": result.inserted_id})
    return format_document(created_bug)

@app.get("/api/bugs/{bug_id}")
async def get_bug(bug_id: str):
    bug = db.bugs.find_one({"id": bug_id})
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    return format_document(bug)

@app.put("/api/bugs/{bug_id}")
async def update_bug(bug_id: str, update_data: dict):
    bug = db.bugs.find_one({"id": bug_id})
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    update_data["updatedAt"] = datetime.now()
    db.bugs.update_one({"id": bug_id}, {"$set": update_data})
    updated_bug = db.bugs.find_one({"id": bug_id})
    return format_document(updated_bug)

@app.delete("/api/bugs/{bug_id}")
async def delete_bug(bug_id: str):
    bug = db.bugs.find_one({"id": bug_id})
    if not bug:
        raise HTTPException(status_code=404, detail="Bug not found")
    
    # Delete related time entries
    time_entries = list(db.time_entries.find({"taskId": bug_id, "isBugEntry": True}))
    if time_entries:
        db.time_entries.delete_many({"taskId": bug_id, "isBugEntry": True})
    
    # Delete the bug
    db.bugs.delete_one({"id": bug_id})
    return {"message": "Bug deleted successfully"}

# Team members endpoints
@app.get("/api/team")
async def get_team_members(project_id: Optional[int] = None, sprint_id: Optional[int] = None):
    query = {}
    if project_id:
        query["projectId"] = project_id
    if sprint_id:
        query["sprintId"] = sprint_id
    team_members = list(db.team.find(query))
    return [format_document(member) for member in team_members]

@app.post("/api/team", status_code=status.HTTP_201_CREATED)
async def create_team_member(member: dict):
    member["id"] = str(uuid.uuid4())
    member["createdAt"] = datetime.now()
    result = db.team.insert_one(member)
    created_member = db.team.find_one({"_id": result.inserted_id})
    return format_document(created_member)

@app.get("/api/team/{member_id}")
async def get_team_member(member_id: str):
    member = db.team.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return format_document(member)

@app.put("/api/team/{member_id}")
async def update_team_member(member_id: str, update_data: dict):
    member = db.team.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    update_data["updatedAt"] = datetime.now()
    db.team.update_one({"id": member_id}, {"$set": update_data})
    updated_member = db.team.find_one({"id": member_id})
    return format_document(updated_member)

@app.delete("/api/team/{member_id}")
async def delete_team_member(member_id: str):
    member = db.team.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    # Check for related tasks and bugs
    tasks = list(db.tasks.find({"assigneeId": member_id}))
    bugs = list(db.bugs.find({"assigneeId": member_id}))
    
    # Update tasks and bugs to remove the assignee
    if tasks:
        db.tasks.update_many({"assigneeId": member_id}, {"$set": {"assigneeId": None, "assignee": None}})
    
    if bugs:
        db.bugs.update_many({"assigneeId": member_id}, {"$set": {"assigneeId": None, "assignee": None}})
    
    # Delete the team member
    db.team.delete_one({"id": member_id})
    return {"message": "Team member deleted successfully"}

# Time tracking endpoints
@app.get("/api/time-entries")
async def get_time_entries(project_id: Optional[int] = None, sprint_id: Optional[int] = None, assignee_id: Optional[str] = None):
    query = {}
    if project_id:
        query["projectId"] = project_id
    if sprint_id:
        query["sprintId"] = sprint_id
    
    # For assignee filtering, we need to join with tasks or bugs
    time_entries = list(db.time_entries.find(query))
    
    # If assignee_id is provided, filter further
    if assignee_id:
        filtered_entries = []
        for entry in time_entries:
            item_id = entry.get("taskId")
            if entry.get("isTaskEntry", True):
                item = db.tasks.find_one({"id": item_id})
            else:
                item = db.bugs.find_one({"id": item_id})
            
            if item and item.get("assigneeId") == assignee_id:
                filtered_entries.append(entry)
        
        time_entries = filtered_entries
    
    return [format_document(entry) for entry in time_entries]

@app.post("/api/time-entries", status_code=status.HTTP_201_CREATED)
async def create_time_entry(entry: dict):
    entry["id"] = str(uuid.uuid4())
    entry["createdAt"] = datetime.now()
    
    # If the entry is for a completed task/bug, update the actual hours
    task_id = entry.get("taskId")
    if entry.get("isTaskEntry", True):
        task = db.tasks.find_one({"id": str(task_id)})
        if task and task.get("status") == "Done":
            current_hours = float(task.get("actualHours", 0))
            new_hours = current_hours + float(entry.get("hours", 0))
            db.tasks.update_one({"id": str(task_id)}, {"$set": {"actualHours": new_hours}})
    else:
        bug = db.bugs.find_one({"id": str(task_id)})
        if bug and bug.get("status") == "Done":
            current_hours = float(bug.get("actualHours", 0))
            new_hours = current_hours + float(entry.get("hours", 0))
            db.bugs.update_one({"id": str(task_id)}, {"$set": {"actualHours": new_hours}})
    
    result = db.time_entries.insert_one(entry)
    created_entry = db.time_entries.find_one({"_id": result.inserted_id})
    return format_document(created_entry)

@app.get("/api/time-entries/{entry_id}")
async def get_time_entry(entry_id: str):
    entry = db.time_entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return format_document(entry)

@app.delete("/api/time-entries/{entry_id}")
async def delete_time_entry(entry_id: str):
    entry = db.time_entries.find_one({"id": entry_id})
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    
    # If the entry was for a completed task/bug, update the actual hours
    task_id = entry.get("taskId")
    hours = entry.get("hours", 0)
    
    if entry.get("isTaskEntry", True):
        task = db.tasks.find_one({"id": task_id})
        if task and task.get("status") == "Done":
            current_hours = task.get("actualHours", 0)
            new_hours = max(0, current_hours - hours)
            db.tasks.update_one({"id": task_id}, {"$set": {"actualHours": new_hours}})
    else:
        bug = db.bugs.find_one({"id": task_id})
        if bug and bug.get("status") == "Done":
            current_hours = bug.get("actualHours", 0)
            new_hours = max(0, current_hours - hours)
            db.bugs.update_one({"id": task_id}, {"$set": {"actualHours": new_hours}})
    
    # Delete the time entry
    db.time_entries.delete_one({"id": entry_id})
    return {"message": "Time entry deleted successfully"}

# Helper functions
def format_document(doc):
    """Format MongoDB document for JSON response"""
    if doc is None:
        return None
    
    # Convert ObjectId to string
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    
    return doc

# Database events
@app.on_event("startup")
async def startup_db_client():
    pass

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()