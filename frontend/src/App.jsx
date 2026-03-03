import { useState, useEffect } from 'react'
import './App.css'

// Configurar URL da API
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://workflow-backend.onrender.com' : 'http://localhost:3000')

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('login')
  const [requisicoes, setRequisicoes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: 'DEPARTAMENTO'
  })
  const [editandoUsuario, setEditandoUsuario] = useState(null)
  const [usuarioParaEditar, setUsuarioParaEditar] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: ''
  })
  
  // Formulário de submissão
  const [novaRequisicao, setNovaRequisicao] = useState({
    descricao: '',
    valor: '',
    dataVencimento: ''
  })
  const [arquivoAnexado, setArquivoAnexado] = useState(null)
  const [arquivoBase64, setArquivoBase64] = useState(null)
  
  // Estados para câmera/escaneamento
  const [mostrarCamera, setMostrarCamera] = useState(false)
  const [stream, setStream] = useState(null)
  const [imagemCapturada, setImagemCapturada] = useState(null)
  
  // Modal de confirmação de pagamento
  const [pagamentoEmConfirmacao, setPagamentoEmConfirmacao] = useState(null)
  
  // Modal de análise de validação (documento)
  const [validacaoEmAnalise, setValidacaoEmAnalise] = useState(null)
  const [comentarioValidacao, setComentarioValidacao] = useState('')
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [mostraMotivoRejeicao, setMostraMotivoRejeicao] = useState(false)
  
  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }
  
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao autenticar')
      }

      if (data.token && data.user) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        setLoggedIn(true)
        setPage(data.user?.tipo === 'SUPER_ADMIN' ? 'usuarios' : 'dashboard')
        loadRequisicoes()
        if (data.user?.tipo === 'SUPER_ADMIN') {
          loadUsuarios(data.token)
        }
      } else {
        throw new Error('Resposta de autenticação inválida')
      }
    } catch (error) {
      alert('Erro no login: ' + error.message)
    }
  }
  
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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

  const loadUsuarios = async (tokenOverride = null) => {
    try {
      const token = tokenOverride || localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/usuarios`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const erro = await response.json()
        throw new Error(erro.error || 'Não foi possível carregar usuários')
      }

      const data = await response.json()
      setUsuarios(data.data || [])
    } catch (error) {
      alert('Erro ao carregar usuários: ' + error.message)
    }
  }

  const criarUsuario = async (e) => {
    e.preventDefault()

    if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha || !novoUsuario.tipo) {
      alert('Preencha todos os campos do novo usuário!')
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/usuarios`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(novoUsuario)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      alert('✅ Usuário criado com sucesso!')
      setNovoUsuario({ nome: '', email: '', senha: '', tipo: 'DEPARTAMENTO' })
      loadUsuarios()
    } catch (error) {
      alert('Erro ao criar usuário: ' + error.message)
    }
  }

  const iniciarEdicaoUsuario = (usuario) => {
    setEditandoUsuario(usuario.id)
    setUsuarioParaEditar({
      nome: usuario.nome,
      email: usuario.email,
      senha: '', // Senha em branco - só preenche se quiser alterar
      tipo: usuario.tipo
    })
  }

  const cancelarEdicaoUsuario = () => {
    setEditandoUsuario(null)
    setUsuarioParaEditar({ nome: '', email: '', senha: '', tipo: '' })
  }

  const salvarEdicaoUsuario = async (e) => {
    e.preventDefault()

    if (!usuarioParaEditar.nome || !usuarioParaEditar.email || !usuarioParaEditar.tipo) {
      alert('Nome, email e perfil são obrigatórios!')
      return
    }

    try {
      const payload = {
        nome: usuarioParaEditar.nome,
        email: usuarioParaEditar.email,
        tipo: usuarioParaEditar.tipo
      }

      // Só envia senha se foi preenchida
      if (usuarioParaEditar.senha.trim() !== '') {
        payload.senha = usuarioParaEditar.senha
      }

      const response = await fetch(`${API_URL}/api/usuarios/${editandoUsuario}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar usuário')
      }

      alert('✅ Usuário atualizado com sucesso!')
      cancelarEdicaoUsuario()
      loadUsuarios()
    } catch (error) {
      alert('Erro ao atualizar usuário: ' + error.message)
    }
  }
  
  const abrirAnaliseValidacao = (requisicao) => {
    setValidacaoEmAnalise(requisicao)
    setComentarioValidacao('')
    setMotivoRejeicao('')
    setMostraMotivoRejeicao(false)
  }

  const cancelarAnaliseValidacao = () => {
    setValidacaoEmAnalise(null)
    setComentarioValidacao('')
    setMotivoRejeicao('')
    setMostraMotivoRejeicao(false)
  }

  const confirmarValidacao = async () => {
    if (!validacaoEmAnalise) return
    
    try {
      const response = await fetch(`${API_URL}/api/validacoes/${validacaoEmAnalise.id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comentarioValidador: comentarioValidacao || ''
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao validar requisição')
      }

      alert('✅ Documento validado e aprovado para pagamento!')
      cancelarAnaliseValidacao()
      loadRequisicoes()
    } catch (error) {
      alert('Erro ao validar: ' + error.message)
    }
  }

  const rejeitarValidacao = async () => {
    if (!validacaoEmAnalise) return
    
    if (!motivoRejeicao.trim()) {
      alert('⚠️ Informe o motivo da rejeição!')
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/validacoes/${validacaoEmAnalise.id}/rejeitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motivo: motivoRejeicao
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao rejeitar requisição')
      }

      alert('❌ Documento rejeitado. Motivo registrado na auditoria.')
      cancelarAnaliseValidacao()
      loadRequisicoes()
    } catch (error) {
      alert('Erro ao rejeitar: ' + error.message)
    }
  }

  const aprovarRequisicao = async (id) => {
    // Abre modal de análise em vez de aprovar direto
    const requisicao = requisicoes.find(r => r.id === id)
    if (requisicao) {
      abrirAnaliseValidacao(requisicao)
    }
  }
  
  const pagarRequisicao = (id) => {
    // Abre modal de confirmação em vez de processar direto
    const requisicao = requisicoes.find(r => r.id === id)
    if (requisicao) {
      setPagamentoEmConfirmacao(requisicao)
    }
  }

  const confirmarPagamento = async () => {
    if (!pagamentoEmConfirmacao) return
    
    try {
      const response = await fetch(`${API_URL}/api/pagamentos/${pagamentoEmConfirmacao.id}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento')
      }

      alert('✅ Pagamento processado com sucesso!')
      setPagamentoEmConfirmacao(null)
      loadRequisicoes()
    } catch (error) {
      alert('Erro ao pagar: ' + error.message)
    }
  }

  const cancelarPagamento = () => {
    setPagamentoEmConfirmacao(null)
  }

  const reverterPagamento = async (id) => {
    if (!confirm('⚠️ Tem certeza que deseja reverter este pagamento?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/pagamentos/${id}/reverter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Erro ao reverter pagamento')
      }

      alert('✅ Pagamento revertido! Retornou para status VALIDADA ')
      loadRequisicoes()
    } catch (error) {
      alert('Erro ao reverter: ' + error.message)
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ Arquivo muito grande! Máximo: 5MB')
      e.target.value = ''
      return
    }

    // Validar tipo
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!tiposPermitidos.includes(file.type)) {
      alert('⚠️ Tipo de arquivo não permitido! Use: PDF, JPG, PNG ou WEBP')
      e.target.value = ''
      return
    }

    setArquivoAnexado(file)

    // Converter para Base64
    const reader = new FileReader()
    reader.onloadend = () => {
      setArquivoBase64({
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        dados: reader.result
      })
    }
    reader.readAsDataURL(file)
  }

  // Funções para escaneamento via câmera
  const abrirCamera = async () => {
    try {
      // Configuração otimizada para mobile e desktop
      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' }, // Câmera traseira em mobile, com fallback
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      setMostrarCamera(true)
      setImagemCapturada(null)
      
      // Aguardar um frame para o vídeo estar pronto
      setTimeout(() => {
        const video = document.getElementById('camera-preview')
        if (video) {
          video.srcObject = mediaStream
          // Garantir que o vídeo seja reproduzido (importante para iOS)
          video.play().catch(err => {
            console.log('Erro ao iniciar vídeo:', err)
          })
        }
      }, 100)
    } catch (error) {
      let mensagemErro = '❌ Erro ao acessar câmera:\n\n'
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        mensagemErro += '🚫 Permissão negada.\n\nVocê precisa autorizar o uso da câmera nas configurações do navegador.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        mensagemErro += '📷 Nenhuma câmera encontrada.\n\nVerifique se seu dispositivo tem câmera disponível.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        mensagemErro += '⚠️ Câmera em uso por outro aplicativo.\n\nFeche outros apps que estejam usando a câmera.'
      } else {
        mensagemErro += error.message
      }
      
      alert(mensagemErro)
    }
  }

  const capturarImagem = () => {
    const video = document.getElementById('camera-preview')
    const canvas = document.createElement('canvas')
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    
    // Converter para Base64
    const imagemDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setImagemCapturada(imagemDataUrl)
  }

  const confirmarCaptura = () => {
    if (!imagemCapturada) return
    
    // Criar objeto arquivo simulado para compatibilidade
    const timestamp = new Date().getTime()
    setArquivoBase64({
      nome: `documento-escaneado-${timestamp}.jpg`,
      tipo: 'image/jpeg',
      tamanho: Math.round(imagemCapturada.length * 0.75), // Estimativa do tamanho
      dados: imagemCapturada
    })
    
    setArquivoAnexado({ name: `documento-escaneado-${timestamp}.jpg` })
    fecharCamera()
    alert('✅ Documento escaneado com sucesso!')
  }

  const recapturar = () => {
    setImagemCapturada(null)
  }

  const fecharCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setMostrarCamera(false)
    setImagemCapturada(null)
  }

  const submeterRequisicao = async (e) => {
    e.preventDefault()
    
    if (!novaRequisicao.descricao || !novaRequisicao.valor || !novaRequisicao.dataVencimento) {
      alert('Preencha todos os campos!')
      return
    }

    if (!arquivoBase64) {
      alert('⚠️ Anexe um documento (boleto, nota fiscal ou fatura)!')
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
          usuario: user?.nome,
          anexo: arquivoBase64
        })
      })
      
      if (response.ok) {
        alert('✅ Requisição enviada para validação!')
        setNovaRequisicao({ descricao: '', valor: '', dataVencimento: '' })
        setArquivoAnexado(null)
        setArquivoBase64(null)
        // Limpar input file
        const fileInput = document.querySelector('input[type="file"]')
        if (fileInput) fileInput.value = ''
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
    const userStorage = localStorage.getItem('user')

    if (!token || !userStorage) {
      setLoggedIn(false)
      setUser(null)
      setPage('login')
      return
    }

    try {
      const parsedUser = JSON.parse(userStorage)
      setUser(parsedUser)
      setLoggedIn(true)
      setPage(parsedUser?.tipo === 'SUPER_ADMIN' ? 'usuarios' : 'dashboard')
      loadRequisicoes()
      if (parsedUser?.tipo === 'SUPER_ADMIN') {
        loadUsuarios(token)
      }
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setLoggedIn(false)
      setUser(null)
      setPage('login')
    }
  }, [])

  // Limpar stream da câmera quando componente desmontar
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // Prevenir scroll do body quando modal da câmera estiver aberto
  useEffect(() => {
    if (mostrarCamera || pagamentoEmConfirmacao || validacaoEmAnalise || editandoUsuario) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mostrarCamera, pagamentoEmConfirmacao, validacaoEmAnalise, editandoUsuario])

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
            <p>superadmin@empresa.com / 123456</p>
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
          {user?.tipo !== 'FINANCEIRO' && user?.tipo !== 'VALIDACAO' && user?.tipo !== 'SUPER_ADMIN' && (
            <button onClick={() => { setPage('submissao'); loadRequisicoes(); }} className={page === 'submissao' ? 'active' : ''}>
              📤 Submissão
            </button>
          )}

          {user?.tipo === 'SUPER_ADMIN' && (
            <button onClick={() => { setPage('usuarios'); loadUsuarios(); }} className={page === 'usuarios' ? 'active' : ''}>
              👑 Usuários
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
        {page === 'usuarios' && user?.tipo === 'SUPER_ADMIN' && (
          <div>
            <h1>👑 Gestão de Usuários</h1>
            <p className="subtitle">Crie logins para financeiro, validação e equipes de submissão</p>

            <div className="form-container">
              <form onSubmit={criarUsuario} className="submission-form">
                <div className="form-group">
                  <label>👤 Nome</label>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={novoUsuario.nome}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>📧 Email</label>
                  <input
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={novoUsuario.email}
                    onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>🔐 Senha</label>
                    <input
                      type="password"
                      placeholder="Senha inicial"
                      value={novoUsuario.senha}
                      onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>🏷️ Perfil</label>
                    <select
                      value={novoUsuario.tipo}
                      onChange={(e) => setNovoUsuario({ ...novoUsuario, tipo: e.target.value })}
                      required
                    >
                      <option value="DEPARTAMENTO">Equipe de Submissão</option>
                      <option value="VALIDACAO">Validador</option>
                      <option value="FINANCEIRO">Financeiro</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-submit">✅ Criar Usuário</button>
              </form>
            </div>

            <h2>👥 Usuários Cadastrados</h2>
            {usuarios.length === 0 ? (
              <p className="empty-message">Nenhum usuário encontrado</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Perfil</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id}>
                      <td>{u.nome}</td>
                      <td>{u.email}</td>
                      <td>{u.tipo}</td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                      <td>
                        <button 
                          onClick={() => iniciarEdicaoUsuario(u)}
                          className="btn-edit"
                          title="Editar usuário"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Modal de Edição */}
            {editandoUsuario && (
              <div className="modal-overlay" onClick={cancelarEdicaoUsuario}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>✏️ Editar Usuário</h2>
                  <form onSubmit={salvarEdicaoUsuario} className="submission-form">
                    <div className="form-group">
                      <label>👤 Nome</label>
                      <input
                        type="text"
                        placeholder="Nome completo"
                        value={usuarioParaEditar.nome}
                        onChange={(e) => setUsuarioParaEditar({ ...usuarioParaEditar, nome: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>📧 Email</label>
                      <input
                        type="email"
                        placeholder="usuario@empresa.com"
                        value={usuarioParaEditar.email}
                        onChange={(e) => setUsuarioParaEditar({ ...usuarioParaEditar, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>🔐 Nova Senha (deixe em branco para manter)</label>
                        <input
                          type="password"
                          placeholder="Nova senha (opcional)"
                          value={usuarioParaEditar.senha}
                          onChange={(e) => setUsuarioParaEditar({ ...usuarioParaEditar, senha: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>🏷️ Perfil</label>
                        <select
                          value={usuarioParaEditar.tipo}
                          onChange={(e) => setUsuarioParaEditar({ ...usuarioParaEditar, tipo: e.target.value })}
                          required
                        >
                          <option value="SUPER_ADMIN">Super Admin</option>
                          <option value="ADMIN">Administrador</option>
                          <option value="VALIDACAO">Validador</option>
                          <option value="FINANCEIRO">Financeiro</option>
                          <option value="DEPARTAMENTO">Equipe de Submissão</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <button type="button" onClick={cancelarEdicaoUsuario} className="btn-cancel">
                        ❌ Cancelar
                      </button>
                      <button type="submit" className="btn-submit">
                        ✅ Salvar Alterações
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

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

                <div className="form-group">
                  <label>📎 Anexar Documento (Boleto, NF ou Fatura)</label>
                  
                  <div className="upload-options">
                    <div className="upload-option">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileChange}
                        className="file-input"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="file-input-label">
                        📁 Selecionar Arquivo
                      </label>
                    </div>
                    
                    <div className="upload-divider">ou</div>
                    
                    <div className="upload-option">
                      <button 
                        type="button" 
                        onClick={abrirCamera}
                        className="btn-camera"
                      >
                        📷 Escanear Documento
                      </button>
                    </div>
                  </div>
                  
                  {arquivoAnexado && (
                    <div className="file-info">
                      ✅ {arquivoAnexado.name} ({(arquivoAnexado.size / 1024)?.toFixed(0) || 'N/A'} KB)
                    </div>
                  )}
                  <small className="help-text">Formatos aceitos: PDF, JPG, PNG, WEBP (máx. 5MB)</small>
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
                  <th>Documento</th>
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
                      {req.anexo ? (
                        <a 
                          href={req.anexo.dados} 
                          download={req.anexo.nome}
                          className="anexo-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📎 {req.anexo.nome}
                        </a>
                      ) : (
                        <span style={{color: '#999'}}>Sem anexo</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-success" onClick={() => aprovarRequisicao(req.id)}>
                        Aprovar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Modal de Análise de Validação */}
            {validacaoEmAnalise && (
              <div className="modal-overlay" onClick={cancelarAnaliseValidacao}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>🔍 Análise de Documento para Validação</h2>
                  
                  <div className="payment-details">
                    <div className="detail-row">
                      <strong>Número:</strong>
                      <span>{validacaoEmAnalise.numero}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Descrição:</strong>
                      <span>{validacaoEmAnalise.descricao}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Valor:</strong>
                      <span style={{fontSize: '16px', fontWeight: 'bold', color: '#667eea'}}>
                        R$ {validacaoEmAnalise.valor.toFixed(2)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <strong>Vencimento:</strong>
                      <span>{new Date(validacaoEmAnalise.dataVencimento).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Departamento:</strong>
                      <span>{validacaoEmAnalise.departamento || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={{marginTop: '20px', marginBottom: '20px'}}>
                    <strong>📄 Documento para Análise:</strong>
                    {validacaoEmAnalise.anexo ? (
                      <iframe 
                        src={`${validacaoEmAnalise.anexo.dados}#toolbar=0&navpanes=0&scrollbar=0`}
                        style={{
                          width: '100%',
                          height: '350px',
                          border: '2px solid #667eea',
                          borderRadius: '8px',
                          marginTop: '10px'
                        }}
                        title="Documento para análise"
                      />
                    ) : (
                      <p style={{color: '#999', marginTop: '10px'}}>Nenhum documento anexado</p>
                    )}
                    {validacaoEmAnalise.anexo && (
                      <a 
                        href={validacaoEmAnalise.anexo.dados} 
                        download={validacaoEmAnalise.anexo.nome}
                        style={{display: 'inline-block', marginTop: '10px'}}
                        className="anexo-link"
                      >
                        ⬇️ Baixar Documento
                      </a>
                    )}
                  </div>

                  <div className="form-group">
                    <label>💬 Comentário da Validação (Opcional)</label>
                    <textarea 
                      placeholder="Ex: Documento verificado, assinatura válida, não é fraude"
                      value={comentarioValidacao}
                      onChange={(e) => setComentarioValidacao(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '12px',
                        border: '2px solid #e1e8ed',
                        borderRadius: '8px',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {mostraMotivoRejeicao && (
                    <div className="form-group">
                      <label style={{color: '#dc2626'}}>❌ Motivo da Rejeição *</label>
                      <textarea 
                        placeholder="Informe o motivo: documento inválido, suspeita de fraude, assinatura inconsistente, etc"
                        value={motivoRejeicao}
                        onChange={(e) => setMotivoRejeicao(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '100px',
                          padding: '12px',
                          border: '2px solid #dc2626',
                          borderRadius: '8px',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          resize: 'vertical'
                        }}
                        autoFocus
                      />
                    </div>
                  )}

                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '20px'}}>
                    <button type="button" onClick={cancelarAnaliseValidacao} className="btn-cancel">
                      ← Voltar
                    </button>
                    {mostraMotivoRejeicao ? (
                      <>
                        <button 
                          type="button" 
                          onClick={() => setMostraMotivoRejeicao(false)} 
                          className="btn-edit"
                        >
                          ← Voltar
                        </button>
                        <button type="button" onClick={rejeitarValidacao} className="btn-danger">
                          ❌ Confirmar Rejeição
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          type="button" 
                          onClick={() => setMostraMotivoRejeicao(true)} 
                          className="btn-danger"
                        >
                          ❌ Rejeitar
                        </button>
                        <button type="button" onClick={confirmarValidacao} className="btn-success" style={{fontSize: '16px', padding: '12px 24px'}}>
                          ✅ Validar e Aprovar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {page === 'pagamentos' && (
          <div>
            <h1>💰 Pagamentos</h1>
            
            <h2>⏳ Pagamentos Pendentes</h2>
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Documento</th>
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
                      {req.anexo ? (
                        <a 
                          href={req.anexo.dados} 
                          download={req.anexo.nome}
                          className="anexo-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📎 {req.anexo.nome}
                        </a>
                      ) : (
                        <span style={{color: '#999'}}>Sem anexo</span>
                      )}
                    </td>
                    <td>
                      <button className="btn-primary" onClick={() => pagarRequisicao(req.id)}>
                        Processar Pagamento
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {requisicoes.filter(r => r.status === 'VALIDADA').length === 0 && (
              <p className="empty-message">Nenhum pagamento pendente</p>
            )}

            <h2 style={{marginTop: '40px'}}>✅ Pagamentos Finalizados</h2>
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Documento</th>
                  <th>Pago em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {requisicoes.filter(r => r.status === 'FINALIZADO').map(req => (
                  <tr key={req.id} style={{opacity: 0.8}}>
                    <td>{req.numero}</td>
                    <td>{req.descricao}</td>
                    <td>R$ {req.valor.toFixed(2)}</td>
                    <td><span className={`badge ${req.status.toLowerCase()}`}>{req.status}</span></td>
                    <td>
                      {req.anexo ? (
                        <a 
                          href={req.anexo.dados} 
                          download={req.anexo.nome}
                          className="anexo-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📎 {req.anexo.nome}
                        </a>
                      ) : (
                        <span style={{color: '#999'}}>Sem anexo</span>
                      )}
                    </td>
                    <td>{req.pagoEm ? new Date(req.pagoEm).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>
                      <button 
                        className="btn-danger" 
                        onClick={() => reverterPagamento(req.id)}
                      >
                        ↩️ Reverter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {requisicoes.filter(r => r.status === 'FINALIZADO').length === 0 && (
              <p className="empty-message">Nenhum pagamento finalizado</p>
            )}

            {/* Modal de Escaneamento via Câmera */}
            {mostrarCamera && (
              <div className="modal-overlay" onClick={fecharCamera}>
                <div className="modal-content camera-modal" onClick={(e) => e.stopPropagation()}>
                  <h2>📷 Escanear Documento</h2>
                  
                  {!imagemCapturada ? (
                    <div className="camera-container">
                      <p className="help-text">Posicione o documento dentro da área e clique em Capturar</p>
                      <video 
                        id="camera-preview" 
                        autoPlay 
                        playsInline
                        muted
                        className="camera-preview"
                      />
                      
                      <div className="camera-controls">
                        <button type="button" onClick={fecharCamera} className="btn-cancel">
                          ❌ Cancelar
                        </button>
                        <button type="button" onClick={capturarImagem} className="btn-primary">
                          📸 Capturar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="capture-preview">
                      <p className="help-text">Confira se o documento ficou legível</p>
                      <img 
                        src={imagemCapturada} 
                        alt="Documento capturado" 
                        className="captured-image"
                      />
                      
                      <div className="camera-controls">
                        <button type="button" onClick={recapturar} className="btn-cancel">
                          🔄 Capturar Novamente
                        </button>
                        <button type="button" onClick={confirmarCaptura} className="btn-success">
                          ✅ Usar Esta Imagem
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal de Confirmação de Pagamento */}
            {pagamentoEmConfirmacao && (
              <div className="modal-overlay" onClick={cancelarPagamento}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>💳 Confirmar Pagamento</h2>
                  
                  <div className="payment-details">
                    <div className="detail-row">
                      <strong>Número:</strong>
                      <span>{pagamentoEmConfirmacao.numero}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Descrição:</strong>
                      <span>{pagamentoEmConfirmacao.descricao}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Valor:</strong>
                      <span style={{fontSize: '18px', fontWeight: 'bold', color: '#10b981'}}>
                        R$ {pagamentoEmConfirmacao.valor.toFixed(2)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <strong>Vencimento:</strong>
                      <span>{new Date(pagamentoEmConfirmacao.dataVencimento).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div style={{marginTop: '20px', marginBottom: '20px'}}>
                    <strong>📎 Documento para escanear código de barras:</strong>
                    {pagamentoEmConfirmacao.anexo ? (
                      <iframe 
                        src={`${pagamentoEmConfirmacao.anexo.dados}#toolbar=0&navpanes=0&scrollbar=0`}
                        style={{
                          width: '100%',
                          height: '400px',
                          border: '2px solid #667eea',
                          borderRadius: '8px',
                          marginTop: '10px'
                        }}
                        title="Documento para pagamento"
                      />
                    ) : (
                      <p style={{color: '#999', marginTop: '10px'}}>Nenhum documento anexado</p>
                    )}
                  </div>

                  <div className="form-row">
                    <button type="button" onClick={cancelarPagamento} className="btn-cancel">
                      ❌ Cancelar
                    </button>
                    <button type="button" onClick={confirmarPagamento} className="btn-success" style={{fontSize: '16px', padding: '12px 24px'}}>
                      ✅ Confirmar Pagamento
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
