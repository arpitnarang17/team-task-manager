from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db
from auth import get_current_user
import models

router = APIRouter()

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: int
    assignee_id: Optional[int] = None
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None
    due_date: Optional[datetime] = None

class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    project_id: int
    assignee_id: Optional[int]
    created_by: int
    due_date: Optional[datetime]
    created_at: Optional[datetime]
    assignee_name: Optional[str] = None
    class Config:
        from_attributes = True

def task_to_dict(task: models.Task, db: Session):
    assignee_name = None
    if task.assignee_id:
        u = db.query(models.User).filter(models.User.id == task.assignee_id).first()
        assignee_name = u.name if u else None
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "project_id": task.project_id,
        "assignee_id": task.assignee_id,
        "created_by": task.created_by,
        "due_date": task.due_date,
        "created_at": task.created_at,
        "assignee_name": assignee_name
    }

@router.post("/", status_code=201)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check membership
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == payload.project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a project member")

    priority_map = {"low": models.PriorityEnum.low, "medium": models.PriorityEnum.medium, "high": models.PriorityEnum.high}
    task = models.Task(
        title=payload.title,
        description=payload.description,
        project_id=payload.project_id,
        assignee_id=payload.assignee_id,
        created_by=current_user.id,
        priority=priority_map.get(payload.priority, models.PriorityEnum.medium),
        due_date=payload.due_date
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_to_dict(task, db)

@router.get("/project/{project_id}")
def get_project_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a project member")
    tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
    return [task_to_dict(t, db) for t in tasks]

@router.get("/my")
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    tasks = db.query(models.Task).filter(models.Task.assignee_id == current_user.id).all()
    return [task_to_dict(t, db) for t in tasks]

@router.patch("/{task_id}")
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.status is not None:
        status_map = {"todo": models.StatusEnum.todo, "in_progress": models.StatusEnum.in_progress, "done": models.StatusEnum.done}
        task.status = status_map.get(payload.status, task.status)
    if payload.priority is not None:
        priority_map = {"low": models.PriorityEnum.low, "medium": models.PriorityEnum.medium, "high": models.PriorityEnum.high}
        task.priority = priority_map.get(payload.priority, task.priority)
    if payload.assignee_id is not None:
        task.assignee_id = payload.assignee_id
    if payload.due_date is not None:
        task.due_date = payload.due_date

    db.commit()
    db.refresh(task)
    return task_to_dict(task, db)

@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == task.project_id,
        models.ProjectMember.user_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(task)
    db.commit()
