"""
============================================================================
E2EE (End-to-End Encryption) — Referência em Python/FastAPI
============================================================================

Este arquivo é uma REFERÊNCIA EDUCACIONAL mostrando como a mesma
arquitetura de E2EE implementada em Node.js/Express seria feita
em Python com FastAPI + SQLAlchemy.

NÃO é código de produção do projeto controlefinanceiro (que usa Node.js).
Use como guia caso decida migrar o backend para Python no futuro.

Stack demonstrada:
- Backend: FastAPI + Pydantic + SQLAlchemy
- Banco de Dados: PostgreSQL
- Autenticação: JWT (python-jose)
- Criptografia: Web Crypto API no frontend (TypeScript, não muda)

============================================================================
"""

# ===========================================================================
# 1. DATABASE MODEL (SQLAlchemy)
# ===========================================================================

from sqlalchemy import Column, String, Float, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import uuid

Base = declarative_base()


class User(Base):
    """
    Modelo de usuário.
    A senha é armazenada como hash bcrypt (nunca em texto plano).
    """
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamento com chaves de criptografia
    encryption_keys = relationship("UserEncryptionKey", back_populates="user", uselist=False)


class UserEncryptionKey(Base):
    """
    Armazena as chaves de criptografia encapsuladas (wrapped) do usuário.
    
    PRINCÍPIO ZERO-KNOWLEDGE:
    - salt: valor aleatório para PBKDF2 (NÃO é segredo)
    - wrapped_mek: MEK criptografada com a DEK do usuário (OPACO para o servidor)
    - mek_iv: IV usado para encapsular a MEK
    
    O servidor armazena esses valores mas NÃO consegue derivar a MEK.
    Apenas o navegador do usuário, com a senha correta, pode desencapsular.
    """
    __tablename__ = "user_encryption_keys"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    # Salt para derivação PBKDF2 (16 bytes em Base64)
    salt = Column(Text, nullable=False)
    # MEK encapsulada pela DEK (AES-GCM, em Base64)
    wrapped_mek = Column(Text, nullable=False)
    # IV usado no encapsulamento da MEK (12 bytes em Base64)
    mek_iv = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="encryption_keys")


class Bill(Base):
    """
    Modelo de conta/fatura com suporte E2EE.
    
    CAMPOS CRIPTOGRAFADOS (dentro de encrypted_data):
    - name: nome da conta
    - value: valor da conta
    
    CAMPOS EM TEXTO PLANO (metadados operacionais):
    - due_date: para ordenação/filtragem server-side
    - status: para filtragem server-side
    - owner_id: para controle de acesso (ownership)
    - group_id: para controle de acesso (grupo)
    
    O servidor vê due_date e status mas NÃO vê name ou value.
    """
    __tablename__ = "bills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    group_id = Column(UUID(as_uuid=True), nullable=True)

    # Campos legacy (texto plano) — mantidos para compatibilidade
    name = Column(String(255), nullable=True)
    value = Column(Float, nullable=True)

    # Metadados operacionais (sempre em texto plano)
    due_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    paid_date = Column(DateTime(timezone=True), nullable=True)

    # Campos E2EE
    # encrypted_data contém o JSON criptografado: {"name": "...", "value": 123.45}
    encrypted_data = Column(Text, nullable=True)
    # encryption_iv é o IV de 12 bytes usado na criptografia (único por registro)
    encryption_iv = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ===========================================================================
# 2. PYDANTIC SCHEMAS (Validação de entrada/saída)
# ===========================================================================

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID as PyUUID


class EncryptionKeySetup(BaseModel):
    """Schema para configuração inicial de chaves E2EE."""
    salt: str = Field(..., description="Salt PBKDF2 em Base64")
    wrapped_mek: str = Field(..., description="MEK encapsulada em Base64")
    mek_iv: str = Field(..., description="IV do encapsulamento em Base64")


class EncryptionKeyResponse(BaseModel):
    """Schema de resposta com chaves E2EE."""
    salt: str
    wrapped_mek: str
    mek_iv: str


class BillCreate(BaseModel):
    """
    Schema para criação de conta.
    Em modo E2EE, name não é obrigatório (está dentro do blob criptografado).
    """
    name: Optional[str] = None  # Legacy: texto plano
    value: Optional[float] = None  # Legacy: texto plano
    due_date: date
    status: str = "pending"
    # Campos E2EE
    encrypted_data: Optional[str] = None
    encryption_iv: Optional[str] = None


class BillResponse(BaseModel):
    """
    Schema de resposta de conta.
    Inclui tanto campos legacy quanto campos E2EE.
    O frontend decide qual usar baseado em is_encrypted.
    """
    id: PyUUID
    owner_id: PyUUID
    group_id: Optional[PyUUID]
    name: Optional[str]
    value: Optional[float]
    due_date: date
    status: str
    paid_date: Optional[datetime]
    encrypted_data: Optional[str]
    encryption_iv: Optional[str]
    is_encrypted: bool  # True se encrypted_data está presente
    created_at: datetime

    class Config:
        from_attributes = True


# ===========================================================================
# 3. FASTAPI ROUTES (Backend protegido por JWT)
# ===========================================================================

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import os

app = FastAPI(title="ControleFinanceiro API — E2EE")
security = HTTPBearer()

JWT_SECRET = os.environ.get("JWT_SECRET", "minha_chave_super_secreta")
JWT_ALGORITHM = "HS256"


# --- Dependência: Extrair user_id do JWT ---

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> PyUUID:
    """
    Extrai e valida o user_id do token JWT.
    
    SEGURANÇA:
    - Verifica a assinatura do JWT com a chave secreta
    - Extrai o user_id do payload
    - Se o token for inválido ou expirado → HTTP 401
    """
    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
        user_id = payload.get("id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token JWT inválido: user_id ausente",
            )
        return PyUUID(user_id)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token JWT inválido ou expirado",
        )


# --- Dependência: Sessão do banco (placeholder) ---

def get_db():
    """
    Placeholder para a sessão do banco de dados.
    Em produção, use um SessionLocal com yield.
    """
    # from database import SessionLocal
    # db = SessionLocal()
    # try:
    #     yield db
    # finally:
    #     db.close()
    raise NotImplementedError("Configure sua sessão SQLAlchemy aqui")


# ===========================================================================
# ENCRYPTION KEY MANAGEMENT ENDPOINTS
# ===========================================================================

@app.get(
    "/api/encryption/keys",
    response_model=EncryptionKeyResponse,
    summary="Busca chaves E2EE do usuário",
    description="""
    Retorna o salt PBKDF2 e a MEK encapsulada (wrapped) do usuário autenticado.
    O servidor NÃO consegue derivar a MEK — ela é opaca.
    Retorna 404 se o usuário ainda não configurou E2EE (primeiro login).
    """,
)
def get_encryption_keys(
    user_id: PyUUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    keys = db.query(UserEncryptionKey).filter_by(user_id=user_id).first()
    if not keys:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chaves de criptografia não encontradas",
        )
    return keys


@app.post(
    "/api/encryption/setup",
    status_code=status.HTTP_201_CREATED,
    summary="Configura chaves E2EE (primeiro login)",
    description="""
    Salva as chaves de criptografia pela primeira vez.
    Chamado pelo frontend durante o primeiro login após migração para E2EE.
    Retorna 409 se chaves já existem (previne sobrescrita acidental).
    """,
)
def setup_encryption_keys(
    data: EncryptionKeySetup,
    user_id: PyUUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    existing = db.query(UserEncryptionKey).filter_by(user_id=user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Chaves já configuradas. Use PUT para atualizar.",
        )

    keys = UserEncryptionKey(
        user_id=user_id,
        salt=data.salt,
        wrapped_mek=data.wrapped_mek,
        mek_iv=data.mek_iv,
    )
    db.add(keys)
    db.commit()
    return {"success": True, "message": "Chaves de criptografia configuradas"}


@app.put(
    "/api/encryption/keys",
    summary="Atualiza chaves E2EE (troca de senha)",
    description="""
    Atualiza o salt e a MEK encapsulada quando o usuário troca a senha.
    
    FLUXO:
    1. Frontend desencapsula MEK com DEK antiga
    2. Frontend gera novo salt + nova DEK
    3. Frontend re-encapsula MESMA MEK com nova DEK
    4. Este endpoint salva o novo salt + nova wrapped MEK
    
    Resultado: mesma MEK, nova DEK → dados antigos permanecem acessíveis.
    """,
)
def update_encryption_keys(
    data: EncryptionKeySetup,
    user_id: PyUUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    keys = db.query(UserEncryptionKey).filter_by(user_id=user_id).first()
    if not keys:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chaves não encontradas",
        )
    keys.salt = data.salt
    keys.wrapped_mek = data.wrapped_mek
    keys.mek_iv = data.mek_iv
    db.commit()
    return {"success": True, "message": "Chaves atualizadas"}


# ===========================================================================
# BILL ENDPOINTS (com E2EE + Validação de Propriedade)
# ===========================================================================

@app.get(
    "/api/bills",
    response_model=list[BillResponse],
    summary="Lista contas do grupo (com dados E2EE)",
)
def get_bills(
    user_id: PyUUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    # Em produção: group_id viria do header X-Group-ID
):
    bills = db.query(Bill).filter_by(owner_id=user_id).order_by(Bill.due_date).all()
    return [
        BillResponse(
            **bill.__dict__,
            is_encrypted=bill.encrypted_data is not None,
        )
        for bill in bills
    ]


@app.get(
    "/api/bills/{bill_id}",
    response_model=BillResponse,
    summary="Busca conta por ID (com validação de propriedade)",
    description="""
    VALIDAÇÃO DE PROPRIEDADE (Zero-Knowledge Ownership):
    
    Verifica no PostgreSQL se o owner_id da conta é ESTRITAMENTE IGUAL
    ao user_id extraído do token JWT. Se não for → HTTP 403 Forbidden.
    
    Isso garante que um usuário NUNCA pode acessar dados de outro usuário,
    mesmo que conheça o UUID do registro.
    """,
)
def get_bill(
    bill_id: PyUUID,
    user_id: PyUUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    bill = db.query(Bill).filter_by(id=bill_id).first()

    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada",
        )

    # ╔══════════════════════════════════════════════════════════════╗
    # ║  VALIDAÇÃO DE PROPRIEDADE ESTRITA                           ║
    # ║  Se o owner_id do registro ≠ user_id do JWT → 403           ║
    # ║  O servidor verifica ownership sem precisar ver o conteúdo   ║
    # ╚══════════════════════════════════════════════════════════════╝
    if bill.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: você não é o proprietário deste registro",
        )

    return BillResponse(
        **bill.__dict__,
        is_encrypted=bill.encrypted_data is not None,
    )


@app.post(
    "/api/bills",
    response_model=BillResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cria conta com dados E2EE",
    description="""
    Recebe dados criptografados pelo frontend.
    O servidor armazena o blob opaco (encrypted_data) e o IV.
    Ele NUNCA vê o conteúdo (name, value) em texto plano.
    """,
)
def create_bill(
    data: BillCreate,
    user_id: PyUUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    bill = Bill(
        owner_id=user_id,
        name=data.name,
        value=data.value,
        due_date=data.due_date,
        status=data.status,
        encrypted_data=data.encrypted_data,
        encryption_iv=data.encryption_iv,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)

    return BillResponse(
        **bill.__dict__,
        is_encrypted=bill.encrypted_data is not None,
    )


# ===========================================================================
# NOTA FINAL
# ===========================================================================
# 
# Este arquivo demonstra a implementação do BACKEND em Python/FastAPI.
# A criptografia em si (AES-GCM, PBKDF2, derivação de chave) acontece
# 100% no FRONTEND (TypeScript/Web Crypto API).
#
# O backend é propositalmente "burro" em relação ao conteúdo:
# - Recebe blobs criptografados → armazena
# - Retorna blobs criptografados → o frontend descriptografa
# - Valida ownership via JWT user_id vs. owner_id no banco
# - NUNCA tem a chave de criptografia
#
# Isso é a essência do modelo Zero-Knowledge.
# ===========================================================================
