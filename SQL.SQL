-- =========================================================
-- Sistema de Gerenciamento de Biblioteca Universitária
-- Implementação em PostgreSQL
-- =========================================================

-- ---------------------------------------------------------
-- 1. DEFINIÇÃO DAS TABELAS PRINCIPAIS
-- ---------------------------------------------------------

-- Criação das tabelas principais
CREATE TABLE "Livro" (
    "isbn" VARCHAR(13) PRIMARY KEY,
    "titulo" VARCHAR(255) NOT NULL,
    "subtitulo" VARCHAR(255),
    "editora" VARCHAR(100) NOT NULL,
    "edicao" VARCHAR(50),
    "ano_publicacao" DATE NOT NULL,
    "area_conhecimento" VARCHAR(100) NOT NULL,
    "data_cadastro" DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE "Exemplar" (
    "codigo_tombamento" VARCHAR(20) PRIMARY KEY,
    "isbn" VARCHAR(13) NOT NULL,
    "codigo_barras" VARCHAR(50) UNIQUE,
    "status_conservacao" VARCHAR(20) NOT NULL,
    "data_aquisicao" DATE NOT NULL,
    "secao" VARCHAR(50) NOT NULL,
    "prateleira" VARCHAR(20) NOT NULL,
    "posicao" VARCHAR(20) NOT NULL,
    FOREIGN KEY ("isbn") REFERENCES "Livro" ("isbn")
);

-- ---------------------------------------------------------
-- 2. USUÁRIOS E ESPECIALIZAÇÕES
-- ---------------------------------------------------------

CREATE TABLE "Usuario" (
    "id" SERIAL PRIMARY KEY,
    "tipo_usuario" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cpf" VARCHAR(11) UNIQUE NOT NULL,
    "rg" VARCHAR(20) NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "email" VARCHAR(100) UNIQUE NOT NULL,
    "login" VARCHAR(50) UNIQUE NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "status_conta" VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    CONSTRAINT "chk_tipo_usuario" 
        CHECK (tipo_usuario IN ('ALUNO', 'PROFESSOR', 'FUNCIONARIO'))
);

CREATE TABLE "Aluno" (
    "id" INTEGER PRIMARY KEY REFERENCES "Usuario" ("id") ON DELETE CASCADE,
    "numero_matricula" VARCHAR(20) UNIQUE NOT NULL,
    "curso" VARCHAR(100) NOT NULL
);

CREATE TABLE "Professor" (
    "id" INTEGER PRIMARY KEY REFERENCES "Usuario" ("id") ON DELETE CASCADE,
    "siape" VARCHAR(20) UNIQUE NOT NULL,
    "departamento" VARCHAR(100) NOT NULL
);

CREATE TABLE "Funcionario" (
    "id" INTEGER PRIMARY KEY REFERENCES "Usuario" ("id") ON DELETE CASCADE,
    "siape" VARCHAR(20) UNIQUE NOT NULL,
    "setor" VARCHAR(100) NOT NULL
);

-- ---------------------------------------------------------
-- 3. EMPRÉSTIMOS E MULTAS
-- ---------------------------------------------------------

CREATE TABLE "Emprestimo" (
    "id" SERIAL PRIMARY KEY,
    "usuario_id" INTEGER NOT NULL REFERENCES "Usuario" ("id"),
    "exemplar_codigo" VARCHAR(20) NOT NULL 
        REFERENCES "Exemplar" ("codigo_tombamento"),
    "funcionario_id" INTEGER NOT NULL REFERENCES "Funcionario" ("id"),
    "data_emprestimo" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_devolucao_prevista" DATE NOT NULL,
    "data_devolucao_efetiva" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    "numero_renovacoes" INTEGER NOT NULL DEFAULT 0,
    "observacoes" TEXT
);

CREATE TABLE "Multa" (
    "id" SERIAL PRIMARY KEY,
    "emprestimo_id" INTEGER NOT NULL REFERENCES "Emprestimo" ("id"),
    "valor" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    "data_geracao" DATE NOT NULL DEFAULT CURRENT_DATE,
    "data_pagamento" DATE
);

-- ---------------------------------------------------------
-- 4. ATRIBUTOS MULTIVALORADOS E COMPOSTOS
-- ---------------------------------------------------------

CREATE TABLE "Telefone_Usuario" (
    "usuario_id" INTEGER REFERENCES "Usuario" ("id"),
    "telefone" VARCHAR(20),
    PRIMARY KEY ("usuario_id", "telefone")
);

CREATE TABLE "Autor_Livro" (
    "isbn" VARCHAR(13) REFERENCES "Livro" ("isbn"),
    "autor" VARCHAR(100),
    PRIMARY KEY ("isbn", "autor")
);

CREATE TABLE "PalavraChave_Livro" (
    "isbn" VARCHAR(13) REFERENCES "Livro" ("isbn"),
    "palavra_chave" VARCHAR(50),
    PRIMARY KEY ("isbn", "palavra_chave")
);

CREATE TABLE "Endereco_Usuario" (
    "usuario_id" INTEGER PRIMARY KEY REFERENCES "Usuario" ("id"),
    "logradouro" VARCHAR(100) NOT NULL,
    "numero" VARCHAR(10) NOT NULL,
    "complemento" VARCHAR(50),
    "bairro" VARCHAR(50) NOT NULL,
    "cidade" VARCHAR(50) NOT NULL,
    "estado" CHAR(2) NOT NULL,
    "cep" VARCHAR(8) NOT NULL
);

-- ---------------------------------------------------------
-- 5. TABELA DE RESERVAS (MENCIONADA NO ESQUEMA RELACIONAL)
-- ---------------------------------------------------------

CREATE TABLE "Reserva" (
    "id" SERIAL PRIMARY KEY,
    "usuario_id" INTEGER NOT NULL REFERENCES "Usuario" ("id"),
    "exemplar_codigo" VARCHAR(20) NOT NULL REFERENCES "Exemplar" ("codigo_tombamento"),
    "data_reserva" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_validade" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ATIVA'
);

-- =========================================================
-- OPERAÇÕES E CONSULTAS
-- =========================================================

-- ---------------------------------------------------------
-- 1. GESTÃO DO ACERVO
-- ---------------------------------------------------------

-- 1.1 Cadastro de novo livro
INSERT INTO "Livro" (isbn, titulo, editora, edicao, 
    ano_publicacao, area_conhecimento)
VALUES ('9788533302273', 'Dom Casmurro', 'Editora XYZ', 
    '1ª Edição', '2023-01-01', 'Literatura');

INSERT INTO "Autor_Livro" (isbn, autor)
VALUES ('9788533302273', 'Machado de Assis');

-- 1.2 Registro de exemplares
INSERT INTO "Exemplar" (codigo_tombamento, isbn, 
    codigo_barras, status_conservacao, data_aquisicao,
    secao, prateleira, posicao)
VALUES ('TOMB001', '9788533302273', 'BAR001', 'NOVO',
    CURRENT_DATE, 'LIT', 'A', '01');

-- 1.3 Busca de livros por título com verificação de disponibilidade
SELECT l.*, COUNT(e.codigo_tombamento) as exemplares_disponiveis
FROM "Livro" l
LEFT JOIN "Exemplar" e ON l.isbn = e.isbn
LEFT JOIN "Emprestimo" emp ON e.codigo_tombamento = 
    emp.exemplar_codigo AND emp.data_devolucao_efetiva IS NULL
WHERE l.titulo ILIKE '%pesquisa%'
GROUP BY l.isbn;

-- 1.4 Relatório de acervo por área de conhecimento
SELECT l.area_conhecimento, 
    COUNT(DISTINCT l.isbn) as total_titulos,
    COUNT(e.codigo_tombamento) as total_exemplares
FROM "Livro" l
LEFT JOIN "Exemplar" e ON l.isbn = e.isbn
GROUP BY l.area_conhecimento;

-- ---------------------------------------------------------
-- 2. GESTÃO DE USUÁRIOS
-- ---------------------------------------------------------

-- 2.1 Cadastro de novo usuário (aluno)
INSERT INTO "Usuario" (nome, cpf, tipo_usuario, email, 
    login, senha, status_conta)
VALUES ('João Silva', '12345678901', 'ALUNO',
    'joao@email.com', 'joao.silva', 
    'senha_hash', 'ATIVO');

INSERT INTO "Aluno" (id, numero_matricula, curso)
VALUES (CURRVAL('"Usuario_id_seq"'), '20241001', 
    'Ciência da Computação');

-- 2.2 Desativação de usuário com multas pendentes
UPDATE "Usuario"
SET status_conta = 'INATIVO'
WHERE id = 1001 AND EXISTS (
    SELECT 1 FROM "Multa" m
    JOIN "Emprestimo" e ON m.emprestimo_id = e.id
    WHERE e.usuario_id = 1001 
    AND m.status = 'PENDENTE'
);

-- ---------------------------------------------------------
-- 3. EMPRÉSTIMOS E DEVOLUÇÕES
-- ---------------------------------------------------------

-- 3.1 Verificar quantidade de empréstimos ativos de um usuário
SELECT COUNT(*) as emprestimos_ativos
FROM "Emprestimo"
WHERE usuario_id = 1001
AND data_devolucao_efetiva IS NULL;

-- 3.2 Registrar um novo empréstimo
INSERT INTO "Emprestimo" (usuario_id, exemplar_codigo,
    funcionario_id, data_devolucao_prevista)
VALUES (1001, 'TOMB001', 2001, 
    CURRENT_DATE + INTERVAL '15 days');

-- 3.3 Processar devolução de exemplar
UPDATE "Emprestimo"
SET data_devolucao_efetiva = CURRENT_DATE,
    status = 'CONCLUIDO'
WHERE id = 3001;

-- 3.4 Gerar multa para empréstimo em atraso
INSERT INTO "Multa" (emprestimo_id, valor, status)
SELECT id, 
    (CURRENT_DATE - data_devolucao_prevista) * 1.00,
    'PENDENTE'
FROM "Emprestimo"
WHERE id = 3001 
AND CURRENT_DATE > data_devolucao_prevista;

-- ---------------------------------------------------------
-- 4. RELATÓRIOS E CONSULTAS ANALÍTICAS
-- ---------------------------------------------------------

-- 4.1 Estatísticas de uso por área de conhecimento
SELECT l.area_conhecimento,
    COUNT(e.id) as total_emprestimos,
    COUNT(DISTINCT e.usuario_id) as usuarios_unicos
FROM "Livro" l
JOIN "Exemplar" ex ON l.isbn = ex.isbn
JOIN "Emprestimo" e ON ex.codigo_tombamento = e.exemplar_codigo
WHERE e.data_emprestimo >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY l.area_conhecimento
ORDER BY total_emprestimos DESC;

-- 4.2 Relatório de multas pendentes por usuário
SELECT u.nome, COUNT(m.id) as total_multas,
    SUM(m.valor) as valor_total,
    MAX(m.data_geracao) as multa_mais_recente
FROM "Usuario" u
JOIN "Emprestimo" e ON u.id = e.usuario_id
JOIN "Multa" m ON e.id = m.emprestimo_id
WHERE m.status = 'PENDENTE'
GROUP BY u.id, u.nome
ORDER BY valor_total DESC;

-- 4.3 Consulta de atrasos para notificações
SELECT u.nome, u.email, l.titulo,
    e.data_devolucao_prevista,
    CURRENT_DATE - e.data_devolucao_prevista as dias_atraso
FROM "Emprestimo" e
JOIN "Usuario" u ON e.usuario_id = u.id
JOIN "Exemplar" ex ON e.exemplar_codigo = ex.codigo_tombamento
JOIN "Livro" l ON ex.isbn = l.isbn
WHERE e.data_devolucao_efetiva IS NULL
AND e.data_devolucao_prevista < CURRENT_DATE;

-- 4.4 Status da fila de reservas
SELECT l.titulo, r.data_reserva,
    u.nome as usuario,
    ROW_NUMBER() OVER (
        PARTITION BY r.exemplar_codigo 
        ORDER BY r.data_reserva
    ) as posicao_fila
FROM "Reserva" r
JOIN "Usuario" u ON r.usuario_id = u.id
JOIN "Exemplar" ex ON r.exemplar_codigo = ex.codigo_tombamento
JOIN "Livro" l ON ex.isbn = l.isbn
WHERE r.status = 'ATIVA'
ORDER BY r.exemplar_codigo, r.data_reserva;

-- ---------------------------------------------------------
-- 5. INDICADORES DE DESEMPENHO
-- ---------------------------------------------------------

-- 5.1 Taxa de circulação dos livros
SELECT l.isbn, l.titulo,
    COUNT(e.id) as total_emprestimos,
    COUNT(e.id)::float / 
        EXTRACT(MONTH FROM AGE(CURRENT_DATE, MIN(e.data_emprestimo)))
    as media_mensal
FROM "Livro" l
JOIN "Exemplar" ex ON l.isbn = ex.isbn
LEFT JOIN "Emprestimo" e ON ex.codigo_tombamento = e.exemplar_codigo
GROUP BY l.isbn, l.titulo
HAVING MIN(e.data_emprestimo) IS NOT NULL;

-- 5.2 Eficiência do acervo por área de conhecimento
SELECT l.area_conhecimento,
    COUNT(DISTINCT l.isbn) as total_titulos,
    COUNT(DISTINCT e.id) as total_emprestimos,
    COUNT(DISTINCT e.id)::float / COUNT(DISTINCT l.isbn)
    as emprestimos_por_titulo
FROM "Livro" l
LEFT JOIN "Exemplar" ex ON l.isbn = ex.isbn
LEFT JOIN "Emprestimo" e ON ex.codigo_tombamento = e.exemplar_codigo
WHERE e.data_emprestimo >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY l.area_conhecimento;
