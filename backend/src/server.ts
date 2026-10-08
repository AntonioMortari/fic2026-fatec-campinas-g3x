import { criarApp } from './app';
import { ambiente } from './config/env';
import { sequelize } from './models';

const servidor = criarApp().listen(ambiente.PORTA, () => {
  console.info(`[api] ouvindo em http://localhost:${ambiente.PORTA} (docs em /api-docs)`);
});

// Encerramento limpo: para de aceitar conexões e fecha o pool do banco.
async function encerrar(sinal: string) {
  console.info(`[api] ${sinal} recebido, encerrando`);
  servidor.close();
  await sequelize.close();
  process.exit(0);
}

process.on('SIGTERM', () => void encerrar('SIGTERM'));
process.on('SIGINT', () => void encerrar('SIGINT'));
