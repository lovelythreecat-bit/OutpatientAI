"""核心配置模块 - 集中管理项目配置"""
from pathlib import Path

# 项目根目录
BASE_DIR = Path(__file__).resolve().parent.parent

# 项目名称
PROJECT_NAME = "AI智能医疗问诊平台系统"

# MySQL数据库配置
MYSQL_HOST = "127.0.0.1"
MYSQL_PORT = 3306
MYSQL_USER = "root"
MYSQL_PASSWORD = "change-me"
MYSQL_DATABASE = "db_ai_medical"
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"

# Neo4j知识图谱配置
NEO4J_URI = "bolt://127.0.0.1:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "change-me"

# 对话模型：官方 DeepSeek V4（无 embedding 接口）
LLM_API_KEY = ""
LLM_BASE_URL = "https://api.deepseek.com"
LLM_MODEL = "deepseek-v4-flash"

# 向量化
EMBEDDING_API_KEY = ""
EMBEDDING_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
EMBEDDING_MODEL = "text-embedding-v4"
EMBEDDING_DIMENSIONS = 1024
EMBEDDING_BATCH_SIZE = 10

# 兼容旧字段名（指向对话配置）
OPENAI_API_KEY = LLM_API_KEY
OPENAI_BASE_URL = LLM_BASE_URL

# 文件上传目录
UPLOAD_DIR = "F:/uploads33"

# Chroma向量数据库目录
CHROMA_PERSIST_DIR = str(BASE_DIR / "chroma_db")
CHROMA_COLLECTION = "medical_knowledge"

# JWT配置
JWT_SECRET_KEY = "replace-with-a-long-random-secret"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24  # 24小时

# RAG配置
CHUNK_SIZE = 500
CHUNK_OVERLAP = 80
RETRIEVAL_TOP_K = 5

# 启动时检查API Key
if not LLM_API_KEY or "这里填" in LLM_API_KEY:
    print("[警告] 请在 config.py 填写 LLM_API_KEY（DeepSeek 官方 Key），问诊对话不可用")
if not EMBEDDING_API_KEY or "这里填" in EMBEDDING_API_KEY:
    print("[警告] 请在 config.py 填写 EMBEDDING_API_KEY（中转站 Key），知识库向量化不可用")


class Settings:
    """配置类 - 统一访问入口"""

    project_name: str = PROJECT_NAME
    database_url: str = DATABASE_URL
    neo4j_uri: str = NEO4J_URI
    neo4j_user: str = NEO4J_USER
    neo4j_password: str = NEO4J_PASSWORD
    openai_api_key: str = OPENAI_API_KEY
    openai_base_url: str = OPENAI_BASE_URL
    llm_api_key: str = LLM_API_KEY
    llm_base_url: str = LLM_BASE_URL
    llm_model: str = LLM_MODEL
    embedding_api_key: str = EMBEDDING_API_KEY
    embedding_base_url: str = EMBEDDING_BASE_URL
    embedding_model: str = EMBEDDING_MODEL
    embedding_dimensions: int = EMBEDDING_DIMENSIONS
    embedding_batch_size: int = EMBEDDING_BATCH_SIZE
    upload_dir: str = UPLOAD_DIR
    chroma_persist_dir: str = CHROMA_PERSIST_DIR
    chroma_collection: str = CHROMA_COLLECTION
    jwt_secret_key: str = JWT_SECRET_KEY
    jwt_algorithm: str = JWT_ALGORITHM
    jwt_expire_minutes: int = JWT_EXPIRE_MINUTES
    chunk_size: int = CHUNK_SIZE
    chunk_overlap: int = CHUNK_OVERLAP
    retrieval_top_k: int = RETRIEVAL_TOP_K


settings = Settings()
