-- =========================================================
-- Sistema de Gerenciamento de Biblioteca Universitária
-- Implementação em PostgreSQL (Atualizado)
-- =========================================================
-- ---------------------------------------------------------
-- 1. CATEGORIAS E HIERARQUIA
-- ---------------------------------------------------------
CREATE TABLE "Categoria" (
    "id" SERIAL PRIMARY KEY,
    "nome" VARCHAR(100) NOT NULL,
    "parent_id" INTEGER,
    FOREIGN KEY ("parent_id") REFERENCES "Categoria" ("id")
);
-- ---------------------------------------------------------
-- 2. LIVROS E INFORMAÇÕES RELACIONADAS
-- ---------------------------------------------------------
CREATE TABLE "Livro" (
    "isbn" VARCHAR(13) PRIMARY KEY,
    "titulo" VARCHAR(255) NOT NULL,
    "subtitulo" VARCHAR(255),
    "editora" VARCHAR(100) NOT NULL,
    "ano_publicacao" DATE NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    FOREIGN KEY ("categoria_id") REFERENCES "Categoria" ("id")
);
CREATE TABLE "Livro_Detalhe" (
    "isbn" VARCHAR(13) PRIMARY KEY,
    "resumo" TEXT,
    "numero_paginas" INTEGER,
    FOREIGN KEY ("isbn") REFERENCES "Livro" ("isbn") ON DELETE CASCADE
);
CREATE TABLE "Autor" (
    "id" SERIAL PRIMARY KEY,
    "nome" VARCHAR(100) NOT NULL
);
CREATE TABLE "Livro_Autor" (
    "isbn" VARCHAR(13) NOT NULL,
    "autor_id" INTEGER NOT NULL,
    PRIMARY KEY ("isbn", "autor_id"),
    FOREIGN KEY ("isbn") REFERENCES "Livro" ("isbn"),
    FOREIGN KEY ("autor_id") REFERENCES "Autor" ("id")
);
CREATE TABLE "PalavraChave" (
    "id" SERIAL PRIMARY KEY,
    "palavra" VARCHAR(50) NOT NULL
);
CREATE TABLE "Livro_PalavraChave" (
    "isbn" VARCHAR(13) NOT NULL,
    "palavra_id" INTEGER NOT NULL,
    PRIMARY KEY ("isbn", "palavra_id"),
    FOREIGN KEY ("isbn") REFERENCES "Livro" ("isbn"),
    FOREIGN KEY ("palavra_id") REFERENCES "PalavraChave" ("id")
);
-- ---------------------------------------------------------
-- 3. EXEMPLARES
-- ---------------------------------------------------------
CREATE TABLE "Exemplar" (
    "codigo_tombamento" VARCHAR(20) PRIMARY KEY,
    "isbn" VARCHAR(13) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "localizacao" VARCHAR(100) NOT NULL,
    FOREIGN KEY ("isbn") REFERENCES "Livro" ("isbn")
);
-- ---------------------------------------------------------
-- 4. USUÁRIOS E INFORMAÇÕES RELACIONADAS
-- ---------------------------------------------------------
CREATE TABLE "Usuario" (
    "id" SERIAL PRIMARY KEY,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) UNIQUE NOT NULL
);
CREATE TABLE "Endereco" (
    "usuario_id" INTEGER PRIMARY KEY,
    "logradouro" VARCHAR(100) NOT NULL,
    "numero" VARCHAR(10) NOT NULL,
    "cidade" VARCHAR(50) NOT NULL,
    FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("id") ON DELETE CASCADE
);
CREATE TABLE "Telefone_Usuario" (
    "usuario_id" INTEGER NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    PRIMARY KEY ("usuario_id", "telefone"),
    FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("id") ON DELETE CASCADE
);
-- ---------------------------------------------------------
-- 5. EMPRÉSTIMOS
-- ---------------------------------------------------------
CREATE TABLE "Emprestimo" (
    "id" SERIAL PRIMARY KEY,
    "usuario_id" INTEGER NOT NULL,
    "exemplar_id" VARCHAR(20) NOT NULL,
    "data_emprestimo" DATE NOT NULL DEFAULT CURRENT_DATE,
    "data_devolucao_prevista" DATE NOT NULL,
    "data_devolucao_efetiva" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    "numero_renovacoes" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    FOREIGN KEY ("usuario_id") REFERENCES "Usuario" ("id"),
    FOREIGN KEY ("exemplar_id") REFERENCES "Exemplar" ("codigo_tombamento")
);
-- =========================================================
-- OPERAÇÕES E CONSULTAS
-- =========================================================
-- ---------------------------------------------------------
-- 1. GESTÃO DO ACERVO
-- ---------------------------------------------------------
-- 1.1 Inserir categoria
INSERT INTO "Categoria" (nome, parent_id)
VALUES ('Literatura', NULL);
INSERT INTO "Categoria" (nome, parent_id)
VALUES ('Literatura Brasileira', 1);
-- 1.2 Cadastro de novo livro
INSERT INTO "Livro" (
        isbn,
        titulo,
        subtitulo,
        editora,
        ano_publicacao,
        categoria_id
    )
VALUES (
        '9788533302273',
        'Dom Casmurro',
        'Romance Clássico',
        'Editora XYZ',
        '2023-01-01',
        2
    );
-- 1.3 Inserir detalhes do livro
INSERT INTO "Livro_Detalhe" (isbn, resumo, numero_paginas)
VALUES (
        '9788533302273',
        'Um dos romances mais célebres de Machado de Assis...',
        256
    );
-- 1.4 Cadastrar autor
INSERT INTO "Autor" (nome)
VALUES ('Machado de Assis');
-- 1.5 Associar autor ao livro
INSERT INTO "Livro_Autor" (isbn, autor_id)
VALUES ('9788533302273', 1);
-- 1.6 Cadastrar palavras-chave
INSERT INTO "PalavraChave" (palavra)
VALUES ('romance');
INSERT INTO "PalavraChave" (palavra)
VALUES ('literatura brasileira');
-- 1.7 Associar palavras-chave ao livro
INSERT INTO "Livro_PalavraChave" (isbn, palavra_id)
VALUES ('9788533302273', 1);
INSERT INTO "Livro_PalavraChave" (isbn, palavra_id)
VALUES ('9788533302273', 2);
-- 1.8 Registro de exemplares
INSERT INTO "Exemplar" (codigo_tombamento, isbn, status, localizacao)
VALUES (
        'TOMB001',
        '9788533302273',
        'DISPONÍVEL',
        'Estante A, Prateleira 3'
    );
-- 1.9 Busca de livros por categoria
SELECT l.*,
    ld.numero_paginas
FROM "Livro" l
    JOIN "Livro_Detalhe" ld ON l.isbn = ld.isbn
    JOIN "Categoria" c ON l.categoria_id = c.id
WHERE c.nome = 'Literatura Brasileira'
    OR c.parent_id = (
        SELECT id
        FROM "Categoria"
        WHERE nome = 'Literatura Brasileira'
    );
-- 1.10 Busca de livros por autor
SELECT l.*,
    a.nome as autor
FROM "Livro" l
    JOIN "Livro_Autor" la ON l.isbn = la.isbn
    JOIN "Autor" a ON la.autor_id = a.id
WHERE a.nome ILIKE '%Machado%';
-- 1.11 Busca de livros por palavra-chave
SELECT l.*,
    p.palavra
FROM "Livro" l
    JOIN "Livro_PalavraChave" lp ON l.isbn = lp.isbn
    JOIN "PalavraChave" p ON lp.palavra_id = p.id
WHERE p.palavra ILIKE '%romance%';
-- 1.12 Verificação de disponibilidade de exemplares
SELECT l.titulo,
    e.codigo_tombamento,
    e.status,
    e.localizacao
FROM "Livro" l
    JOIN "Exemplar" e ON l.isbn = e.isbn
    LEFT JOIN "Emprestimo" emp ON e.codigo_tombamento = emp.exemplar_id
    AND emp.data_devolucao_efetiva IS NULL
WHERE l.isbn = '9788533302273';
-- ---------------------------------------------------------
-- 2. GESTÃO DE USUÁRIOS
-- ---------------------------------------------------------
-- 2.1 Cadastro de novo usuário
INSERT INTO "Usuario" (nome, email)
VALUES ('João Silva', 'joao.silva@email.com');
-- 2.2 Adicionar endereço do usuário
INSERT INTO "Endereco" (usuario_id, logradouro, numero, cidade)
VALUES (1, 'Rua das Flores', '123', 'Recife');
-- 2.3 Adicionar telefone do usuário
INSERT INTO "Telefone_Usuario" (usuario_id, telefone)
VALUES (1, '(81) 98765-4321');
-- 2.4 Buscar usuário com todas as informações
SELECT u.*,
    e.logradouro,
    e.numero,
    e.cidade,
    array_agg(t.telefone) as telefones
FROM "Usuario" u
    LEFT JOIN "Endereco" e ON u.id = e.usuario_id
    LEFT JOIN "Telefone_Usuario" t ON u.id = t.usuario_id
WHERE u.id = 1
GROUP BY u.id,
    e.logradouro,
    e.numero,
    e.cidade;
-- ---------------------------------------------------------
-- 3. EMPRÉSTIMOS E DEVOLUÇÕES
-- ---------------------------------------------------------
-- 3.1 Registrar um novo empréstimo
INSERT INTO "Emprestimo" (usuario_id, exemplar_id, data_devolucao_prevista)
VALUES (1, 'TOMB001', CURRENT_DATE + INTERVAL '15 days');
-- 3.2 Verificar empréstimos ativos de um usuário
SELECT e.id,
    l.titulo,
    e.data_emprestimo,
    e.data_devolucao_prevista,
    CASE
        WHEN CURRENT_DATE > e.data_devolucao_prevista THEN 'ATRASADO'
        ELSE 'REGULAR'
    END as situacao
FROM "Emprestimo" e
    JOIN "Exemplar" ex ON e.exemplar_id = ex.codigo_tombamento
    JOIN "Livro" l ON ex.isbn = l.isbn
WHERE e.usuario_id = 1
    AND e.data_devolucao_efetiva IS NULL;
-- 3.3 Processar devolução de exemplar
UPDATE "Emprestimo"
SET data_devolucao_efetiva = CURRENT_DATE,
    status = 'CONCLUIDO'
WHERE id = 1;
-- 3.4 Renovar empréstimo
UPDATE "Emprestimo"
SET data_devolucao_prevista = CURRENT_DATE + INTERVAL '15 days',
    numero_renovacoes = numero_renovacoes + 1
WHERE id = 1
    AND data_devolucao_efetiva IS NULL
    AND numero_renovacoes < 3;
-- ---------------------------------------------------------
-- 4. RELATÓRIOS E CONSULTAS ANALÍTICAS
-- ---------------------------------------------------------
-- 4.1 Relatório de livros mais emprestados
SELECT l.isbn,
    l.titulo,
    COUNT(e.id) as total_emprestimos
FROM "Livro" l
    JOIN "Exemplar" ex ON l.isbn = ex.isbn
    JOIN "Emprestimo" e ON ex.codigo_tombamento = e.exemplar_id
GROUP BY l.isbn,
    l.titulo
ORDER BY total_emprestimos DESC
LIMIT 10;
-- 4.2 Relatório de empréstimos por categoria
SELECT c.nome as categoria,
    COUNT(e.id) as total_emprestimos
FROM "Categoria" c
    JOIN "Livro" l ON c.id = l.categoria_id
    JOIN "Exemplar" ex ON l.isbn = ex.isbn
    JOIN "Emprestimo" e ON ex.codigo_tombamento = e.exemplar_id
GROUP BY c.nome
ORDER BY total_emprestimos DESC;
-- 4.3 Identificação de atrasos
SELECT u.nome,
    u.email,
    l.titulo,
    e.data_devolucao_prevista,
    CURRENT_DATE - e.data_devolucao_prevista as dias_atraso
FROM "Emprestimo" e
    JOIN "Usuario" u ON e.usuario_id = u.id
    JOIN "Exemplar" ex ON e.exemplar_id = ex.codigo_tombamento
    JOIN "Livro" l ON ex.isbn = l.isbn
WHERE e.data_devolucao_efetiva IS NULL
    AND e.data_devolucao_prevista < CURRENT_DATE;
-- 4.4 Histórico de empréstimos de um usuário
SELECT e.id,
    l.titulo,
    a.nome as autor,
    e.data_emprestimo,
    e.data_devolucao_prevista,
    e.data_devolucao_efetiva,
    e.numero_renovacoes
FROM "Emprestimo" e
    JOIN "Exemplar" ex ON e.exemplar_id = ex.codigo_tombamento
    JOIN "Livro" l ON ex.isbn = l.isbn
    JOIN "Livro_Autor" la ON l.isbn = la.isbn
    JOIN "Autor" a ON la.autor_id = a.id
WHERE e.usuario_id = 1
ORDER BY e.data_emprestimo DESC;
-- ---------------------------------------------------------
-- 5. INDICADORES DE DESEMPENHO
-- ---------------------------------------------------------
-- 5.1 Taxa de circulação dos livros por mês
SELECT l.isbn,
    l.titulo,
    DATE_TRUNC('month', e.data_emprestimo) as mes,
    COUNT(e.id) as emprestimos_no_mes
FROM "Livro" l
    JOIN "Exemplar" ex ON l.isbn = ex.isbn
    JOIN "Emprestimo" e ON ex.codigo_tombamento = e.exemplar_id
WHERE e.data_emprestimo >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY l.isbn,
    l.titulo,
    DATE_TRUNC('month', e.data_emprestimo)
ORDER BY l.titulo,
    mes;
-- 5.2 Eficiência do acervo por categoria
SELECT c.nome as categoria,
    COUNT(DISTINCT l.isbn) as total_titulos,
    COUNT(DISTINCT ex.codigo_tombamento) as total_exemplares,
    COUNT(e.id) as total_emprestimos,
    CASE
        WHEN COUNT(DISTINCT ex.codigo_tombamento) = 0 THEN 0
        ELSE COUNT(e.id)::float / COUNT(DISTINCT ex.codigo_tombamento)
    END as emprestimos_por_exemplar
FROM "Categoria" c
    LEFT JOIN "Livro" l ON c.id = l.categoria_id
    LEFT JOIN "Exemplar" ex ON l.isbn = ex.isbn
    LEFT JOIN "Emprestimo" e ON ex.codigo_tombamento = e.exemplar_id
    AND e.data_emprestimo >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY c.nome
ORDER BY emprestimos_por_exemplar DESC;
-- 5.3 Análise de autores mais populares
SELECT a.nome as autor,
    COUNT(DISTINCT l.isbn) as total_livros,
    COUNT(e.id) as total_emprestimos
FROM "Autor" a
    JOIN "Livro_Autor" la ON a.id = la.autor_id
    JOIN "Livro" l ON la.isbn = l.isbn
    JOIN "Exemplar" ex ON l.isbn = ex.isbn
    LEFT JOIN "Emprestimo" e ON ex.codigo_tombamento = e.exemplar_id
GROUP BY a.nome
ORDER BY total_emprestimos DESC
LIMIT 10;
-- 5.4 Análise de palavras-chave mais relevantes
SELECT p.palavra,
    COUNT(DISTINCT l.isbn) as total_livros,
    COUNT(e.id) as total_emprestimos
FROM "PalavraChave" p
    JOIN "Livro_PalavraChave" lp ON p.id = lp.palavra_id
    JOIN "Livro" l ON lp.isbn = l.isbn
    JOIN "Exemplar" ex ON l.isbn = ex.isbn
    LEFT JOIN "Emprestimo" e ON ex.codigo_tombamento = e.exemplar_id
GROUP BY p.palavra
ORDER BY total_emprestimos DESC
LIMIT 10;