import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SignatureStatus {
  id: string;
  documentId: string;
  documentName: string;
  hash: string;
  signedAt: string;
  signedBy: string;
  status: 'válida' | 'inválida' | 'pendente';
  isValid: boolean;
}

interface StatusAssinaturaProps {
  signatures: SignatureStatus[];
  isLoading?: boolean;
}

export function StatusAssinatura({ signatures, isLoading = false }: StatusAssinaturaProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'válida':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'inválida':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'pendente':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      válida: 'bg-green-100 text-green-800',
      inválida: 'bg-red-100 text-red-800',
      pendente: 'bg-yellow-100 text-yellow-800',
    };
    return classes[status as keyof typeof classes] || classes.pendente;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (signatures.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum documento assinado ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {signatures.map((sig) => (
        <div
          key={sig.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {getStatusIcon(sig.status)}
                <h4 className="font-medium text-gray-900">{sig.documentName}</h4>
                <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(sig.status)}`}>
                  {sig.status.toUpperCase()}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-semibold">Hash:</span>{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {sig.hash.substring(0, 24)}...
                  </code>
                </p>
                <p>
                  <span className="font-semibold">Assinado em:</span>{' '}
                  {new Date(sig.signedAt).toLocaleString('pt-BR')}
                </p>
                <p>
                  <span className="font-semibold">Assinado por:</span> {sig.signedBy}
                </p>
              </div>
            </div>
            <div className="ml-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sig.hash);
                  alert('Hash copiado!');
                }}
                className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              >
                Copiar Hash
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
