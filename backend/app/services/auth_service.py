from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import RegisterRequest


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, request: RegisterRequest) -> User:
        self._ensure_email_available(request.email)
        user = User(
            email=request.email,
            display_name=request.display_name,
            hashed_password=hash_password(request.password),
        )
        self.db.add(user)
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Email already registered")
        self.db.refresh(user)
        return user

    def authenticate(self, email: str, password: str) -> User | None:
        user = self._find_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def get_user_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def _find_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def _ensure_email_available(self, email: str) -> None:
        if self._find_by_email(email):
            raise ValueError("Email already registered")
