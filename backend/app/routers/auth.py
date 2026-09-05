from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserLogin, UserRegister, UserOut, TokenResponse
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    require_role
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticates an officer by officer_id and password.
    Returns JWT access token with role and department claims.
    """
    user = db.query(User).filter(User.officer_id == credentials.officer_id).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid officer ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    access_token = create_access_token(
        data={
            "sub": user.officer_id,
            "role": user.role,
            "department": user.department
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "officer_id": user.officer_id,
        "department": user.department
    }

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_officer(
    user_in: UserRegister,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("OPERATIONS_CONTROLLER", "DIVISIONAL_ENGINEER"))
):
    """
    Seed/Admin endpoint to create new officer user accounts.
    Hashes password and creates User record.
    """
    existing_user = db.query(User).filter(User.officer_id == user_in.officer_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Officer ID '{user_in.officer_id}' is already registered."
        )

    valid_roles = [
        "OPERATIONS_CONTROLLER",
        "FIELD_OFFICER_ENG",
        "FIELD_OFFICER_ST",
        "FIELD_OFFICER_TRD",
        "DIVISIONAL_ENGINEER",
        "SSE_INSPECTOR",
        "DOM_OPERATIONS"
    ]
    if user_in.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of {valid_roles}"
        )

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        officer_id=user_in.officer_id,
        hashed_password=hashed_pw,
        role=user_in.role,
        full_name=user_in.full_name,
        department=user_in.department,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns current authenticated officer session details.
    """
    return current_user
