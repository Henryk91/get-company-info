"""Initial schema - create all tables

Revision ID: da8a216bb298
Revises: 
Create Date: 2025-11-30 14:03:02.639314

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'da8a216bb298'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Check if user_id column exists (for existing databases)
    connection = op.get_bind()
    
    # Check if column exists
    inspector = sa.inspect(connection)
    columns = [col['name'] for col in inspector.get_columns('search_queries')]
    column_exists = 'user_id' in columns
    
    if not column_exists:
        # Add column as nullable first (for existing databases with data)
        op.add_column('search_queries', sa.Column('user_id', sa.Integer(), nullable=True))
        
        # Data migration: Assign existing queries to the first user
        result = connection.execute(text("SELECT id FROM users ORDER BY id LIMIT 1"))
        first_user = result.fetchone()
        
        if first_user:
            user_id = first_user[0]
            connection.execute(
                text("UPDATE search_queries SET user_id = :user_id WHERE user_id IS NULL"),
                {"user_id": user_id}
            )
            connection.commit()
    
    # Make column non-nullable and add foreign key
    op.alter_column('search_queries', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.create_foreign_key('fk_search_queries_user_id', 'search_queries', 'users', ['user_id'], ['id'])
    
    # Create index if it doesn't exist
    try:
        op.create_index('ix_search_queries_user_id', 'search_queries', ['user_id'])
    except Exception:
        # Index might already exist
        pass


def downgrade() -> None:
    """Downgrade schema."""
    # Remove foreign key and index
    op.drop_constraint('fk_search_queries_user_id', 'search_queries', type_='foreignkey')
    try:
        op.drop_index('ix_search_queries_user_id', table_name='search_queries')
    except Exception:
        pass
    
    # Make column nullable (but don't remove it to preserve data)
    op.alter_column('search_queries', 'user_id',
               existing_type=sa.INTEGER(),
               nullable=True)
