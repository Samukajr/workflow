# Contributing

## 🤝 Contribuindo para o Projeto

Obrigado por considerar contribuir para o Workflow de Pagamentos! Este documento descreve as diretrizes para contribuições.

## 📋 Como Contribuir

### Antes de Começar

1. Fork o repositório
2. Clone o fork: `git clone https://github.com/SEU_USUARIO/workflow.git`
3. Crie uma branch: `git checkout -b feature/sua-feature`
4. Instale as dependências: `npm install`
5. Configure arquivo .env para desenvolvimento

### Desenvolvendo

#### Estrutura de Branches
```
main                 # Produção
├── develop          # Desenvolvimento
├── feature/xxx      # Novas funcionalidades
├── fix/xxx          # Correção de bugs
└── docs/xxx         # Documentação
```

#### Padrão de Commit
```
[TIPO]: Descrição breve

Descrição detalhada (opcional)

Fixes: #123
```

**TIPOS:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

**Exemplo:**
```
feat: Adicionar validação de CNPJ

Implementa validação de CNPJ em requisições
Adiciona testes unitários
Atualiza documentação

Fixes: #45
```

### Código

#### Padrões TypeScript
```typescript
// ✅ Bom
export const createUser = async (userData: UserInput): Promise<User> => {
  validate(userData);
  const user = await db.user.create(userData);
  return user;
};

// ❌ Evitar
async function createUser(data) {
  return await db.user.create(data);
}
```

#### Nomes
- Classes: `PascalCase` (ex: `UserService`)
- Funções: `camelCase` (ex: `getUserById`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `MAX_ATTEMPTS`)
- Interfaces: prefixo `I` (ex: `IUser`)
- Types: nenhum prefixo (ex: `UserInput`)

#### Eslint e Type Check
```bash
# Antes de fazer commit
npm run lint
npm run type-check
npm run test
```

### Testing

```typescript
// Padrão de testes
describe('UserService', () => {
  it('deve criar usuário com dados válidos', async () => {
    const user = await userService.create(validData);
    expect(user).toHaveProperty('id');
  });

  it('deve falhar com dados inválidos', async () => {
    await expect(userService.create(invalidData)).rejects.toThrow();
  });
});
```

### Segurança

- Nunca commite `.env` ou chaves privadas
- Validar sempre inputs de usuário
- Escapar dados para evitar XSS
- Usar HTTPS em produção
- Hash de senhas com bcrypt
- Implementar rate limiting

### Documentação

- Atualize `README.md` com mudanças
- Adicione comentários em lógica complexa
- Documente novas APIs em `docs/API.md`
- Use JSDoc para funções importantes

```typescript
/**
 * Cria nova requisição de pagamento
 * @param {RequisicaoInput} data - Dados da requisição
 * @returns {Promise<Requisicao>} Requisição criada
 * @throws {ValidationError} Se dados inválidos
 */
export const createRequisicao = async (data: RequisicaoInput): Promise<Requisicao> => {
  // ...implementação
};
```

### Performance

- Minimize queries ao banco de dados
- Use paginação em listagens
- Implemente cache quando apropriado
- Otimize imagens e assets
- Profiles antes e depois de changes

### Acessibilidade

- Componentes com labels adequados
- Teclado navegável
- Cores com contraste suficiente
- ARIA attributes quando necessário

## 🔄 Processo de Review

1. Push sua branch: `git push origin feature/sua-feature`
2. Abra uma Pull Request
3. Preencha o template de PR
4. Aguarde review do time
5. Responda aos comentários
6. Merge após aprovação

### Checklist de PR
- [ ] Testes escritos/atualizados
- [ ] Lint passou (`npm run lint`)
- [ ] Type checking passou (`npm run type-check`)
- [ ] Documentação atualizada
- [ ] Sem console.log ou debug code
- [ ] Commits seguem o padrão
- [ ] LGPD considerada (se dados pessoais)

## 📚 Stack Tecnológico

**Backend:**
- Node.js 18+
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL

**Frontend:**
- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Zustand

**DevOps:**
- Docker
- Docker Compose
- GitHub Actions (CI/CD)

## 🆘 Precisa de Ajuda?

- Dúvidas: Abra uma Discussion
- Bugs: Abra uma Issue com detalhes
- Features: Sugira em Discussions

## ✅ Antes de Submeter

```bash
# Rodar tudo
npm run lint
npm run type-check
npm run test
npm run build

# Se tudo passou ✅
git push origin feature/sua-feature
```

## 📝 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).

---

Obrigado por contribuir! 🙏
