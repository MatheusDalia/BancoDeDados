-- Initial seed data migration

-- Seed categories
INSERT INTO `Categoria` (`nome`) VALUES
('Literatura'),
('Ciências'),
('História');

-- Create subcategories
INSERT INTO `Categoria` (`nome`, `parent_id`) VALUES
('Literatura Brasileira', (SELECT `id` FROM `Categoria` WHERE `nome` = 'Literatura')),
('Literatura Estrangeira', (SELECT `id` FROM `Categoria` WHERE `nome` = 'Literatura')),
('Física', (SELECT `id` FROM `Categoria` WHERE `nome` = 'Ciências')),
('Química', (SELECT `id` FROM `Categoria` WHERE `nome` = 'Ciências')),
('Biologia', (SELECT `id` FROM `Categoria` WHERE `nome` = 'Ciências')),
('História do Brasil', (SELECT `id` FROM `Categoria` WHERE `nome` = 'História')),
('História Mundial', (SELECT `id` FROM `Categoria` WHERE `nome` = 'História'));

-- Seed authors
INSERT INTO `Autor` (`nome`) VALUES ('Machado de Assis');

-- Seed books
INSERT INTO `Livro` (`isbn`, `titulo`, `subtitulo`, `editora`, `ano_publicacao`, `categoria_id`)
VALUES (
    '9788533302273',
    'Dom Casmurro',
    'Romance Clássico',
    'Editora XYZ',
    '2023-01-01',
    (SELECT `id` FROM `Categoria` WHERE `nome` = 'Literatura Brasileira')
);

-- Seed book details
INSERT INTO `Livro_Detalhe` (`isbn`, `resumo`, `numero_paginas`)
VALUES (
    '9788533302273',
    'Um dos romances mais célebres de Machado de Assis...',
    256
);

-- Seed book-author relationship
INSERT INTO `Livro_Autor` (`isbn`, `autor_id`)
VALUES (
    '9788533302273',
    (SELECT `id` FROM `Autor` WHERE `nome` = 'Machado de Assis')
);

-- Seed keywords
INSERT INTO `PalavraChave` (`palavra`) VALUES ('romance');
INSERT INTO `PalavraChave` (`palavra`) VALUES ('literatura brasileira');

-- Seed book-keyword relationships
INSERT INTO `Livro_PalavraChave` (`isbn`, `palavra_id`)
VALUES (
    '9788533302273',
    (SELECT `id` FROM `PalavraChave` WHERE `palavra` = 'romance')
);

INSERT INTO `Livro_PalavraChave` (`isbn`, `palavra_id`)
VALUES (
    '9788533302273',
    (SELECT `id` FROM `PalavraChave` WHERE `palavra` = 'literatura brasileira')
);

-- Seed book copy
INSERT INTO `Exemplar` (`codigo_tombamento`, `isbn`, `status`, `localizacao`)
VALUES (
    'TOMB001',
    '9788533302273',
    'DISPONÍVEL',
    'Estante A, Prateleira 3'
);

-- Seed user
INSERT INTO `Usuario` (`nome`, `email`)
VALUES (
    'João Silva',
    'joao.silva@email.com'
);

-- Seed user address
INSERT INTO `Endereco` (`usuario_id`, `logradouro`, `numero`, `cidade`)
VALUES (
    (SELECT `id` FROM `Usuario` WHERE `email` = 'joao.silva@email.com'),
    'Rua das Flores',
    '123',
    'Recife'
);

-- Seed user phone
INSERT INTO `Telefone_Usuario` (`usuario_id`, `telefone`)
VALUES (
    (SELECT `id` FROM `Usuario` WHERE `email` = 'joao.silva@email.com'),
    '(81) 98765-4321'
);
