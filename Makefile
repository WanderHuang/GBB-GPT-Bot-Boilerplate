.PHONY: install-server install-frontend install start-server start-frontend start check-python check-node update-server-deps check-token-usage

# 默认配置
FRONTEND_PORT ?= 3000

# 检查依赖
check-python:
	@which python3 > /dev/null || (echo "Python3 is not installed. Please install Python3 first." && exit 1)
	@python3 -m pip --version > /dev/null 2>&1 || (echo "Installing pip..." && curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py && python3 get-pip.py && rm get-pip.py)

check-node:
	@which node > /dev/null || (echo "Node.js is not installed. Please install Node.js first." && exit 1)
	@which npm > /dev/null || (echo "npm is not installed. Please install npm first." && exit 1)

# 检查环境文件
check-frontend-env:
	@if [ ! -f frontend/.env ]; then \
		echo "Creating frontend/.env from example..."; \
		cp frontend/.env.example frontend/.env; \
	fi

# 检查 OpenAI token 使用情况
check-token-usage:
	@echo "Checking OpenAI API token usage..."
	@cd server && python3 check_usage.py

# 更新服务器依赖
update-server-deps: check-python
	@echo "Updating server dependencies..."
	cd server && python3 -m pip install -r requirements.txt

# 安装依赖
install-server: check-python
	@echo "Installing server dependencies..."
	cd server && python3 -m pip install -r requirements.txt

install-frontend: check-node check-frontend-env
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

install: install-server install-frontend

# 启动服务
start-server: check-python
	@echo "Starting server..."
	cd server && python3 app.py

start-frontend: check-node check-frontend-env
	@echo "Starting frontend on port $(FRONTEND_PORT)..."
	cd frontend && PORT=$(FRONTEND_PORT) npm start

# 同时启动前后端（使用后台进程）
start: check-python check-node check-frontend-env
	@echo "Starting server and frontend..."
	@mkdir -p frontend/log
	@trap 'make stop' INT TERM EXIT; \
	(cd server && python3 app.py & echo $$! > server.pid); \
	echo "Waiting for server to start..."; \
	sleep 2; \
	(cd frontend && echo "Starting frontend..." && \
	PORT=$(FRONTEND_PORT) npm start & echo $$! > frontend.pid) || \
	(echo "Failed to start frontend. Check frontend/log/frontend.log for details" && exit 1); \
	wait

# 停止服务
stop:
	@if [ -f frontend/frontend.pid ]; then \
		echo "Stopping frontend..."; \
		kill `cat frontend/frontend.pid` 2>/dev/null || true; \
		rm frontend/frontend.pid; \
	fi
	@if [ -f server/server.pid ]; then \
		echo "Stopping server..."; \
		kill -TERM `cat server/server.pid` 2>/dev/null || true; \
		sleep 2; \
		kill -9 `cat server/server.pid` 2>/dev/null || true; \
		rm server/server.pid; \
	fi
