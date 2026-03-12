# LGPD e Compliance

Este documento resume os controles de privacidade implementados no produto e aponta para os documentos legais oficiais do projeto.

## Documentos Oficiais

- Política de Privacidade: [POLITICA_PRIVACIDADE.md](POLITICA_PRIVACIDADE.md)
- Termos de Uso: [TERMOS_DE_USO.md](TERMOS_DE_USO.md)

## Escopo de Conformidade Técnica (produto)

O sistema possui recursos técnicos para apoiar obrigações da LGPD (Lei 13.709/2018), incluindo:

- Registro e revogação de consentimento.
- Solicitação de exclusão de dados e fluxo de aprovação.
- Exportação de dados pessoais por titular.
- Auditoria de processamento de dados pessoais.
- Logs operacionais de acesso com rastreabilidade.

## Endpoints LGPD Disponíveis

- `POST /api/lgpd/consent`
- `DELETE /api/lgpd/consent`
- `POST /api/lgpd/data-deletion`
- `GET /api/lgpd/data-export`
- `GET /api/lgpd/data-audit`
- `GET /api/lgpd/deletion-requests`
- `POST /api/lgpd/deletion-requests/{id}/approve`

## Bases Legais e Retenção

As bases legais e os prazos de retenção oficiais estão descritos em:

- [POLITICA_PRIVACIDADE.md](POLITICA_PRIVACIDADE.md)

## Aviso Importante

Este material descreve capacidades técnicas da aplicação e não substitui validação jurídica formal para cada cliente, contrato e setor regulado.
