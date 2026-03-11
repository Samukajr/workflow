import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { paymentService, PaymentRequest, PaymentWorkflow, PaymentApproval } from '../services/paymentService';

export default function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [workflow, setWorkflow] = useState<PaymentWorkflow[]>([]);
  const [approvals, setApprovals] = useState<PaymentApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadDetails();
      loadApprovals();
    }
  }, [id]);

  const loadDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await paymentService.getDetails(id);
      setRequest(response.data.request);
      setWorkflow(response.data.workflow);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      alert('Erro ao carregar detalhes da requisição');
    } finally {
      setLoading(false);
    }
  };

  const loadApprovals = async () => {
    if (!id) return;
    try {
      const response = await paymentService.getApprovals(id);
      setApprovals(response.data);
    } catch (error) {
      console.error('Erro ao carregar aprovações:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      pendente_validacao: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendente Validação' },
      validado: { color: 'bg-green-100 text-green-800', text: 'Validado' },
      rejeitado: { color: 'bg-red-100 text-red-800', text: 'Rejeitado' },
      em_pagamento: { color: 'bg-blue-100 text-blue-800', text: 'Em Pagamento' },
      pago: { color: 'bg-green-100 text-green-800', text: 'Pago' },
      cancelado: { color: 'bg-gray-100 text-gray-800', text: 'Cancelado' },
    };

    const badge = badges[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    return <span className={`inline-flex text-xs px-2 py-1 rounded-full font-semibold ${badge.color}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Requisição não encontrada</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Detalhes da Requisição</h1>
          <p className="text-slate-300 mt-1">Histórico completo da solicitação {request.request_number}.</p>
        </div>
        <Link to="/payments" className="text-indigo-300 hover:text-white font-medium transition-colors">
          ← Voltar para listagem
        </Link>
      </div>

      {/* Informações Principais */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações da Requisição</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Número</p>
            <p className="text-slate-800 font-semibold">{request.request_number}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Status Atual</p>
            {getStatusBadge(request.status)}
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Fornecedor</p>
            <p className="text-slate-800 font-semibold">{request.supplier_name}</p>
            <p className="text-xs text-slate-500">{request.supplier_document}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Valor</p>
            <p className="text-slate-800 font-semibold">{formatCurrency(request.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Tipo de Documento</p>
            <p className="text-slate-800 font-semibold uppercase">{request.document_type}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Data de Vencimento</p>
            <p className="text-slate-800 font-semibold">{formatDate(request.due_date)}</p>
          </div>
        </div>

        {request.notes && (
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-1">Notas</p>
            <p className="text-slate-700">{request.notes}</p>
          </div>
        )}
      </div>

      {/* Informações de Aprovação */}
      {request.requires_double_approval && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Aprovação Dupla Requerida
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvals.map((approval, index) => (
              <div key={approval.id} className="bg-white rounded-lg p-4 border border-yellow-200">
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  {index === 0 ? 'Primeira' : 'Segunda'} Aprovação
                </p>
                <p className="text-xs text-slate-500">
                  Decisão: <span className={`font-semibold ${approval.decision === 'aprovado' ? 'text-green-600' : 'text-red-600'}`}>
                    {approval.decision === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                  </span>
                </p>
                <p className="text-xs text-slate-500">Data: {formatDate(approval.created_at)}</p>
                {approval.comments && (
                  <p className="text-xs text-slate-600 mt-2 italic">"{approval.comments}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline do Workflow */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Timeline do Workflow</h2>
        <ol className="relative border-l-2 border-slate-200 ml-3 space-y-6">
          {workflow.map((item, index) => (
            <li key={item.id} className="ml-6">
              <div className="absolute w-4 h-4 bg-indigo-600 rounded-full -left-[9px] border-2 border-white"></div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="font-semibold text-slate-800 mb-1 capitalize">{item.action.replace('_', ' ')}</p>
                <p className="text-sm text-slate-600 mb-2">{item.comments}</p>
                {item.status_from && (
                  <p className="text-xs text-slate-500">
                    {getStatusBadge(item.status_from)} → {getStatusBadge(item.status_to)}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-2">{formatDate(item.created_at)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Informações de Encerramento */}
      {request.closed_at && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Informações de Encerramento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Data de Encerramento</p>
              <p className="text-slate-800">{formatDate(request.closed_at)}</p>
            </div>
            {request.close_reason && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Motivo</p>
                <p className="text-slate-800">{request.close_reason}</p>
              </div>
            )}
            {request.close_evidence_url && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Evidência</p>
                <a
                  href={request.close_evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 underline"
                >
                  Ver evidência
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alertas Anti-Fraude */}
      {request.supplier_blocklisted && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-1">Fornecedor Bloqueado</h3>
              <p className="text-sm text-red-700">{request.blocklist_reason}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
