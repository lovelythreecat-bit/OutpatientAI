"""通过Python导入SQL脚本"""
import pymysql
from pathlib import Path

SQL_FILE = Path(__file__).parent.parent / "sql" / "db_ai_medical.sql"


def import_sql():
    """执行SQL文件"""
    conn = pymysql.connect(
        host="127.0.0.1", port=3308, user="root", password="123456", charset="utf8mb4"
    )
    cursor = conn.cursor()
    sql_content = SQL_FILE.read_text(encoding="utf-8")
    # 按分号分割执行（跳过注释行）
    statements = []
    current = []
    for line in sql_content.split("\n"):
        stripped = line.strip()
        if stripped.startswith("--") or not stripped:
            continue
        current.append(line)
        if stripped.endswith(";"):
            statements.append("\n".join(current))
            current = []

    for stmt in statements:
        stmt = stmt.strip()
        if stmt:
            try:
                cursor.execute(stmt)
            except Exception as e:
                if "already exists" not in str(e).lower():
                    print(f"Warning: {e}")
    conn.commit()
    cursor.close()
    conn.close()
    print("SQL导入完成！")


if __name__ == "__main__":
    import_sql()
