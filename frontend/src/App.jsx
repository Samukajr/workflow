import { useState, useEffect } from 'react'
import './App.css'

// Configurar URL da API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('login')
  const [requisicoes, setRequisicoes] = useState([])
  
  // Formulário de submissão
  const [novaRequisicao, setNovaRequisicao] = useState({
    descricao: '',
    valor: '',
    dataVencimento: ''
  })
  
  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()
      if (data.token) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        setLoggedIn(true)
        setPage('dashboard')
        loadRequisicoes()
      }
    } catch (error) {
      alert('Erro no login: ' + error.message)
    }
  }
  
  const handleLogout = () => {
    localStorage.removeItem('token')
    setLoggedIn(false)
    setUser(null)
    setPage('login')
  }
  
  const loadRequisicoes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/requisicoes`)
      const data = await response.json()
      setRequisicoes(data.data || [])
    } catch (error) {
      console.error('Erro ao carregar requisições:', error)
    }
  }
  
  const aprovarRequisicao = async (id) => {
    try {
      await fetch(`${API_URL}/api/validacoes/${id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      alert('Requisição aprovada!')
      loadRequisicoes()
    } catch (error) {
      alert('Erro ao aprovar: ' + error.message)
    }
  }
  
  const pagarRequisicao = async (id) => {
    try {
      await fetch(`${API_URL}/api/pagamentos/${id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      alert('Pagamento realizado!')
      loadRequisicoes()
    } catch (error) {
      alert('Erro ao pagar: ' + error.message)
    }
  }

  const submeterRequisicao = async (e) => {
    e.preventDefault()
    
    if (!novaRequisicao.descricao || !novaRequisicao.valor || !novaRequisicao.dataVencimento) {
      alert('Preencha todos os campos!')
      return
    }
    
    try {
      const response = await fetch(`${API_URL}/api/requisicoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: novaRequisicao.descricao,
          valor: parseFloat(novaRequisicao.valor),
          dataVencimento: novaRequisicao.dataVencimento,
          departamento: user?.departamento,
          usuario: user?.nome
        })
      })
      
      if (response.ok) {
        alert('✅ Requisição enviada para validação!')
        setNovaRequisicao({ descricao: '', valor: '', dataVencimento: '' })
        loadRequisicoes()
      } else {
        alert('Erro ao enviar requisição')
      }
    } catch (error) {
      alert('Erro: ' + error.message)
    }
  }
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Aqui você pode validar o token no backend
      setLoggedIn(true)
    }
  }, [])

  if (!loggedIn) {
    return (
      <div className="container">
        <div className="card">
          <h1>🔐 Workflow de Pagamentos</h1>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Entrar</button>
          </form>
          <div className="demo-users">
            <h3>👥 Usuários de Teste:</h3>
            <p>admin@empresa.com / 123456</p>
            <p>validador@empresa.com / 123456</p>
            <p>financeiro@empresa.com / 123456</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h2>💰 Workflow de Pagamentos</h2>
        <div className="nav-buttons">
          {/* Menu condicional por tipo de usuário */}
          {user?.tipo !== 'FINANCEIRO' && user?.tipo !== 'VALIDACAO' && (
            <button onClick={() => { setPage('submissao'); loadRequisicoes(); }} className={page === 'submissao' ? 'active' : ''}>
              📤 Submissão
            </button>
          )}
          
          <button onClick={() => { setPage('dashboard'); loadRequisicoes(); }} className={page === 'dashboard' ? 'active' : ''}>
            📊 Dashboard
          </button>
          
          {user?.tipo === 'VALIDACAO' && (
            <button onClick={() => { setPage('validacoes'); loadRequisicoes(); }} className={page === 'validacoes' ? 'active' : ''}>
              ✅ Validações
            </button>
          )}
          
          {user?.tipo === 'FINANCEIRO' && (
            <button onClick={() => { setPage('pagamentos'); loadRequisicoes(); }} className={page === 'pagamentos' ? 'active' : ''}>
              💳 Pagamentos
            </button>
          )}
          
          <span className="user-info">👤 {user?.nome}</span>
          <button className="logout-btn" onClick={handleLogout}>🚪 Sair</button>
        </div>
      </nav>

      <div className="content">
        {page === 'submissao' && (
          <div>
            <h1>📤 Submissão de Boletos e Notas Fiscais</h1>
            <p className="subtitle">Envie boletos, notas fiscais ou prestações para validação</p>
            
            <div className="form-container">
              <form onSubmit={submeterRequisicao} className="submission-form">
                <div className="form-group">
                  <label>📋 Descrição do Documento</label>
                  <input
                    type="text"
                    placeholder="Ex: Fatura Telefônica, Boleto Fornecedor, etc"
                    value={novaRequisicao.descricao}
                    onChange={(e) => setNovaRequisicao({ ...novaRequisicao, descricao: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>💰 Valor (R$)</label>
                    <input
                      type="number"
                      placeholder="0,00"
                      step="0.01"
                      value={novaRequisicao.valor}
                      onChange={(e) => setNovaRequisicao({ ...novaRequisicao, valor: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>📅 Data de Vencimento</label>
                    <input
                      type="date"
                      value={novaRequisicao.dataVencimento}
                      onChange={(e) => setNovaRequisicao({ ...novaRequisicao, dataVencimento: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <button type="submit" className="btn-submit">✅ Enviar para Validação</button>
              </form>
            </div>
            
            <h2>📋 Histórico de Submissões</h2>
            {requisicoes.length === 0 ? (
              <p className="empty-message">Nenhuma requisição enviada ainda</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requisicoes.map(req => (
                    <tr key={req.id}>
                      <td><strong>{req.numero}</strong></td>
                      <td>{req.descricao}</td>
                      <td>R$ {req.valor.toFixed(2)}</td>
                      <td>{new Date(req.dataVencimento).toLocaleDateString('pt-BR')}</td>
                      <td><span className={`badge ${req.status.toLowerCase()}`}>{req.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {page === 'dashboard' && (
          <div>
            <h1>📊 Dashboard</h1>
            <div className="stats">
              <div className="stat-card">
                <h3>{requisicoes.filter(r => r.status === 'PENDENTE').length}</h3>
                <p>Pendentes</p>
              </div>
              <div className="stat-card">
                <h3>{requisicoes.filter(r => r.status === 'VALIDADA').length}</h3>
                <p>Validadas</p>
              </div>
              <div className="stat-card">
                <h3>{requisicoes.filter(r => r.status === 'PAGA').length}</h3>
                <p>Pagas</p>
              </div>
            </div>
            <h2>Todas as Requisições</h2>
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {requisicoes.map(req => (
                  <tr key={req.id}>
                    <td>{req.numero}</td>
                    <td>{req.descricao}</td>
                    <td>R$ {req.valor.toFixed(2)}</td>
                    <td><span className={`badge ${req.status.toLowerCase()}`}>{req.status}</span></td>
                    <td>{new Date(req.dataVencimento).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {page === 'validacoes' && (
          <div>
            <h1>✅ Validações Pendentes</h1>
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {requisicoes.filter(r => r.status === 'PENDENTE' || r.status === 'VALIDANDO').map(req => (
                  <tr key={req.id}>
                    <td>{req.numero}</td>
                    <td>{req.descricao}</td>
                    <td>R$ {req.valor.toFixed(2)}</td>
                    <td><span className={`badge ${req.status.toLowerCase()}`}>{req.status}</span></td>
                    <td>
                      <button className="btn-success" onClick={() => aprovarRequisicao(req.id)}>
                        Aprovar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {page === 'pagamentos' && (
          <div>
            <h1>💰 Pagamentos</h1>
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {requisicoes.filter(r => r.status === 'VALIDADA').map(req => (
                  <tr key={req.id}>
                    <td>{req.numero}</td>
                    <td>{req.descricao}</td>
                    <td>R$ {req.valor.toFixed(2)}</td>
                    <td><span className={`badge ${req.status.toLowerCase()}`}>{req.status}</span></td>
                    <td>
                      <button className="btn-primary" onClick={() => pagarRequisicao(req.id)}>
                        Processar Pagamento
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
