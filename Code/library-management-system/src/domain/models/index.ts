/**
 * Central export for all database model interfaces
 */

export interface Categoria {
  id: number;
  nome: string;
  parent_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Livro {
  isbn: string;
  titulo: string;
  subtitulo?: string;
  editora: string;
  ano_publicacao: Date;
  categoria_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface LivroDetalhe {
  isbn: string;
  resumo?: string;
  numero_paginas?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Autor {
  id: number;
  nome: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface LivroAutor {
  isbn: string;
  autor_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface PalavraChave {
  id: number;
  palavra: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface LivroPalavraChave {
  isbn: string;
  palavra_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Exemplar {
  codigo_tombamento: string;
  isbn: string;
  status: string;
  localizacao: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Endereco {
  usuario_id: number;
  logradouro: string;
  numero: string;
  cidade: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface TelefoneUsuario {
  usuario_id: number;
  telefone: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Emprestimo {
  id: number;
  usuario_id: number;
  exemplar_id: string;
  data_emprestimo: Date;
  data_devolucao_prevista: Date;
  data_devolucao_efetiva?: Date;
  status: string;
  numero_renovacoes: number;
  observacoes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface LivroComDetalhes extends Livro {
  detalhes?: LivroDetalhe;
  autores?: Autor[];
  palavras_chave?: PalavraChave[];
  exemplares?: Exemplar[];
}

export interface UsuarioComDetalhes extends Usuario {
  endereco?: Endereco;
  telefones?: TelefoneUsuario[];
}

export interface EmprestimoComDetalhes extends Emprestimo {
  usuario?: Usuario;
  exemplar?: Exemplar;
  livro?: Livro;
}
