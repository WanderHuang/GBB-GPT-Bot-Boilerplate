from typing import List, Optional
from pydantic import BaseModel
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI
from langchain_chroma import Chroma
from langchain_core.messages import HumanMessage
from langchain.text_splitter import RecursiveCharacterTextSplitter
import numpy as np
from sentence_transformers import SentenceTransformer
from logger_config import setup_logger

# 设置日志记录器
logger = setup_logger('query_engine')

class QueryResult(BaseModel):
    answer: str
    source_documents: List[str]
    confidence: float
    source_type: str  # "document", "llm", or "hybrid"

class AdvancedQueryEngine:
    def __init__(
        self,
        vectordb: Chroma,
        llm: ChatOpenAI,
        similarity_threshold: float = 0.8,
    ):
        self.vectordb = vectordb
        self.llm = llm
        self.similarity_threshold = similarity_threshold
        self.keywords = []  # 存储关键词列表
        self.keyword_embeddings = []  # 存储关键词的向量表示
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')  # 用于计算文本相似度
        
    async def extract_keywords(self, text: str) -> List[str]:
        """从文本中提取关键词"""
        # 使用文本分割器将文本分成更小的块
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=4000,  # 每块约4000字符
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(text)
        logger.info(f"Split text into {len(chunks)} chunks for keyword extraction")
        
        all_keywords = set()  # 使用集合来去重
        
        for i, chunk in enumerate(chunks, 1):
            try:
                # 对每个块提取关键词
                messages = [
                    HumanMessage(content=f"""
                    请从以下文本中提取10-15个最重要的关键词或短语。
                    这些关键词应该能够概括文本的主要内容。
                    只需要返回关键词列表，每行一个关键词，不要有任何其他说明或标点符号。
                    
                    文本内容：
                    {chunk}
                    """)
                ]
                
                response = await self.llm.ainvoke(messages)
                keywords = response.content.strip().split('\n')
                all_keywords.update(keywords)  # 添加到集合中
                logger.info(f"Processed chunk {i}/{len(chunks)}, extracted {len(keywords)} keywords")
                
            except Exception as e:
                logger.error(f"Error processing chunk {i}/{len(chunks)}: {str(e)}")
                continue
        
        # 将集合转换回列表并返回
        final_keywords = list(all_keywords)
        logger.info(f"Total unique keywords extracted: {len(final_keywords)}")
        return final_keywords

    async def update_keywords_from_docs(self):
        """从向量数据库中的所有文档更新关键词库"""
        try:
            # 获取所有文档
            results = self.vectordb.get()
            
            # 确保我们有文档内容
            if not results or "documents" not in results or not results["documents"]:
                logger.warning("No documents found in the vector store")
                self.keywords = []
                self.keyword_embeddings = []
                return
            
            # 合并所有文档内容
            # 检查文档类型并相应地处理
            if isinstance(results["documents"][0], str):
                all_text = " ".join(results["documents"])
                logger.info("Processing string documents")
            else:
                all_text = " ".join(doc.page_content for doc in results["documents"])
                logger.info("Processing Document objects")
            
            # 提取关键词
            try:
                self.keywords = await self.extract_keywords(all_text)
                logger.info(f"Extracted {len(self.keywords)} keywords")
                
                # 计算关键词的向量表示
                if self.keywords:
                    self.keyword_embeddings = self.encoder.encode(self.keywords)
                    logger.info("Keyword embeddings updated")
                else:
                    logger.warning("No keywords extracted")
                    self.keyword_embeddings = []
                    
            except Exception as e:
                logger.error(f"Error extracting keywords: {str(e)}")
                self.keywords = []
                self.keyword_embeddings = []
                
        except Exception as e:
            logger.error(f"Error updating keywords from docs: {str(e)}")
            self.keywords = []
            self.keyword_embeddings = []
            raise

    async def get_current_keywords(self) -> List[str]:
        """获取当前的关键词列表"""
        return self.keywords

    def calculate_query_similarity(self, query: str) -> float:
        """计算查询与关键词的最大相似度"""
        if not self.keywords:
            logger.warning("No keywords available for similarity calculation")
            return 0.0
            
        try:
            # 计算查询的向量表示
            query_embedding = self.encoder.encode([query])[0]
            
            # 计算与所有关键词的相似度
            similarities = np.dot(self.keyword_embeddings, query_embedding)
            max_similarity = float(np.max(similarities))
            
            logger.info(f"Query similarity score: {max_similarity:.4f}")
            return max_similarity
            
        except Exception as e:
            logger.error(f"Error calculating query similarity: {str(e)}")
            return 0.0

    async def smart_query(self, query: str) -> QueryResult:
        """智能查询：根据相似度决定使用文档还是LLM"""
        try:
            # 计算查询与关键词的相似度
            similarity = self.calculate_query_similarity(query)
            logger.info(f"Query: '{query}' - Similarity: {similarity:.4f}")
            
            if similarity >= self.similarity_threshold:
                # 相似度高，优先使用文档
                docs = self.vectordb.similarity_search_with_score(query, k=3)
                
                if docs:
                    best_doc, best_score = docs[0]
                    if best_score >= self.similarity_threshold:
                        # 文档匹配度高，直接使用文档内容
                        return QueryResult(
                            answer=best_doc.page_content,
                            source_documents=[doc.page_content for doc, _ in docs],
                            confidence=best_score,
                            source_type="document"
                        )
                    else:
                        # 文档匹配度不够，使用混合模式
                        context = "\n".join([doc.page_content for doc, _ in docs[:2]])
                        prompt = """基于以下文档内容回答用户问题。如果内容与问题不够相关，请说明无法从文档中找到相关信息。

                        文档内容：
                        {context}

                        用户问题：{query}"""
                        
                        response = await self.llm.ainvoke([HumanMessage(content=prompt.format(
                            context=context,
                            query=query
                        ))])
                        
                        return QueryResult(
                            answer=response.content,
                            source_documents=[doc.page_content for doc, _ in docs],
                            confidence=similarity,
                            source_type="hybrid"
                        )
            
            # 相似度低，直接使用LLM
            response = await self.llm.ainvoke([HumanMessage(content=query)])
            return QueryResult(
                answer=response.content,
                source_documents=[],
                confidence=1.0,
                source_type="llm"
            )
            
        except Exception as e:
            logger.error(f"Smart query error: {str(e)}")
            raise
