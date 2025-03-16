-- migrations/01_initial_schema.sqlite.sql
-- Initial database schema migration

-- Create categories table
CREATE TABLE IF NOT EXISTS Categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    parent_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES Categoria (id)
);

-- Create books table
CREATE TABLE IF NOT EXISTS Livro (
    isbn TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    subtitulo TEXT,
    editora TEXT NOT NULL,
    ano_publicacao DATE NOT NULL,
    categoria_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES Categoria (id)
);

-- Create book details table
CREATE TABLE IF NOT EXISTS Livro_Detalhe (
    isbn TEXT PRIMARY KEY,
    resumo TEXT,
    numero_paginas INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (isbn) REFERENCES Livro (isbn) ON DELETE CASCADE
);

-- Create authors table
CREATE TABLE IF NOT EXISTS Autor (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create book-author junction table
CREATE TABLE IF NOT EXISTS Livro_Autor (
    isbn TEXT NOT NULL,
    autor_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (isbn, autor_id),
    FOREIGN KEY (isbn) REFERENCES Livro (isbn),
    FOREIGN KEY (autor_id) REFERENCES Autor (id)
);

-- Create keywords table
CREATE TABLE IF NOT EXISTS PalavraChave (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    palavra TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create book-keyword junction table
CREATE TABLE IF NOT EXISTS Livro_PalavraChave (
    isbn TEXT NOT NULL,
    palavra_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (isbn, palavra_id),
    FOREIGN KEY (isbn) REFERENCES Livro (isbn),
    FOREIGN KEY (palavra_id) REFERENCES PalavraChave (id)
);

-- Create copies table
CREATE TABLE IF NOT EXISTS Exemplar (
    codigo_tombamento TEXT PRIMARY KEY,
    isbn TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DISPONÍVEL',
    localizacao TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (isbn) REFERENCES Livro (isbn)
);

-- Create users table
CREATE TABLE IF NOT EXISTS Usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS Endereco (
    usuario_id INTEGER PRIMARY KEY,
    logradouro TEXT NOT NULL,
    numero TEXT NOT NULL,
    cidade TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE
);

-- Create user phone numbers table
CREATE TABLE IF NOT EXISTS Telefone_Usuario (
    usuario_id INTEGER NOT NULL,
    telefone TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, telefone),
    FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE
);

-- Create loans table
CREATE TABLE IF NOT EXISTS Emprestimo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    exemplar_id TEXT NOT NULL,
    data_emprestimo DATE NOT NULL DEFAULT (date('now')),
    data_devolucao_prevista DATE NOT NULL,
    data_devolucao_efetiva DATE,
    status TEXT NOT NULL DEFAULT 'ATIVO',
    numero_renovacoes INTEGER NOT NULL DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuario (id),
    FOREIGN KEY (exemplar_id) REFERENCES Exemplar (codigo_tombamento)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_emprestimo_usuario ON Emprestimo(usuario_id, status);
CREATE INDEX IF NOT EXISTS idx_emprestimo_exemplar ON Emprestimo(exemplar_id, status);
