# ===========================================
# ABS Development Container
# Node.js 20 + pnpm + Development Tools
# ===========================================

FROM node:20-bookworm

# Labels
LABEL maintainer="ABS Development Team"
LABEL description="AutoBuilder Suite Development Environment"

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# ===========================================
# Install System Dependencies
# ===========================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Essential tools
    git \
    curl \
    wget \
    gnupg2 \
    ca-certificates \
    # Shell & editors
    zsh \
    vim \
    nano \
    # Build tools (for native modules)
    build-essential \
    python3 \
    # Database clients
    postgresql-client \
    # Utilities
    jq \
    htop \
    tree \
    unzip \
    zip \
    # SSL/TLS
    openssl \
    # Process management
    procps \
    # Locales
    locales \
    && rm -rf /var/lib/apt/lists/*

# Set up locales
RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# ===========================================
# Install pnpm
# ===========================================
ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable && corepack prepare pnpm@9.14.4 --activate

# ===========================================
# Install Oh My Zsh for better terminal
# ===========================================
USER node
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Configure zsh
RUN echo 'export PNPM_HOME="/home/node/.local/share/pnpm"' >> /home/node/.zshrc && \
    echo 'export PATH="${PNPM_HOME}:${PATH}"' >> /home/node/.zshrc && \
    echo 'alias ll="ls -la"' >> /home/node/.zshrc && \
    echo 'alias ws="cd /workspace/autobuilder-suite/builder/webstudio"' >> /home/node/.zshrc && \
    echo 'alias cms="cd /workspace/cms"' >> /home/node/.zshrc && \
    echo 'alias dev="pnpm dev"' >> /home/node/.zshrc

# ===========================================
# Set up workspace
# ===========================================
USER root
RUN mkdir -p /workspace && chown -R node:node /workspace

# Create pnpm store directory
RUN mkdir -p /home/node/.local/share/pnpm/store && \
    chown -R node:node /home/node/.local

WORKDIR /workspace

# Switch to non-root user
USER node

# Default shell
ENV SHELL=/bin/zsh

# Keep container running
CMD ["sleep", "infinity"]
