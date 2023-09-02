PROJECT = node-typescript-monorepo-template

COMPOSE_FILE = ./docker-compose.yml
COMPOSE = docker compose -p $(PROJECT) -f $(COMPOSE_FILE)

MAKEFLAGS += --no-print-directory

.PHONY: soft-prune check-service check-valid-service logs down build run dev prod

############## DOCKER PRUNING ##########

# Removes dangling images and containers.
soft-prune:
	docker image prune -f && \
	docker container prune -f

###### UTILITIES ##########

check-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "Error: The SERVICE variable is missing. Please provide a valid service name or a subset of services that share a common suffix."; \
		echo "Available services:"; \
		$(COMPOSE) config --services; \
		exit 1; \
	fi

check-valid-service:
	@if ! $(COMPOSE) config --services | grep -qE "$(SERVICE)$$"; then \
		echo "Warning: No valid service found for SERVICE=$(SERVICE). Please check that the service is valid."; \
		echo "Available services:"; \
		$(COMPOSE) config --services; \
		exit 1; \
	fi

########## MANAGEMENT ##########

logs:
	$(COMPOSE) logs -f $(SERVICE)

down:
	$(COMPOSE) down --remove-orphans $(shell $(COMPOSE) config --services | grep -vE "dev-container")
# Remove all docker volumes that end with `-ephemeral`
	-docker volume rm $(shell docker volume ls -q | grep -E "$(PROJECT)_.*\-ephemeral$$")

build:
	$(COMPOSE) build $(shell $(COMPOSE) config --services | grep -E "($(SERVICE)|common)$$")

########## LAUNCH ##########

run: soft-prune check-service check-valid-service build down
	$(COMPOSE) up -d $(shell $(COMPOSE) config --services | grep -E "($(SERVICE)|common)$$")

dev:
	$(MAKE) run SERVICE=dev

prod:
	$(MAKE) run SERVICE=prod
