#!/usr/bin/env python3
"""
Biblioteca Database Integration
-------------------------------
This script demonstrates connecting to the Biblioteca database
and performing various operations using PostgreSQL and psycopg2.

Usage:
    1. Start the database: docker-compose up -d
    2. Run this script: python biblioteca_db.py
"""

import sys
from datetime import datetime, timedelta

import psycopg2
from psycopg2.extras import RealDictCursor


def connect_to_db():
    """Connect to the PostgreSQL database server"""
    conn = None
    try:
        # Connect to the PostgreSQL server
        print("Connecting to the PostgreSQL database...")
        conn = psycopg2.connect(
            host="localhost",
            database="biblioteca",
            user="biblioteca",
            password="biblioteca123",
            port="5432",
        )

        # Create a cursor
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Execute a test query
        print("PostgreSQL database version:")
        cur.execute("SELECT version()")

        # Display the PostgreSQL database server version
        db_version = cur.fetchone()
        print(db_version["version"])

        # Close the communication with the PostgreSQL
        cur.close()
        return conn
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error: {error}")
        sys.exit(1)


def list_all_tables(conn):
    """List all tables in the current database"""
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Query to list all tables in the public schema
        cur.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """
        )

        # Fetch all rows
        rows = cur.fetchall()

        if rows:
            print("\nDatabase tables:")
            for row in rows:
                print(f"  - {row['table_name']}")
        else:
            print("\nNo tables found in the database.")

        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error: {error}")


def basic_operations(conn):
    """Demonstrate basic database operations"""
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Insert a new category
        print("\nInserting a new category...")
        cur.execute(
            """
            INSERT INTO "Categoria" (nome, parent_id)
            VALUES ('Ficção Científica', NULL)
            RETURNING id, nome;
        """
        )
        category = cur.fetchone()
        conn.commit()
        print(f"  - Category created: {category['nome']} (ID: {category['id']})")

        # Insert a new book
        print("\nInserting a new book...")
        cur.execute(
            """
            INSERT INTO "Livro" (isbn, titulo, subtitulo, editora, ano_publicacao, categoria_id)
            VALUES ('9780451524935', 'The Hitchhiker''s Guide to the Galaxy', 'A Trilogy in Five Parts', 
                   'Del Rey', '1979-10-12', %s)
            RETURNING isbn, titulo;
        """,
            (category["id"],),
        )
        book = cur.fetchone()
        conn.commit()
        print(f"  - Book created: {book['titulo']} (ISBN: {book['isbn']})")

        # Insert book details
        print("\nInserting book details...")
        cur.execute(
            """
            INSERT INTO "Livro_Detalhe" (isbn, resumo, numero_paginas)
            VALUES (%s, 'The Hitchhiker''s Guide to the Galaxy is a comedy science fiction franchise...', 224);
        """,
            (book["isbn"],),
        )
        conn.commit()
        print("  - Book details added")

        # Insert an author
        print("\nInserting a new author...")
        cur.execute(
            """
            INSERT INTO "Autor" (nome)
            VALUES ('Douglas Adams')
            RETURNING id, nome;
        """
        )
        author = cur.fetchone()
        conn.commit()
        print(f"  - Author created: {author['nome']} (ID: {author['id']})")

        # Link author to book
        print("\nLinking author to book...")
        cur.execute(
            """
            INSERT INTO "Livro_Autor" (isbn, autor_id)
            VALUES (%s, %s);
        """,
            (book["isbn"], author["id"]),
        )
        conn.commit()
        print(f"  - Author {author['nome']} linked to book {book['titulo']}")

        # Add an exemplar of the book
        print("\nAdding a book exemplar...")
        cur.execute(
            """
            INSERT INTO "Exemplar" (codigo_tombamento, isbn, status, localizacao)
            VALUES ('SCIFI001', %s, 'DISPONÍVEL', 'Estante B, Prateleira 2')
            RETURNING codigo_tombamento;
        """,
            (book["isbn"],),
        )
        exemplar = cur.fetchone()
        conn.commit()
        print(f"  - Exemplar created: {exemplar['codigo_tombamento']}")

        # Create a user
        print("\nCreating a new user...")
        cur.execute(
            """
            INSERT INTO "Usuario" (nome, email)
            VALUES ('João Silva', 'joao.silva@email.com')
            RETURNING id, nome;
        """
        )
        user = cur.fetchone()
        conn.commit()
        print(f"  - User created: {user['nome']} (ID: {user['id']})")

        # Register a book loan
        print("\nRegistering a book loan...")
        return_date = datetime.now() + timedelta(days=15)
        cur.execute(
            """
            INSERT INTO "Emprestimo" (usuario_id, exemplar_id, data_devolucao_prevista)
            VALUES (%s, %s, %s)
            RETURNING id;
        """,
            (
                user["id"],
                exemplar["codigo_tombamento"],
                return_date.strftime("%Y-%m-%d"),
            ),
        )
        loan = cur.fetchone()
        conn.commit()
        print(f"  - Loan registered: ID {loan['id']}")

        # Query to list all books with their authors
        print("\nListing all books with their authors:")
        cur.execute(
            """
            SELECT l.isbn, l.titulo, a.nome as autor, c.nome as categoria
            FROM "Livro" l
            JOIN "Livro_Autor" la ON l.isbn = la.isbn
            JOIN "Autor" a ON la.autor_id = a.id
            JOIN "Categoria" c ON l.categoria_id = c.id;
        """
        )

        # Fetch all rows
        books = cur.fetchall()
        for book in books:
            print(
                f"  - {book['titulo']} by {book['autor']} (Category: {book['categoria']}, ISBN: {book['isbn']})"
            )

        # List active loans
        print("\nListing active loans:")
        cur.execute(
            """
            SELECT e.id, u.nome as usuario, l.titulo, ex.codigo_tombamento, 
                   e.data_emprestimo, e.data_devolucao_prevista
            FROM "Emprestimo" e
            JOIN "Usuario" u ON e.usuario_id = u.id
            JOIN "Exemplar" ex ON e.exemplar_id = ex.codigo_tombamento
            JOIN "Livro" l ON ex.isbn = l.isbn
            WHERE e.data_devolucao_efetiva IS NULL;
        """
        )

        loans = cur.fetchall()
        for loan in loans:
            print(
                f"  - Loan #{loan['id']}: {loan['titulo']} borrowed by {loan['usuario']}"
            )
            print(f"    Due date: {loan['data_devolucao_prevista']}")

        cur.close()
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error during database operations: {error}")
        conn.rollback()


def main():
    """Main function to demonstrate database connectivity and operations"""
    conn = connect_to_db()

    if conn is not None:
        list_all_tables(conn)
        basic_operations(conn)
        conn.close()
        print("\nDatabase connection closed.")


if __name__ == "__main__":
    main()
