#!/bin/bash
# Database migration script using Alembic
# This script helps manage database migrations

set -e

cd "$(dirname "$0")"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

case "$1" in
    init)
        echo "Initializing database with Alembic..."
        alembic upgrade head
        ;;
    create)
        if [ -z "$2" ]; then
            echo "Usage: $0 create <migration_message>"
            echo "Example: $0 create 'add_user_id_to_search_queries'"
            exit 1
        fi
        echo "Creating new migration: $2"
        alembic revision --autogenerate -m "$2"
        ;;
    migrate)
        echo "Running migrations..."
        alembic upgrade head
        ;;
    downgrade)
        if [ -z "$2" ]; then
            echo "Usage: $0 downgrade <revision>"
            echo "Example: $0 downgrade -1  (downgrade one revision)"
            echo "Example: $0 downgrade base  (downgrade all)"
            exit 1
        fi
        echo "Downgrading to: $2"
        alembic downgrade "$2"
        ;;
    current)
        echo "Current database revision:"
        alembic current
        ;;
    history)
        echo "Migration history:"
        alembic history
        ;;
    *)
        echo "Alembic Database Migration Helper"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  init                    - Initialize database (run all migrations)"
        echo "  create <message>        - Create a new migration from model changes"
        echo "  migrate                 - Run all pending migrations"
        echo "  downgrade <revision>    - Downgrade database (use -1 for one step, 'base' for all)"
        echo "  current                 - Show current database revision"
        echo "  history                 - Show migration history"
        echo ""
        echo "Examples:"
        echo "  $0 init                 # Initialize new database"
        echo "  $0 create 'add_user_id' # Create migration for model changes"
        echo "  $0 migrate              # Apply pending migrations"
        echo "  $0 downgrade -1         # Rollback last migration"
        exit 1
        ;;
esac

