from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from .models import User
from .logging_config import get_logger
import os
from dotenv import load_dotenv

load_dotenv()

logger = get_logger(__name__)

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

if SECRET_KEY == "your-secret-key-change-in-production":
    logger.warning("Using default SECRET_KEY - this should be changed in production!")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    Raises ValueError if password is longer than 72 bytes.
    """
    # Check byte length before hashing (bcrypt limit is 72 bytes)
    password_bytes = password.encode('utf-8')
    password_byte_len = len(password_bytes)
    
    if password_byte_len > 72:
        raise ValueError(f"Password cannot be longer than 72 bytes (got {password_byte_len} bytes)")
    
    # Hash the password
    # Note: Some bcrypt/passlib versions have a bug where they throw false positive
    # 72-byte errors even for valid passwords. We've already validated the length.
    try:
        return pwd_context.hash(password)
    except ValueError as e:
        error_msg = str(e).lower()
        # Check if this is a false positive 72-byte error from bcrypt
        if ("72 bytes" in error_msg or "longer than 72" in error_msg or "truncate" in error_msg) and password_byte_len <= 72:
            # This is a known false positive bug in some bcrypt/passlib versions
            # Since we've validated the password is <= 72 bytes, we can safely proceed
            # by using bcrypt directly instead of through passlib
            logger.warning(f"Bcrypt false positive error detected for {password_byte_len} byte password. Using direct bcrypt hash.")
            import bcrypt
            # Hash directly with bcrypt (password_bytes is already validated to be <= 72)
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(password_bytes, salt)
            # Return as string (passlib format)
            return hashed.decode('utf-8')
        # Re-raise if it's a different error
        raise

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        logger.debug(f"Authentication failed: user '{email}' not found")
        return None
    if not verify_password(password, user.hashed_password):
        logger.debug(f"Authentication failed: invalid password for user '{email}'")
        return None
    logger.debug(f"Authentication successful for user '{email}'")
    return user

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            logger.warning("JWT token missing 'sub' claim")
            raise credentials_exception
    except JWTError as e:
        logger.warning(f"JWT validation failed: {str(e)}")
        raise credentials_exception
    user = get_user_by_username(db, username=username)
    if user is None:
        logger.warning(f"User '{username}' from JWT token not found in database")
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

