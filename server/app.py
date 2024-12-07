import os
import sys
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.document_loaders import PyPDFLoader, UnstructuredEPubLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
from langchain_core.documents import Document
from pydantic import BaseModel
from dotenv import load_dotenv
from logger_config import setup_logger

# 设置日志记录器
logger = setup_logger('app')

# 加载环境变量
load_dotenv()

# 设置目录
UPLOAD_DIRECTORY = os.path.join(os.path.dirname(__file__), "uploads")
PERSIST_DIRECTORY = os.path.join(os.path.dirname(__file__), "db")
ALLOWED_EXTENSIONS = {'.pdf', '.epub'}

# 创建FastAPI应用
app = FastAPI(
    title="智能文档问答系统",
    description="支持PDF和EPUB格式的智能文档问答系统",
    version="1.0.0"
)

# 添加 CORS 支持
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 开发服务器
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 确保目录存在
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(PERSIST_DIRECTORY, exist_ok=True)

# 初始化组件
embeddings = OpenAIEmbeddings()
vectordb = Chroma(persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings)
llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo")
query_engine = None  # 将在启动时初始化

def get_document_loader(file_path: str):
    """根据文件扩展名选择合适的文档加载器"""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return PyPDFLoader(file_path)
    elif ext == '.epub':
        return UnstructuredEPubLoader(file_path)
    else:
        raise ValueError(f"不支持的文件格式: {ext}")

@app.on_event("startup")
async def startup_event():
    """启动事件"""
    try:
        # 检查必要的环境变量
        if not os.getenv("OPENAI_API_KEY"):
            logger.error("OPENAI_API_KEY not found in environment variables")
            sys.exit(1)
            
        logger.info("Starting application...")
        
        # 导入和初始化查询引擎
        from advanced_query import AdvancedQueryEngine
        global query_engine
        query_engine = AdvancedQueryEngine(
            vectordb=vectordb,
            llm=llm,
            similarity_threshold=0.8  # 设置相似度阈值为80%
        )
        
        # 只在有文档且关键词为空时更新关键词库
        docs = vectordb.get()
        if docs.get('documents', []) and not query_engine.keywords:
            logger.info("Found documents in database, updating keywords...")
            await query_engine.update_keywords_from_docs()
        else:
            logger.info("No documents found or keywords already exist, skipping keyword update")
        
        logger.info("Application started successfully")
        
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """关闭事件"""
    try:
        logger.info("Shutting down application...")
        
        # 清理全局变量
        global vectordb, query_engine, llm
        
        # 关闭向量数据库连接
        if vectordb:
            try:
                # 新版本的 Chroma 会自动持久化数据
                vectordb._client.reset()
                logger.info("Vector database connection closed")
            except Exception as e:
                logger.error(f"Error closing vector database connection: {str(e)}")
        
        # 清理查询引擎
        if query_engine:
            query_engine = None
        
        # 清理 LLM
        if llm:
            llm = None
            
        logger.info("Application shutdown complete")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")
        raise

class QueryRequest(BaseModel):
    query: str

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """上传文件到知识库"""
    try:
        # 检查文件扩展名
        if not file.filename:
            error_msg = "未提供文件名"
            logger.error(error_msg)
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )
            
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            error_msg = f"不支持的文件格式。支持的格式：{', '.join(ALLOWED_EXTENSIONS)}"
            logger.error(f"{error_msg} - 文件名: {file.filename}")
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )
        
        # 保存文件
        file_path = os.path.join(UPLOAD_DIRECTORY, file.filename)
        try:
            content = await file.read()
            if not content:
                error_msg = "文件内容为空"
                logger.error(f"{error_msg} - 文件名: {file.filename}")
                raise HTTPException(
                    status_code=400,
                    detail=error_msg
                )
                
            with open(file_path, "wb") as buffer:
                buffer.write(content)
                
            logger.info(f"File saved successfully: {file_path}")
            
        except Exception as e:
            error_msg = f"保存文件时出错: {str(e)}"
            logger.error(f"{error_msg} - 文件名: {file.filename}")
            raise HTTPException(
                status_code=500,
                detail=error_msg
            )
        
        try:
            # 加载文档
            loader = get_document_loader(file_path)
            documents = loader.load()
            
            if not documents:
                error_msg = "无法从文件中提取内容"
                logger.error(f"{error_msg} - 文件名: {file.filename}")
                raise HTTPException(
                    status_code=400,
                    detail=error_msg
                )
                
            logger.info(f"Loaded {len(documents)} documents from {file.filename}")
            
            # 分割文档
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len
            )
            texts = text_splitter.split_documents(documents)
            
            if not texts:
                error_msg = "文档分割后没有内容"
                logger.error(f"{error_msg} - 文件名: {file.filename}")
                raise HTTPException(
                    status_code=400,
                    detail=error_msg
                )
                
            logger.info(f"Split into {len(texts)} chunks")
            
            # 添加到向量数据库
            vectordb.add_documents(texts)
            logger.info("Documents added to vector store")
            
            # 更新关键词库
            await query_engine.update_keywords_from_docs()
            logger.info("Keywords updated")
            
            return {"message": "文档已成功上传并处理", "filename": file.filename}
            
        except HTTPException:
            raise
        except Exception as e:
            error_msg = f"处理文档时出错: {str(e)}"
            logger.error(f"{error_msg} - 文件名: {file.filename}")
            raise HTTPException(
                status_code=500,
                detail=error_msg
            )
            
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"服务器内部错误: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )

@app.post("/query")
async def query_documents(query: QueryRequest):
    """查询知识库并获取回答"""
    try:
        logger.info(f"Received query: {query.query}")
        result = await query_engine.smart_query(query.query)
        logger.info("Query processed successfully")
        return {
            "answer": result.answer,
            "source_type": result.source_type,
            "confidence": result.confidence,
            "has_source_documents": len(result.source_documents) > 0,
            "source_documents": result.source_documents if result.source_documents else None
        }
    except Exception as e:
        error_msg = f"查询处理出错: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )

@app.post("/query/components")
async def query_with_components(query: QueryRequest):
    """组件感知查询"""
    result = await query_engine.component_aware_search(query.query)
    return {
        "answer": result.answer,
        "source_type": result.source_type,
        "confidence": result.confidence,
        "has_source_documents": len(result.source_documents) > 0,
        "source_documents": result.source_documents if result.source_documents else None,
        "matched_components": [
            {
                "name": comp.name,
                "description": comp.description
            } for comp in result.matched_components
        ] if result.matched_components else None
    }

@app.get("/keywords")
async def get_keywords():
    """获取当前的关键词列表"""
    try:
        if not query_engine:
            raise HTTPException(status_code=500, detail="Query engine not initialized")
        
        keywords = await query_engine.get_current_keywords()
        return {
            "total_keywords": len(keywords),
            "keywords": keywords
        }
    except Exception as e:
        logger.error(f"Error getting keywords: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
