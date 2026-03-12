# Política de Privacidade - WORKFLOW

Versão: 1.0
Data de vigência: 12/03/2026
Última atualização: 12/03/2026

## 1. Objetivo
Esta Política de Privacidade descreve como o sistema WORKFLOW coleta, utiliza, armazena, protege e elimina dados pessoais no contexto do processamento de requisições de pagamento.

## 2. Papéis de Tratamento
- Controlador: ORGANIZACAO_CLIENTE (contratante do sistema).
- Operador: Equipe técnica responsável pela operação do WORKFLOW, conforme contrato.

Obs.: Em implantações específicas, os papéis podem ser ajustados contratualmente.

## 3. Dados Pessoais Tratados
- Dados cadastrais de usuários: nome, e-mail corporativo, departamento.
- Dados de autenticação: hash de senha, metadados de login.
- Dados de auditoria: IP, user-agent, timestamps, ações executadas.
- Dados de fluxo de pagamento: registros necessários para operação e rastreabilidade.

O sistema não foi projetado para coleta de dados pessoais sensíveis (LGPD, art. 5, II), salvo se inseridos indevidamente por usuários.

## 4. Finalidades do Tratamento
- Autenticação e controle de acesso por perfil.
- Execução do fluxo operacional de submissão, validação e pagamento.
- Prevenção a fraude e uso indevido.
- Atendimento a obrigações legais, regulatórias e de auditoria.
- Atendimento a solicitações de titulares (acesso, exportação, exclusão quando aplicável).

## 5. Bases Legais (LGPD)
As operações de tratamento são realizadas, conforme o caso, com fundamento em:
- Execução de contrato e procedimentos preliminares (art. 7, V).
- Cumprimento de obrigação legal ou regulatória (art. 7, II).
- Exercício regular de direitos em processo judicial, administrativo ou arbitral (art. 7, VI).
- Legítimo interesse para segurança, prevenção a fraudes e melhoria operacional, com avaliação de proporcionalidade (art. 7, IX).
- Consentimento do titular quando exigível para finalidades específicas (art. 7, I).

## 6. Compartilhamento de Dados
Os dados podem ser compartilhados com:
- Provedores de infraestrutura e hospedagem.
- Serviços de e-mail/SMS configurados pelo cliente.
- Instituições parceiras para execução de pagamentos, quando aplicável.
- Autoridades públicas, mediante base legal.

Não há comercialização de dados pessoais.

## 7. Segurança da Informação
Medidas técnicas e organizacionais adotadas:
- Controle de acesso autenticado e segregação de funções.
- Rate limiting, headers de segurança HTTP e hardening de API.
- Armazenamento de senha com hash seguro.
- Logs de auditoria e trilhas de rastreabilidade.
- Mecanismos de integridade de documentos e registros.

## 8. Retenção e Descarte de Dados
Política oficial de retenção (padrão do produto, ajustável por contrato e lei aplicável):

- Logs de segurança e auditoria: 7 anos.
- Registros de pagamentos e workflow: 10 anos.
- Consentimentos LGPD: enquanto houver base legal para manutenção e/ou obrigação de evidência.
- Exportações de dados pessoais: expiração operacional em até 7 dias após geração.
- Solicitações de exclusão: processadas conforme fluxo administrativo e prazos legais internos.

Após o término do prazo aplicável, os dados são eliminados ou anonimizados de forma segura, respeitando exceções legais.

## 9. Direitos do Titular
O titular pode solicitar, nos termos da LGPD:
- Confirmação de tratamento e acesso.
- Correção de dados incompletos, inexatos ou desatualizados.
- Portabilidade, quando cabível.
- Eliminação de dados tratados com consentimento, observadas exceções legais.
- Informações sobre compartilhamento.
- Revogação de consentimento, quando aplicável.

## 10. Canal de Privacidade
As solicitações de titulares e temas de privacidade devem ser tratadas pelos canais definidos contratualmente entre cliente e operador.

Sugestão de campo contratual:
- Encarregado (DPO): [NOME_DO_ENCARREGADO]
- E-mail: [EMAIL_DPO]

## 11. Transferência Internacional
A transferência internacional de dados, quando existir, deverá observar os mecanismos legais aplicáveis e cláusulas contratuais apropriadas.

## 12. Alterações desta Política
Esta política pode ser atualizada para refletir mudanças legais, regulatórias ou técnicas. A versão vigente deve permanecer publicada e versionada.

## 13. Aviso Importante
Este documento é um padrão técnico-operacional do produto e não substitui parecer jurídico. Recomenda-se validação final pelo jurídico do cliente antes da comercialização.
