from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserResponse, Token
from ..auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from ..logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Registration attempt for username: {user_data.username}, email: {user_data.email}")
    
    # Check if user already exists
    if db.query(User).filter(User.username == user_data.username).first():
        logger.warning(f"Registration failed: Username '{user_data.username}' already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    if db.query(User).filter(User.email == user_data.email).first():
        logger.warning(f"Registration failed: Email '{user_data.email}' already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    try:
        # Validate password length in bytes (bcrypt limit)
        password_bytes = user_data.password.encode('utf-8')
        if len(password_bytes) > 72:
            logger.warning(f"Registration failed: Password too long ({len(password_bytes)} bytes)")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password cannot be longer than 72 characters"
            )
        
        # Hash password with additional error handling
        password_bytes = len(user_data.password.encode('utf-8'))
        password_len = len(user_data.password)
        logger.debug(f"Password validation: {password_len} chars, {password_bytes} bytes")
        
        try:
            hashed_password = get_password_hash(user_data.password)
        except ValueError as hash_error:
            # Catch validation errors from password hashing (including bcrypt 72-byte limit)
            original_error = str(hash_error)
            logger.error(f"Password hashing ValueError for user {user_data.username}: {original_error}, Password: {password_len} chars, {password_bytes} bytes")
            
            # Only format as 72-byte error if password is ACTUALLY too long (> 72 bytes)
            # This prevents false positives from other errors that might mention "72"
            if password_bytes > 72:
                error_msg = f"Password cannot be longer than 72 characters. Your password is {password_len} characters ({password_bytes} bytes when encoded). Some special characters may use multiple bytes."
            else:
                # Password is NOT too long, so use the original error message
                error_msg = original_error
                logger.warning(f"Password is only {password_bytes} bytes but got ValueError: {original_error}")
            
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        except Exception as hash_error:
            # Catch any other unexpected errors from password hashing
            error_msg = str(hash_error)
            logger.error(f"Unexpected password hashing error for user {user_data.username}: {error_msg}, Password bytes: {password_bytes}", exc_info=True)
            db.rollback()
            # Only show 72-byte error if password is actually too long
            if password_bytes > 72:
                password_len = len(user_data.password)
                error_msg = f"Password cannot be longer than 72 characters. Your password is {password_len} characters ({password_bytes} bytes when encoded)."
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"User registered successfully: {user_data.username} (ID: {db_user.id})")
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user {user_data.username}: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    logger.info(f"Login attempt for username: {form_data.username}")
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Login failed for username: {form_data.username} - Invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    logger.info(f"User logged in successfully: {user.username} (ID: {user.id})")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    logger.debug(f"User info requested for: {current_user.username} (ID: {current_user.id})")
    return current_user

