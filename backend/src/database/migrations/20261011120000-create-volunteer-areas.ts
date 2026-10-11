import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

const AREAS = [
  { id: 'apoio-pedagogico', name: 'Apoio pedagógico e oficinas', description: 'Reforço escolar, contação de histórias, oficinas de percussão, dança, turbantes e artes manuais.', sort_order: 1 },
  { id: 'comunicacao', name: 'Comunicação e mídias', description: 'Fotos, vídeos, textos para redes sociais, divulgação de projetos e editais.', sort_order: 2 },
  { id: 'producao-eventos', name: 'Produção de eventos', description: 'Montagem de exposições, recepção de público, feiras culturais, apresentações.', sort_order: 3 },
  { id: 'acervo', name: 'Organização de acervo', description: 'Catalogação de livros, roupas, instrumentos musicais, fantasias e peças de memória ancestral.', sort_order: 4 },
  { id: 'administrativo', name: 'Apoio administrativo', description: 'Captação de recursos, planejamento de projetos, atendimento à comunidade.', sort_order: 5 },
];

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('volunteer_areas', {
    id: { type: DataTypes.STRING(40), primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    sort_order: { type: DataTypes.SMALLINT, allowNull: false },
  });
  await queryInterface.bulkInsert('volunteer_areas', AREAS);
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('volunteer_areas');
};
