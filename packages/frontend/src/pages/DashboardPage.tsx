export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-4xl font-bold text-blue-600">12</div>
          <div className="text-gray-600 text-sm">Requisições Pendentes</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-4xl font-bold text-yellow-600">5</div>
          <div className="text-gray-600 text-sm">Aguardando Validação</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-4xl font-bold text-green-600">28</div>
          <div className="text-gray-600 text-sm">Pagamentos Processados</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-4xl font-bold text-red-600">2</div>
          <div className="text-gray-600 text-sm">Com Problemas</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Atividades Recentes</h2>
        <div className="space-y-3">
          <p className="text-gray-600">Nenhuma atividade registrada</p>
        </div>
      </div>

      <div className="text-center text-gray-600 text-sm">
        <p>Dashboard em desenvolvimento... Mais funcionalidades em breve!</p>
      </div>
    </div>
  )
}
