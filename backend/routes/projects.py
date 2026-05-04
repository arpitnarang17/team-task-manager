from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth import get_current_user
import models

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class MemberAdd(BaseModel):
    user_id: int
    role: str = "member"

class MemberOut(BaseModel):
    id: int
    user_id: int
    role: str
    user: dict
    class Config:
        from_attributes = True

class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    class Config:
        from_attributes = True

def get_project_or_404(project_id: int, db: Session):
    p = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p

def require_admin(project_id: int, user_id: int, db: Session):
    membership = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user_id
    ).first()
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    is_owner = project and project.owner_id == user_id
    is_admin = membership and membership.role == "admin"
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Admin access required")

@router.post("/", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = models.Project(
        name=payload.name,
        description=payload.description,
        owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    # Auto-add owner as admin member
    membership = models.ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=models.RoleEnum.admin
    )
    db.add(membership)
    db.commit()
    return project

@router.get("/", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    memberships = db.query(models.ProjectMember).filter(
        models.ProjectMember.user_id == current_user.id
    ).all()
    project_ids = [m.project_id for m in memberships]
    return db.query(models.Project).filter(models.Project.id.in_(project_ids)).all()

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return get_project_or_404(project_id, db)

@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    project = get_project_or_404(project_id, db)
    if project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can delete project")
    db.delete(project)
    db.commit()

@router.post("/{project_id}/members", status_code=201)
def add_member(
    project_id: int,
    payload: MemberAdd,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    require_admin(project_id, current_user.id, db)
    existing = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == payload.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already a member")
    role = models.RoleEnum.admin if payload.role == "admin" else models.RoleEnum.member
    member = models.ProjectMember(
        project_id=project_id,
        user_id=payload.user_id,
        role=role
    )
    db.add(member)
    db.commit()
    return {"message": "Member added"}

@router.get("/{project_id}/members")
def get_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    members = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id
    ).all()
    result = []
    for m in members:
        user = db.query(models.User).filter(models.User.id == m.user_id).first()
        result.append({
            "id": m.id,
            "user_id": m.user_id,
            "role": m.role,
            "name": user.name if user else "",
            "email": user.email if user else ""
        })
    return result

@router.delete("/{project_id}/members/{user_id}", status_code=204)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    require_admin(project_id, current_user.id, db)
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
