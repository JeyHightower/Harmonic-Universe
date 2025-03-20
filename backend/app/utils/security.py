"""Security utility functions."""

import secrets
import string
from typing import Optional, Tuple
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import re
from base64 import b64encode, b64decode

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)

def generate_token(length: int = 32) -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(length)

def generate_api_key() -> str:
    """Generate a secure API key."""
    return b64encode(secrets.token_bytes(32)).decode('utf-8')

def create_jwt_token(data: dict, secret_key: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt

def verify_jwt_token(token: str, secret_key: str) -> Optional[dict]:
    """Verify a JWT token."""
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        return None

def generate_secure_password(length: int = 16) -> str:
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in string.punctuation for c in password)):
            return password

def sanitize_input(input_string: str) -> str:
    """Sanitize input string to prevent XSS."""
    # Remove HTML tags
    clean = re.compile('<.*?>')
    sanitized = re.sub(clean, '', input_string)
    # Escape special characters
    sanitized = sanitized.replace('&', '&amp;')
    sanitized = sanitized.replace('<', '&lt;')
    sanitized = sanitized.replace('>', '&gt;')
    sanitized = sanitized.replace('"', '&quot;')
    sanitized = sanitized.replace("'", '&#x27;')
    return sanitized

def encrypt_data(data: str, key: bytes) -> Tuple[bytes, bytes]:
    """Encrypt data using Fernet (symmetric encryption)."""
    from cryptography.fernet import Fernet
    if not isinstance(key, bytes):
        key = key.encode()
    f = Fernet(key)
    return f.encrypt(data.encode()), key

def decrypt_data(encrypted_data: bytes, key: bytes) -> str:
    """Decrypt data using Fernet (symmetric encryption)."""
    from cryptography.fernet import Fernet
    if not isinstance(key, bytes):
        key = key.encode()
    f = Fernet(key)
    return f.decrypt(encrypted_data).decode()

def generate_encryption_key() -> bytes:
    """Generate a new encryption key for Fernet."""
    from cryptography.fernet import Fernet
    return Fernet.generate_key()

def hash_data(data: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hash data with optional salt."""
    if salt is None:
        salt = secrets.token_hex(16)
    salted = (salt + data).encode()
    hashed = hashlib.sha256(salted).hexdigest()
    return hashed, salt

def constant_time_compare(val1: str, val2: str) -> bool:
    """Compare two strings in constant time to prevent timing attacks."""
    return secrets.compare_digest(val1.encode(), val2.encode())

def generate_nonce() -> str:
    """Generate a random nonce."""
    return secrets.token_hex(16)

def mask_sensitive_data(data: str, mask_char: str = '*') -> str:
    """Mask sensitive data, showing only first and last characters."""
    if len(data) <= 4:
        return mask_char * len(data)
    return data[:2] + mask_char * (len(data) - 4) + data[-2:]
