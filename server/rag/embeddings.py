"""嵌入模型封装 - OpenAI 兼容 /v1/embeddings"""
from typing import List
from openai import OpenAI
from langchain_core.embeddings import Embeddings
from core.config import settings


class CompatibleEmbeddings(Embeddings):
    """OpenAI 兼容嵌入模型（与对话模型可使用不同地址/Key）"""

    def __init__(self):
        self.client = OpenAI(
            api_key=settings.embedding_api_key,
            base_url=settings.embedding_base_url,
        )
        self.model = settings.embedding_model
        self.dimensions = settings.embedding_dimensions
        self.batch_size = settings.embedding_batch_size

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        批量嵌入文档（分批处理，每批最多10条）
        :param texts: 文本列表
        :return: 向量列表
        """
        all_embeddings = []
        # 过滤空文本
        valid_texts = [t if t and t.strip() else " " for t in texts]
        for i in range(0, len(valid_texts), self.batch_size):
            batch = valid_texts[i:i + self.batch_size]
            response = self.client.embeddings.create(
                model=self.model,
                input=batch,
                dimensions=self.dimensions,
            )
            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)
        return all_embeddings

    def embed_query(self, text: str) -> List[float]:
        """
        嵌入单条查询文本
        :param text: 查询文本
        :return: 向量
        """
        response = self.client.embeddings.create(
            model=self.model,
            input=text if text and text.strip() else " ",
            dimensions=self.dimensions,
        )
        return response.data[0].embedding


def get_embeddings() -> Embeddings:
    """获取嵌入模型实例"""
    return CompatibleEmbeddings()
