.PHONY: frontend-install backend-install install frontend-dev backend-dev dev frontend-lint backend-lint lint frontend-test backend-test test

frontend-install:
	cd frontend && npm install

backend-install:
	cd backend && python -m pip install -e .[dev]

install: frontend-install backend-install

frontend-dev:
	cd frontend && npm run dev

backend-dev:
	cd backend && uvicorn app.main:app --reload

dev:
	@echo "Run 'make frontend-dev' and 'make backend-dev' in separate terminals."

frontend-lint:
	cd frontend && npm run lint

backend-lint:
	cd backend && python -m compileall app

lint: frontend-lint backend-lint

frontend-test:
	cd frontend && npm run test

backend-test:
	cd backend && pytest

test: frontend-test backend-test
