export default function RequisicoesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Requisições de Pagamento</h1>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          + Nova Requisição
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="text-left py-3 px-4">Nº</th>
              <th className="text-left py-3 px-4">Descrição</th>
              <th className="text-left py-3 px-4">Valor</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Data Vencimento</th>
              <th className="text-left py-3 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">#001</td>
              <td className="py-3 px-4">Fatura Telefônica</td>
              <td className="py-3 px-4">R$ 1.200,00</td>
              <td className="py-3 px-4">
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm">
                  Pendente
                </span>
              </td>
              <td className="py-3 px-4">15/03/2026</td>
              <td className="py-3 px-4">
                <button className="text-blue-600 hover:text-blue-800">Ver</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-center text-gray-600">Carregando requisições...</p>
    </div>
  )
}
