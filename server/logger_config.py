import logging
import logging.handlers
import os
from datetime import datetime

def setup_logger(name='app'):
    # 创建日志目录（如果不存在）
    log_dir = os.path.join(os.path.dirname(__file__), 'log')
    os.makedirs(log_dir, exist_ok=True)

    # 创建logger
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    # 防止重复添加handler
    if logger.handlers:
        return logger

    # 创建文件处理器 - 按天滚动日志文件
    log_file = os.path.join(log_dir, f'{name}.log')
    file_handler = logging.handlers.TimedRotatingFileHandler(
        log_file,
        when='midnight',
        interval=1,
        backupCount=30,  # 保留30天的日志
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)

    # 创建控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # 创建格式器
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    # 添加处理器到logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger
