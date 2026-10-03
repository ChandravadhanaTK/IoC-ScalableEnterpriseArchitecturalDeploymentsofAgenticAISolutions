import sqlite3
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, db_path="chatbot.db"):
        self.db_path = db_path
        self.connection = None
        
    def connect(self):
        try:
            self.connection = sqlite3.connect(self.db_path, check_same_thread=False)
            self.connection.row_factory = sqlite3.Row  # This enables column access by name
            logger.info(f"Successfully connected to SQLite database: {self.db_path}")
            self.create_tables()
        except Exception as e:
            logger.error(f"Error while connecting to SQLite: {e}")
            
    def create_tables(self):
        try:
            cursor = self.connection.cursor()
            
            # Create users table
            create_users_table = """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
            
            # Create conversations table
            create_conversations_table = """
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
            
            # Create messages table
            create_messages_table = """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER,
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            )
            """
            
            # Create documents table for RAG
            create_documents_table = """
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                chunk_count INTEGER DEFAULT 0,
                is_global INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """

            cursor.execute(create_users_table)
            cursor.execute(create_conversations_table)
            cursor.execute(create_messages_table)
            cursor.execute(create_documents_table)
            self.connection.commit()
            logger.info("SQLite tables created successfully")
            
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            
    def save_message(self, conversation_id: int, role: str, content: str):
        try:
            cursor = self.connection.cursor()
            query = "INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)"
            cursor.execute(query, (conversation_id, role, content))
            self.connection.commit()
            return cursor.lastrowid
        except Exception as e:
            logger.error(f"Error saving message: {e}")
            return None
            
    def create_conversation(self, user_id: int):
        try:
            cursor = self.connection.cursor()
            query = "INSERT INTO conversations (user_id) VALUES (?)"
            cursor.execute(query, (user_id,))
            self.connection.commit()
            return cursor.lastrowid
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            return None
            
    def get_conversation_history(self, conversation_id: int):
        try:
            cursor = self.connection.cursor()
            query = """
            SELECT role, content FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at ASC
            """
            cursor.execute(query, (conversation_id,))
            return cursor.fetchall()
        except Exception as e:
            logger.error(f"Error fetching conversation history: {e}")
            return []
    
    def get_all_conversations(self, user_id: int):
        try:
            cursor = self.connection.cursor()
            query = """
            SELECT c.id, c.user_id, c.created_at,
                   COUNT(m.id) as message_count,
                   MAX(m.created_at) as last_message_at,
                   SUBSTR(MIN(CASE WHEN m.role = 'user' THEN m.content END), 1, 100) as preview
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id
            WHERE c.user_id = ?
            GROUP BY c.id, c.user_id, c.created_at
            ORDER BY COALESCE(MAX(m.created_at), c.created_at) DESC
            """
            cursor.execute(query, (user_id,))
            return cursor.fetchall()
        except Exception as e:
            logger.error(f"Error fetching all conversations: {e}")
            return []
    
    def get_conversation_with_messages(self, conversation_id: int):
        try:
            cursor = self.connection.cursor()
            
            # Get conversation details
            conv_query = """
            SELECT id, user_id, created_at FROM conversations WHERE id = ?
            """
            cursor.execute(conv_query, (conversation_id,))
            conversation = cursor.fetchone()
            
            if not conversation:
                return None
            
            # Get all messages for this conversation
            messages_query = """
            SELECT id, role, content, created_at FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at ASC
            """
            cursor.execute(messages_query, (conversation_id,))
            messages = cursor.fetchall()
            
            return {
                'conversation': dict(conversation),
                'messages': [dict(msg) for msg in messages]
            }
        except Exception as e:
            logger.error(f"Error fetching conversation with messages: {e}")
            return None
    
    def delete_conversation(self, conversation_id: int):
        try:
            cursor = self.connection.cursor()
            
            # Delete all messages for this conversation first
            delete_messages_query = "DELETE FROM messages WHERE conversation_id = ?"
            cursor.execute(delete_messages_query, (conversation_id,))
            
            # Delete the conversation
            delete_conversation_query = "DELETE FROM conversations WHERE id = ?"
            cursor.execute(delete_conversation_query, (conversation_id,))
            
            self.connection.commit()
            
            # Return the number of rows affected
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            return False
    
    # User authentication methods
    def create_user(self, username: str, email: str, password_hash: str):
        """
        Create a new user in the database
        
        Args:
            username: Unique username for the user
            email: Unique email address for the user
            password_hash: Hashed password for security
            
        Returns:
            int: User ID if successful, None if failed
        """
        try:
            cursor = self.connection.cursor()
            query = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)"
            cursor.execute(query, (username, email, password_hash))
            self.connection.commit()
            return cursor.lastrowid
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            return None
    
    def get_user_by_username(self, username: str):
        """
        Retrieve user by username
        
        Args:
            username: Username to search for
            
        Returns:
            dict: User data if found, None if not found
        """
        try:
            cursor = self.connection.cursor()
            query = "SELECT id, username, email, password_hash, created_at FROM users WHERE username = ?"
            cursor.execute(query, (username,))
            result = cursor.fetchone()
            return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error fetching user by username: {e}")
            return None
    
    def get_user_by_email(self, email: str):
        """
        Retrieve user by email
        
        Args:
            email: Email to search for
            
        Returns:
            dict: User data if found, None if not found
        """
        try:
            cursor = self.connection.cursor()
            query = "SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?"
            cursor.execute(query, (email,))
            result = cursor.fetchone()
            return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error fetching user by email: {e}")
            return None
    
    def get_user_by_id(self, user_id: int):
        """
        Retrieve user by ID
        
        Args:
            user_id: User ID to search for
            
        Returns:
            dict: User data if found, None if not found
        """
        try:
            cursor = self.connection.cursor()
            query = "SELECT id, username, email, created_at FROM users WHERE id = ?"
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error fetching user by ID: {e}")
            return None
            
    # Document methods for RAG

    def create_document(self, user_id: int, filename: str, file_type: str, chunk_count: int, is_global: bool):
        try:
            cursor = self.connection.cursor()
            cursor.execute(
                "INSERT INTO documents (user_id, filename, file_type, chunk_count, is_global) VALUES (?, ?, ?, ?, ?)",
                (user_id, filename, file_type, chunk_count, 1 if is_global else 0),
            )
            self.connection.commit()
            return cursor.lastrowid
        except Exception as e:
            logger.error(f"Error creating document: {e}")
            return None

    def get_documents(self, user_id: int):
        try:
            cursor = self.connection.cursor()
            cursor.execute(
                """SELECT id, user_id, filename, file_type, chunk_count, is_global, created_at
                   FROM documents
                   WHERE user_id = ? OR is_global = 1
                   ORDER BY created_at DESC""",
                (user_id,),
            )
            return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error fetching documents: {e}")
            return []

    def get_document_by_id(self, doc_id: int):
        try:
            cursor = self.connection.cursor()
            cursor.execute(
                "SELECT id, user_id, filename, file_type, chunk_count, is_global FROM documents WHERE id = ?",
                (doc_id,),
            )
            row = cursor.fetchone()
            return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error fetching document {doc_id}: {e}")
            return None

    def delete_document(self, doc_id: int):
        try:
            cursor = self.connection.cursor()
            cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
            self.connection.commit()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting document {doc_id}: {e}")
            return False

    def close(self):
        if self.connection:
            self.connection.close()
            logger.info("SQLite connection closed")

db_manager = DatabaseManager()
