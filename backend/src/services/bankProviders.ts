import { BankType, PaymentMethod, BankPaymentResponse, BankIntegration } from '../types';
import logger from '../utils/logger';

/**
 * Interface abstrata para provedores bancários
 */
export abstract class BankProvider {
  protected bankType: BankType;
  protected name: string;
  protected config: BankIntegration;

  constructor(config: BankIntegration) {
    this.config = config;
    this.bankType = config.bank_type;
    this.name = config.name;
  }

  abstract initializePayment(
    paymentRequestId: string,
    amount: number,
    supplierName: string,
    supplierDocument: string,
    dueDate: Date,
    method: PaymentMethod,
    details?: Record<string, unknown>,
  ): Promise<BankPaymentResponse>;

  abstract validateWebhookSignature(payload: string, signature: string): boolean;

  abstract parseWebhookEvent(payload: Record<string, unknown>): {
    externalPaymentId: string;
    status: string;
    amount?: number;
    date?: Date;
  };

  async testConnection(): Promise<boolean> {
    try {
      logger.info(`[${this.name}] Testando conexão...`);
      return true;
    } catch (error) {
      logger.error(`[${this.name}] Erro na conexão:`, error);
      return false;
    }
  }
}

/**
 * Provider Inter Bank
 */
export class InterBankProvider extends BankProvider {
  private apiUrl = 'https://api.interbank.com.br/v1';

  async initializePayment(
    paymentRequestId: string,
    amount: number,
    supplierName: string,
    supplierDocument: string,
    dueDate: Date,
    method: PaymentMethod,
  ): Promise<BankPaymentResponse> {
    try {
      logger.info(
        `[Inter] Iniciando pagamento: R$ ${amount} para ${supplierName} via ${method}`,
      );

      // TODO: Implementar chamada real à API do Inter
      // const response = await fetch(`${this.apiUrl}/payments`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${decryptCredential(this.config.api_key_encrypted)}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({...})
      // });

      // Mock response for now
      return {
        success: true,
        external_payment_id: `INTER-${paymentRequestId.substring(0, 8)}`,
        status: 'agendado',
        message: 'Pagamento agendado com sucesso',
        estimated_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      logger.error('[Inter] Erro ao iniciar pagamento:', error);
      return {
        success: false,
        status: 'erro',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    // Implementar verificação de assinatura do Inter
    return true;
  }

  parseWebhookEvent(payload: Record<string, unknown>): {
    externalPaymentId: string;
    status: string;
    amount?: number;
    date?: Date;
  } {
    return {
      externalPaymentId: payload.id as string,
      status: payload.status as string,
      amount: payload.amount as number,
      date: payload.date ? new Date(payload.date as string) : undefined,
    };
  }
}

/**
 * Provider Bankaool (Agregador de Meios)
 */
export class BankaoolProvider extends BankProvider {
  private apiUrl = 'https://api.bankaool.com/v2';

  async initializePayment(
    paymentRequestId: string,
    amount: number,
    supplierName: string,
    supplierDocument: string,
    dueDate: Date,
    method: PaymentMethod,
  ): Promise<BankPaymentResponse> {
    try {
      logger.info(
        `[Bankaool] Iniciando pagamento: R$ ${amount} para ${supplierName} via ${method}`,
      );

      // TODO: Implementar chamada real à API do Bankaool
      return {
        success: true,
        external_payment_id: `BANKAOOL-${paymentRequestId.substring(0, 8)}`,
        status: 'processando',
        message: 'Pagamento enviado para processamento',
      };
    } catch (error) {
      logger.error('[Bankaool] Erro ao iniciar pagamento:', error);
      return {
        success: false,
        status: 'erro',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    // Implementar verificação de assinatura do Bankaool
    return true;
  }

  parseWebhookEvent(payload: Record<string, unknown>): {
    externalPaymentId: string;
    status: string;
    amount?: number;
    date?: Date;
  } {
    return {
      externalPaymentId: payload.reference_id as string,
      status: payload.payment_status as string,
      amount: payload.total_amount as number,
      date: payload.processed_at ? new Date(payload.processed_at as string) : undefined,
    };
  }
}

/**
 * Provider para pagamentos manuais (não-integrados)
 */
export class ManualPaymentProvider extends BankProvider {
  async initializePayment(
    paymentRequestId: string,
    amount: number,
    supplierName: string,
    _supplierDocument: string,
    _dueDate: Date,
    method: PaymentMethod,
  ): Promise<BankPaymentResponse> {
    try {
      logger.info(
        `[Manual] Pagamento marcado para processamento manual: R$ ${amount} para ${supplierName}`,
      );

      return {
        success: true,
        external_payment_id: `MANUAL-${paymentRequestId}`,
        status: 'pendente_manual',
        message: 'Pagamento aguardando processamento manual',
      };
    } catch (error) {
      logger.error('[Manual] Erro ao registrar pagamento:', error);
      return {
        success: false,
        status: 'erro',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  validateWebhookSignature(_payload: string, _signature: string): boolean {
    return true;
  }

  parseWebhookEvent(payload: Record<string, unknown>): {
    externalPaymentId: string;
    status: string;
    amount?: number;
    date?: Date;
  } {
    return {
      externalPaymentId: payload.id as string,
      status: payload.status as string,
    };
  }
}

/**
 * Factory para criar providers
 */
export function createBankProvider(config: BankIntegration): BankProvider {
  switch (config.bank_type) {
    case 'inter':
      return new InterBankProvider(config);
    case 'bankaool':
      return new BankaoolProvider(config);
    case 'manual':
      return new ManualPaymentProvider(config);
    case 'b20':
    case 'open_banking':
      // TODO: Implementar provedores B20 e Open Banking
      return new ManualPaymentProvider(config);
    default:
      throw new Error(`Banco não suportado: ${config.bank_type}`);
  }
}
