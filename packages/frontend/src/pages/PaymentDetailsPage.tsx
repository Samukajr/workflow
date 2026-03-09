import { Link, useParams } from 'react-router-dom'

export default function PaymentDetailsPage() {
  const { id } = useParams()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Detalhes da Requisicao</h1>
          <p className="text-slate-600 mt-1">Historico completo da solicitacao {id}.</p>
        </div>
        <Link to="/payments" className="text-indigo-700 hover:text-indigo-900 font-medium">
          Voltar para listagem
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-slate-500">Numero</p>
          <p className="text-slate-800 font-semibold">REQ-{id}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Fornecedor</p>
          <p className="text-slate-800 font-semibold">Fornecedor Exemplo LTDA</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Valor</p>
          <p className="text-slate-800 font-semibold">R$ 2.340,75</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Status atual</p>
          <span className="inline-flex text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">Em Pagamento</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Timeline do Workflow</h2>
        <ol className="space-y-3">
          <li className="border-l-2 border-slate-200 pl-4">
            <p className="font-medium text-slate-800">Submissao</p>
            <p className="text-sm text-slate-600">Requisicao criada por usuario de submissao.</p>
          </li>
          <li className="border-l-2 border-slate-200 pl-4">
            <p className="font-medium text-slate-800">Validacao</p>
            <p className="text-sm text-slate-600">Requisicao aprovada para pagamento.</p>
          </li>
          <li className="border-l-2 border-indigo-300 pl-4">
            <p className="font-medium text-slate-800">Financeiro</p>
            <p className="text-sm text-slate-600">Pagamento em processamento.</p>
          </li>
        </ol>
      </div>
    </div>
  )
}
