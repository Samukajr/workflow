async function main(): Promise<void> {
  console.log('Seed do packages/backend não configurado neste workspace.');
  console.log('Use o backend principal em backend/src/scripts/setupProduction.ts para popular dados.');
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao executar seed';
    console.error(message);
    process.exit(1);
  });
