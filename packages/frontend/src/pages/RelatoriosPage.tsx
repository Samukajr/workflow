export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold mb-2">Relatório de Pagamentos</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            Gerar Relatório
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold mb-2">Relatório de Validações</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            Gerar Relatório
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold mb-2">Relatório de Auditoria</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
            Gerar Relatório
          </button>
        </div>
      </div>

      <p className="text-center text-gray-600">
        Funcionalidade em desenvolvimento...
      </p>
    </div>
  )
}
