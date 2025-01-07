/************************************************
 * script.js
 ************************************************/
document.addEventListener('DOMContentLoaded', () => {
  // ==========================
  // 1. SELETORES E VARIÁVEIS
  // ==========================
  const ticketForm           = document.getElementById('ticket-form');
  const popupExcluir         = document.getElementById('popup-excluir');
  const popupDetalhes        = document.getElementById('popup-detalhes');
  const confirmarExclusao    = document.getElementById('confirmar-exclusao');
  const cancelarExclusao     = document.getElementById('cancelar-exclusao');
  const closeModalButton     = document.getElementById('close-modal');
  const chatBox              = document.getElementById('chat-box');
  const listaObservacoes     = document.getElementById('lista-observacoes');
  const adicionarObservacao  = document.getElementById('adicionar-observacao');
  const novoAnexo            = document.getElementById('novo-anexo');
  const enviarMensagemButton = document.getElementById('enviar-mensagem');
  const anexoLabel           = document.querySelector('.anexo-label');
  const convidadosInput      = document.getElementById('adicionar-convidado');
  const listaConvidados      = document.getElementById('convidados-list');
  const downloadJsonButton   = document.getElementById('download-json');
  const downloadXlsxButton   = document.getElementById('download-xlsx');
  const toggleThemeButton    = document.getElementById('toggle-theme');
  const painelCards          = document.querySelectorAll('.painel-card');
  const searchInput          = document.getElementById('search');
  const tabs                 = document.querySelectorAll('.tab-button');
  const tabContents          = document.querySelectorAll('.tab-content');

  // Selects do Form
  const selectCliente    = document.getElementById('cliente');
  const selectRede       = document.getElementById('rede');
  const selectMotivo     = document.getElementById('motivo');
  const selectPrioridade = document.getElementById('prioridade');
  const selectVeiculo    = document.getElementById('veiculo');

  // Usuário logado e perfil
  const usuarioLogado = localStorage.getItem('emailUsuario');
  const perfilUsuario = localStorage.getItem('perfilUsuario');

  // Arrays no localStorage
  let observacoes = JSON.parse(localStorage.getItem('observacoes')) || [];
  let tickets     = JSON.parse(localStorage.getItem('tickets'))     || [];

  // ID temporário para exclusão
  let excluirTicketId = null;

  // Objeto para sugestões de usuários
  let usuariosAtivos = {};

  // ===================================
  // 2. FUNÇÕES UTILITÁRIAS
  // ===================================
  function removerDominio(email) {
    return email
      .replace('@grupononna.com.br', '')
      .replace(/\./g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function formatarDataHora(isoString) {
    const data = new Date(isoString);
    return (
      data.toLocaleDateString('pt-BR') +
      ', ' +
      data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }

  function calculateTempoAberto(dataInicio, dataFim = null) {
    if (!dataInicio) return 'Aguardando início';
    const inicio = new Date(dataInicio);
    const fim    = dataFim ? new Date(dataFim) : new Date();
    const diffMs = fim - inicio;

    const diffDays    = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours   = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${diffDays} dias, ${diffHours} horas, ${diffMinutes} minutos, ${diffSeconds} segundos`;
  }

  function parseDateTime(dateStr) {
    if (!dateStr) return null;
    if (dateStr.includes('T')) {
      return new Date(dateStr);
    } else {
      return parseMySQLDateTime(dateStr);
    }
  }

  function parseMySQLDateTime(mysqlDateTime) {
    if (!mysqlDateTime) return null;
    const [datePart, timePart] = mysqlDateTime.split(' ');
    const [ano, mes, dia]      = datePart.split('-');
    const [hora, minuto, segundo] = timePart ? timePart.split(':') : ['00','00','00'];
    return new Date(ano, mes - 1, dia, hora, minuto, segundo);
  }

  /**
   * Preenche um <select> com array de strings
   */
  function preencherSelect(selectElement, items) {
    selectElement.innerHTML = '';
    const optionVazia = document.createElement('option');
    optionVazia.value = '';
    optionVazia.textContent = `Selecione ${selectElement.name || ''}`.trim();
    selectElement.appendChild(optionVazia);

    items.forEach(item => {
      if (item && item.trim() !== '') {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        selectElement.appendChild(option);
      }
    });
  }

  // ==========================================
  // 3. CARREGAR DADOS DO BANCO
  // ==========================================
  function carregarSelectClientes() {
    fetch('http://127.0.0.1:3000/clientes')
      .then(resp => {
        if (!resp.ok) throw new Error(`Erro ao buscar clientes: ${resp.statusText}`);
        return resp.json();
      })
      .then(clientes => {
        preencherSelect(selectCliente, clientes);
        // Ativar select2 para #cliente
        $('#cliente').select2({
          placeholder: 'Pesquise ou selecione...',
          // Remover ícone de limpar
          allowClear: false,
          // Forçar mostrar caixa de busca sempre
          minimumResultsForSearch: 0
        }).on('select2:open', () => {
          // Foca automaticamente no campo de busca
          const searchField = document.querySelector('.select2-search__field');
          if (searchField) {
            searchField.focus();
          }
        });
      })
      .catch(err => {
        console.error('Falha ao carregar clientes:', err);
      });
  }

  function carregarSelectRedes() {
    fetch('http://127.0.0.1:3000/redes')
      .then(resp => {
        if (!resp.ok) throw new Error(`Erro ao buscar redes: ${resp.statusText}`);
        return resp.json();
      })
      .then(redes => {
        preencherSelect(selectRede, redes);
        // Ativar select2 para #rede
        $('#rede').select2({
          placeholder: 'Pesquise ou selecione...',
          allowClear: false,
          minimumResultsForSearch: 0
        }).on('select2:open', () => {
          const searchField = document.querySelector('.select2-search__field');
          if (searchField) searchField.focus();
        });
      })
      .catch(err => {
        console.error('Falha ao carregar redes:', err);
      });
  }

  function carregarSelectMotivos() {
    fetch('http://127.0.0.1:3000/motivos')
      .then(resp => {
        if (!resp.ok) throw new Error(`Erro ao buscar motivos: ${resp.statusText}`);
        return resp.json();
      })
      .then(motivos => {
        preencherSelect(selectMotivo, motivos);
        // Ativar select2 para #motivo
        $('#motivo').select2({
          placeholder: 'Pesquise ou selecione...',
          allowClear: false,
          minimumResultsForSearch: 0
        }).on('select2:open', () => {
          const searchField = document.querySelector('.select2-search__field');
          if (searchField) searchField.focus();
        });
      })
      .catch(err => {
        console.error('Falha ao carregar motivos:', err);
      });
  }

  function carregarSelectPrioridades() {
    const prioridades = ['Baixa', 'Média', 'Alta'];
    preencherSelect(selectPrioridade, prioridades);
    // Iniciar select2
    $('#prioridade').select2({
      placeholder: 'Pesquise ou selecione...',
      allowClear: false,
      minimumResultsForSearch: 0
    }).on('select2:open', () => {
      const searchField = document.querySelector('.select2-search__field');
      if (searchField) searchField.focus();
    });
  }

  function carregarSelectVeiculos() {
    const veiculos = ['E-Mail', 'WhatsApp', 'Telefone', 'Reunião'];
    preencherSelect(selectVeiculo, veiculos);
    // Iniciar select2
    $('#veiculo').select2({
      placeholder: 'Pesquise ou selecione...',
      allowClear: false,
      minimumResultsForSearch: 0
    }).on('select2:open', () => {
      const searchField = document.querySelector('.select2-search__field');
      if (searchField) searchField.focus();
    });
  }

  function carregarTicketsDoBanco() {
    fetch('http://127.0.0.1:3000/tickets')
      .then(response => {
        if (!response.ok) throw new Error(`Erro ao buscar tickets: ${response.statusText}`);
        return response.json();
      })
      .then(ticketsBanco => {
        const ticketsLocal = JSON.parse(localStorage.getItem('tickets')) || [];
        const ticketsMesclados = mesclarTickets(ticketsBanco, ticketsLocal);
        localStorage.setItem('tickets', JSON.stringify(ticketsMesclados));
        tickets = ticketsMesclados;
        updateTickets();
      })
      .catch(error => {
        console.error('Erro na requisição de tickets:', error);
      });
  }

  function carregarObservacoesDoBanco() {
    fetch('http://127.0.0.1:3000/observacoes')
      .then(response => {
        if (!response.ok) throw new Error(`Erro ao buscar observações: ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        localStorage.setItem('observacoes', JSON.stringify(data));
        observacoes = data;
      })
      .catch(error => {
        console.error('Erro ao buscar observações:', error);
      });
  }

  function carregarAnexosDoBanco() {
    fetch('http://127.0.0.1:3000/anexos')
      .then(response => {
        if (!response.ok) throw new Error(`Erro ao buscar anexos: ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        console.log('Anexos carregados:', data);
      })
      .catch(error => {
        console.error('Erro ao buscar anexos:', error);
      });
  }

  function carregarConvidadosDoBanco() {
    fetch('http://127.0.0.1:3000/ticket-convidados')
      .then(response => {
        if (!response.ok) throw new Error(`Erro ao buscar convidados: ${response.statusText}`);
        return response.json();
      })
      .then(convidadosBanco => {
        const ticketsLocal = JSON.parse(localStorage.getItem('tickets')) || [];
        convidadosBanco.forEach(reg => {
          const { ticket_id, convidado_email } = reg;
          const ticket = ticketsLocal.find(t => t.id == ticket_id);
          if (ticket) {
            if (!ticket.convidados) {
              ticket.convidados = [];
            }
            if (!ticket.convidados.includes(convidado_email)) {
              ticket.convidados.push(convidado_email);
            }
          }
        });
        localStorage.setItem('tickets', JSON.stringify(ticketsLocal));
        updateTickets();
      })
      .catch(error => {
        console.error('Erro ao buscar convidados:', error);
      });
  }

  function carregarUsuariosDoBanco() {
    fetch('http://127.0.0.1:3000/usuarios')
      .then(response => {
        if (!response.ok) throw new Error(`Erro ao buscar usuários: ${response.statusText}`);
        return response.json();
      })
      .then(data => {
        usuariosAtivos = {};
        data.forEach(user => {
          usuariosAtivos[user.email] = true;
        });
      })
      .catch(error => {
        console.error('Erro ao buscar usuários:', error);
      });
  }

  // ==========================================
  // 4. MESCLAR TICKETS DO BANCO COM LOCAIS
  // ==========================================
  function mesclarTickets(ticketsDoBanco, ticketsLocal) {
    const ticketsMesclados = [];

    ticketsDoBanco.forEach(dbTicket => {
      const localTicket = ticketsLocal.find(lt => lt.id == dbTicket.id) || {};
      const ticketMesclado = {
        ...localTicket,
        ...dbTicket,
        id: dbTicket.id,
        dataInicio:      dbTicket.data_inicio      ?? localTicket.dataInicio,
        dataFim:         dbTicket.data_fim         ?? localTicket.dataFim,
        dataAbertura:    dbTicket.data_abertura    ?? localTicket.dataAbertura,
        dataFinalizacao: dbTicket.data_finalizacao ?? localTicket.dataFinalizacao,
        tempoInicio:     dbTicket.tempo_inicio     ?? localTicket.tempoInicio,
        tempoFim:        dbTicket.tempo_fim        ?? localTicket.tempoFim
      };
      ticketsMesclados.push(ticketMesclado);
    });

    ticketsLocal.forEach(localT => {
      const jaExiste = ticketsDoBanco.some(dbT => dbT.id == localT.id);
      if (!jaExiste) {
        ticketsMesclados.push(localT);
      }
    });

    return ticketsMesclados;
  }

  // =====================================
  // 5. FUNÇÕES PRINCIPAIS DO SISTEMA
  // =====================================
  function updateTickets() {
    tickets = JSON.parse(localStorage.getItem('tickets')) || [];

    const filteredTickets = tickets.filter(ticket => {
      return (
        ticket.usuario === usuarioLogado ||
        (ticket.convidados && ticket.convidados.includes(usuarioLogado)) ||
        perfilUsuario === 'Administrador'
      );
    });

    const totalTicketsCount = filteredTickets.length;
    const naoIniciadosCount = filteredTickets.filter(t => t.status === 'não iniciado').length;
    const emAndamentoCount  = filteredTickets.filter(t => t.status === 'em andamento').length;
    const finalizadosCount  = filteredTickets.filter(t => t.status === 'finalizado').length;
    const excluidosCount    = filteredTickets.filter(t => t.status === 'excluído').length;

    document.getElementById('nao-iniciados-count').textContent = naoIniciadosCount;
    document.getElementById('em-andamento-count').textContent  = emAndamentoCount;
    document.getElementById('finalizados-count').textContent   = finalizadosCount;
    document.getElementById('excluidos-count').textContent     = excluidosCount;
    document.getElementById('total-tickets-count').textContent = totalTicketsCount;

    tabContents.forEach(tabContent => {
      tabContent.innerHTML = '';
    });

    filteredTickets.forEach(ticket => {
      const ticketElement = createTicketElement(ticket);
      if (ticket.status === 'não iniciado') {
        document.getElementById('tab-nao-iniciados').appendChild(ticketElement);
      } else if (ticket.status === 'em andamento') {
        document.getElementById('tab-em-andamento').appendChild(ticketElement);
      } else if (ticket.status === 'finalizado') {
        document.getElementById('tab-finalizados').appendChild(ticketElement);
      } else if (ticket.status === 'excluído') {
        document.getElementById('tab-excluidos').appendChild(ticketElement);
      }
      document.getElementById('tab-todos').appendChild(createAllTicketsElement(ticket));
    });

    if (document.getElementById('tab-todos').children.length === 0) {
      document.getElementById('tab-todos').innerHTML = '<p>Nenhum ticket disponível.</p>';
    }
  }

  function createTicketElement(ticket) {
    const div = document.createElement('div');
    div.className = `ticket ${ticket.status.replace(' ', '-')}`;

    const dataInicioDate = parseDateTime(ticket.dataInicio);
    const dataInicioStr  = dataInicioDate ? dataInicioDate.toLocaleString('pt-BR') : '';
    const dataFimDate    = parseDateTime(ticket.dataFim);
    const dataFimStr     = dataFimDate ? dataFimDate.toLocaleString('pt-BR') : '';

    div.innerHTML = `
      <div class="ticket-header">
        <h3>${ticket.cliente}</h3>
        <div class="ticket-status">${ticket.status}</div>
      </div>
      <div class="ticket-info">
        <p><span>Usuário:</span> ${removerDominio(ticket.usuario)}</p>
        <p><span>Rede:</span> ${ticket.rede}</p>
        <p><span>Motivo:</span> ${ticket.motivo}</p>
        <p><span>Veículo de Abertura:</span> ${ticket.veiculo}</p>
        <p><span>Prioridade:</span> ${ticket.prioridade}</p>
        <p><span>Previsão de Início:</span> ${dataInicioStr}</p>
        <p><span>Previsão de Fim:</span> ${dataFimStr}</p>
        <p><span>Tempo em Aberto:</span>
          <span class="tempo-aberto" data-id="${ticket.id}">
            ${
              ticket.status === 'em andamento'
                ? calculateTempoAberto(ticket.tempoInicio)
                : ticket.status === 'finalizado'
                  ? calculateTempoAberto(ticket.tempoInicio, ticket.tempoFim)
                  : 'Aguardando início'
            }
          </span>
        </p>
        <p><span>Descrição:</span> ${
          ticket.descricao ? ticket.descricao.substring(0, 50) : ''
        }</p>
      </div>
      <div class="ticket-actions">
        <button class="detalhes-button"><i class="fas fa-info-circle"></i> Detalhes</button>
        ${
          ticket.status === 'não iniciado' || ticket.status === 'em andamento'
            ? `<button class="iniciar-button"><i class="fas fa-play-circle"></i> ${
                ticket.status === 'não iniciado' ? 'Iniciar Tarefa' : 'Finalizar Tarefa'
              }</button>`
            : ''
        }
        ${
          ticket.status === 'não iniciado' || ticket.status === 'em andamento'
            ? `<button class="excluir-button"><i class="fas fa-trash-alt"></i> Excluir</button>`
            : ''
        }
      </div>
    `;

    div.querySelector('.detalhes-button')
       .addEventListener('click', () => showTicketDetails(ticket));

    if (ticket.status === 'não iniciado' || ticket.status === 'em andamento') {
      div.querySelector('.iniciar-button')
         .addEventListener('click', () => {
           toggleTicketStatus(ticket);
           sincronizarTicketsComBanco();
         });

      div.querySelector('.excluir-button')
         .addEventListener('click', () => {
           showExcluirPopup(ticket.id);
         });
    }
    return div;
  }

  function createAllTicketsElement(ticket) {
    return createTicketElement(ticket);
  }

  // ======================================
  // 6. OBSERVAÇÕES E ANEXOS (CHAT)
  // ======================================
  function adicionarObservacaoAoChat(obs) {
    const mensagemDiv = document.createElement('div');
    mensagemDiv.classList.add('chat-message', 'user-message');

    const conteudoDiv = document.createElement('div');
    conteudoDiv.classList.add('message-content');

    const usuarioDiv = document.createElement('div');
    usuarioDiv.classList.add('chat-user');
    usuarioDiv.textContent = removerDominio(obs.usuario);
    conteudoDiv.appendChild(usuarioDiv);

    if (obs.mensagem) {
      const mensagemTexto = document.createElement('div');
      mensagemTexto.textContent = obs.mensagem;
      conteudoDiv.appendChild(mensagemTexto);
    }

    if (obs.anexo && obs.anexo.length > 0) {
      const anexosList = document.createElement('ul');
      anexosList.classList.add('anexos-list');
      obs.anexo.forEach(anexo => {
        const listItem  = document.createElement('li');
        const linkAnexo = document.createElement('a');
        linkAnexo.href     = anexo.url;
        linkAnexo.target   = '_blank';
        linkAnexo.download = anexo.name;
        linkAnexo.textContent = anexo.name;
        listItem.appendChild(linkAnexo);
        anexosList.appendChild(listItem);
      });
      conteudoDiv.appendChild(anexosList);
    }

    const dataHoraDiv = document.createElement('div');
    dataHoraDiv.classList.add('chat-time');
    dataHoraDiv.textContent = formatarDataHora(obs.hora);

    mensagemDiv.appendChild(conteudoDiv);
    mensagemDiv.appendChild(dataHoraDiv);
    listaObservacoes.appendChild(mensagemDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function sincronizarAnexoIndividual(ticketId, fileName, fileUrl) {
    const body = {
      referencia_id:   ticketId,
      tipo_referencia: 'ticket',
      nome: fileName,
      url:  fileUrl
    };

    fetch('http://127.0.0.1:3000/anexos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(resp => resp.text())
    .then(data => {
      console.log('[AnexoIndividual] Resposta da API:', data);
    })
    .catch(err => {
      console.error('[AnexoIndividual] Erro ao enviar anexo:', err);
    });
  }

  enviarMensagemButton.addEventListener('click', () => {
    const mensagem   = adicionarObservacao.value.trim();
    const horaAtual  = new Date().toISOString();
    const anexoFiles = novoAnexo.files;
    const ticketId   = chatBox.getAttribute('data-ticket-id');

    if (!ticketId) {
      alert('Ticket não definido no chat.');
      return;
    }
    if (mensagem === '' && anexoFiles.length === 0) {
      alert('Digite uma mensagem ou anexe um arquivo antes de enviar.');
      return;
    }

    const anexos = [];
    if (anexoFiles.length > 0) {
      Array.from(anexoFiles).forEach(file => {
        const anexoURL = URL.createObjectURL(file);
        anexos.push({ name: file.name, url: anexoURL });
        sincronizarAnexoIndividual(ticketId, file.name, anexoURL);
      });
    }

    const novaObservacao = {
      ticketId: ticketId,
      usuario: usuarioLogado,
      mensagem: mensagem || 'Arquivo(s) anexado(s)',
      hora: horaAtual,
      anexo: anexos
    };

    observacoes.push(novaObservacao);
    localStorage.setItem('observacoes', JSON.stringify(observacoes));
    adicionarObservacaoAoChat(novaObservacao);

    adicionarObservacao.value = '';
    novoAnexo.value = '';
    anexoLabel.classList.remove('anexo-selecionado');
    document.getElementById('anexo-contador').textContent = '(0)';

    // Atualiza observações no banco
    sincronizarObservacoes();
  });

  // ================================
  // 7. DETALHES DO TICKET
  // ================================
  function showTicketDetails(ticket) {
    if (
      ticket.usuario === usuarioLogado ||
      perfilUsuario === 'Administrador' ||
      (ticket.convidados && ticket.convidados.includes(usuarioLogado))
    ) {
      const dataAberturaDate    = parseDateTime(ticket.dataAbertura);
      const dataAberturaStr     = dataAberturaDate
        ? dataAberturaDate.toLocaleString('pt-BR')
        : 'Não definida';

      const dataFinalizacaoDate = parseDateTime(ticket.dataFinalizacao);
      const dataFinalizacaoStr  = dataFinalizacaoDate
        ? dataFinalizacaoDate.toLocaleString('pt-BR')
        : 'Em andamento';

      const dataInicioDate = parseDateTime(ticket.dataInicio);
      const dataInicioStr  = dataInicioDate
        ? dataInicioDate.toLocaleString('pt-BR')
        : '';

      const dataFimDate   = parseDateTime(ticket.dataFim);
      const dataFimStr    = dataFimDate
        ? dataFimDate.toLocaleString('pt-BR')
        : '';

      document.getElementById('detalhe-cliente').innerText     = ticket.cliente;
      document.getElementById('detalhe-usuario').innerText     = removerDominio(ticket.usuario);
      document.getElementById('detalhe-rede').innerText        = ticket.rede || 'Todas as Redes';
      document.getElementById('detalhe-motivo').innerText      = ticket.motivo;
      document.getElementById('detalhe-veiculo').innerText     = ticket.veiculo || 'Não informado';
      document.getElementById('detalhe-abertura').innerText    = dataAberturaStr;
      document.getElementById('detalhe-finalizacao').innerText = dataFinalizacaoStr;
      document.getElementById('detalhe-inicio').innerText      = dataInicioStr;
      document.getElementById('detalhe-fim').innerText         = dataFimStr;
      document.getElementById('detalhe-status').innerText      = ticket.status;
      document.getElementById('detalhe-prioridade').innerText  = ticket.prioridade;
      document.getElementById('detalhe-descricao').innerText   = ticket.descricao || 'Nenhuma descrição fornecida';

      if (ticket.tempoInicio) {
        document.getElementById('detalhe-tempo-aberto').innerText =
          calculateTempoAberto(ticket.tempoInicio, ticket.tempoFim);
      } else {
        document.getElementById('detalhe-tempo-aberto').innerText = 'Aguardando início';
      }

      chatBox.setAttribute('data-ticket-id', ticket.id);

      renderizarObservacoes(ticket.id);
      renderizarListaConvidados(ticket.id);

      popupDetalhes.style.display = 'flex';
    } else {
      alert('Você não tem permissão para visualizar este ticket.');
    }
  }

  function renderizarObservacoes(ticketId) {
    listaObservacoes.innerHTML = '';
    observacoes = JSON.parse(localStorage.getItem('observacoes')) || [];
    tickets     = JSON.parse(localStorage.getItem('tickets'))     || [];

    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      listaObservacoes.innerHTML = '<p>Ticket não encontrado.</p>';
      return;
    }

    if (
      ticket.usuario !== usuarioLogado &&
      perfilUsuario !== 'Administrador' &&
      (!ticket.convidados || !ticket.convidados.includes(usuarioLogado))
    ) {
      listaObservacoes.innerHTML = '<p>Você não tem permissão para ver essas observações.</p>';
      return;
    }

    if (ticket.anexos && ticket.anexos.length > 0) {
      const pseudoObservacao = {
        usuario:  ticket.usuario,
        mensagem: 'Anexos incluídos na criação do ticket:',
        hora:     ticket.dataAbertura || new Date().toISOString(),
        anexo:    ticket.anexos
      };
      adicionarObservacaoAoChat(pseudoObservacao);
    }

    const observacoesFiltradas = observacoes.filter(obs => {
      return (obs.ticketId === ticketId || obs.ticket_id === ticketId);
    });
    observacoesFiltradas.forEach(obs => {
      adicionarObservacaoAoChat(obs);
    });
  }

  function renderizarListaConvidados(ticketId) {
    listaConvidados.innerHTML = '';
    tickets = JSON.parse(localStorage.getItem('tickets')) || [];

    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket && ticket.convidados) {
      ticket.convidados.forEach(emailConvidado => {
        if (emailConvidado !== ticket.usuario) {
          const listItem = document.createElement('li');
          listItem.innerHTML = `
            <span class="convidado-nome">
              <i class="fas fa-user convidado-icon"></i>
              ${removerDominio(emailConvidado)}
            </span>
          `;
          if (usuarioLogado === ticket.usuario || perfilUsuario === 'Administrador') {
            const removeButton = document.createElement('button');
            removeButton.className = 'remove-convidado-btn';
            removeButton.title = 'Remover Convidado';
            removeButton.innerHTML = '<i class="fas fa-times"></i>';

            removeButton.addEventListener('click', () => {
              const confirmRemoval = confirm(
                `Tem certeza que deseja remover acesso de ${removerDominio(emailConvidado)}?`
              );
              if (confirmRemoval) {
                ticket.convidados = ticket.convidados.filter(c => c !== emailConvidado);
                const updatedTickets = tickets.map(t => t.id === ticketId ? ticket : t);
                localStorage.setItem('tickets', JSON.stringify(updatedTickets));

                // Atualiza no banco
                sincronizarConvidados();

                if (usuarioLogado === emailConvidado) {
                  alert('Você foi removido deste ticket e não tem mais acesso.');
                  popupDetalhes.style.display = 'none';
                  updateTickets();
                } else {
                  listItem.remove();
                  renderizarObservacoes(ticketId);
                  updateTickets();
                }
              }
            });
            listItem.appendChild(removeButton);
          }
          listaConvidados.appendChild(listItem);
        }
      });
    } else {
      listaConvidados.innerHTML = '<p>Não há convidados.</p>';
    }
  }

  // ================================
  // 8. OUTROS EVENTOS
  // ================================
  function toggleTicketStatus(ticket) {
    if (ticket.status === 'não iniciado') {
      ticket.status = 'em andamento';
      ticket.tempoInicio = formatarDataParaMySQL(new Date().toISOString());
    } else if (ticket.status === 'em andamento') {
      ticket.status = 'finalizado';
      ticket.tempoFim = formatarDataParaMySQL(new Date().toISOString());
      ticket.dataFinalizacao = ticket.tempoFim;
    }
    localStorage.setItem('tickets', JSON.stringify(tickets));
    updateTickets();
  }

  function showExcluirPopup(ticketId) {
    excluirTicketId = ticketId;
    popupExcluir.style.display = 'flex';
  }

  closeModalButton.addEventListener('click', () => {
    popupDetalhes.style.display = 'none';
  });

  convidadosInput.addEventListener('input', () => {
    const inputValue = convidadosInput.value.toLowerCase();
    let sugestoesContainer = document.getElementById('sugestoes-usuarios');

    if (!sugestoesContainer) {
      sugestoesContainer = document.createElement('div');
      sugestoesContainer.id = 'sugestoes-usuarios';
      sugestoesContainer.classList.add('sugestoes-container');
      convidadosInput.parentElement.appendChild(sugestoesContainer);
    }

    const listaEmails = Object.keys(usuariosAtivos);
    const sugestoes = listaEmails
      .filter(email => email.toLowerCase().includes(inputValue))
      .map(email => `<div class="sugestao-item">${email}</div>`)
      .join('');

    sugestoesContainer.innerHTML = sugestoes || '<p>Sem sugestões</p>';
    if (inputValue) {
      sugestoesContainer.classList.add('show');
    } else {
      sugestoesContainer.classList.remove('show');
    }

    document.querySelectorAll('.sugestao-item').forEach(item => {
      item.addEventListener('click', () => {
        convidadosInput.value = item.textContent;
        sugestoesContainer.classList.remove('show');
      });
    });
  });

  document.getElementById('adicionar-convidado-icon')
    .addEventListener('click', () => {
      const emailConvidado = document.getElementById('adicionar-convidado').value.trim();
      const ticketId       = chatBox.getAttribute('data-ticket-id');
      const ticket         = tickets.find(t => t.id === ticketId);

      if (!ticket) {
        alert('Não foi possível localizar o ticket no LocalStorage.');
        return;
      }
      if (emailConvidado) {
        if (emailConvidado === ticket.usuario) {
          alert('O dono do ticket não pode ser adicionado como convidado.');
          return;
        }
        if (ticket.convidados && ticket.convidados.includes(emailConvidado)) {
          alert('Este usuário já foi adicionado.');
          return;
        }
        if (!ticket.convidados) {
          ticket.convidados = [];
        }
        ticket.convidados.push(emailConvidado);
        localStorage.setItem('tickets', JSON.stringify(tickets));
        sincronizarConvidados();

        renderizarListaConvidados(ticketId);
        document.getElementById('adicionar-convidado').value = '';
      } else {
        alert('Por favor, insira um e-mail válido.');
      }
    });

  // Criação de ticket
  ticketForm.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(ticketForm);

    const valorDataInicio   = formData.get('data-inicio');
    const valorDataFim      = formData.get('data-fim');
    const agora             = new Date();
    const dataAberturaMySQL = formatarDataParaMySQL(agora.toISOString());

    const ticket = {
      id: Date.now().toString(),
      cliente:       formData.get('cliente'),
      usuario:       usuarioLogado,
      rede:          formData.get('rede'),
      motivo:        formData.get('motivo'),
      prioridade:    formData.get('prioridade'),
      veiculo:       formData.get('veiculo'),
      dataInicio:    valorDataInicio ? formatarDataParaMySQL(valorDataInicio) : null,
      dataFim:       valorDataFim     ? formatarDataParaMySQL(valorDataFim)   : null,
      dataAbertura:  dataAberturaMySQL,
      dataFinalizacao: null,
      tempoInicio:   null,
      tempoFim:      null,
      status: 'não iniciado',
      anexos: [],
      descricao: formData.get('descricao')
    };

    tickets.push(ticket);
    localStorage.setItem('tickets', JSON.stringify(tickets));
    updateTickets();
    sincronizarTicketsComBanco();

    // Limpamos o form (campos normais)
    ticketForm.reset();

    // E agora limpamos os selects do Select2 também:
    $('#cliente, #rede, #motivo, #prioridade, #veiculo')
      .val('')
      .trigger('change');
  });

  confirmarExclusao.addEventListener('click', () => {
    const motivoExclusao = document.getElementById('motivo-exclusao').value;
    const ticket = tickets.find(t => t.id === excluirTicketId);
    if (ticket) {
      ticket.status = 'excluído';
      ticket.motivoExclusao = motivoExclusao;
      ticket.dataFinalizacao = new Date().toISOString();
      localStorage.setItem('tickets', JSON.stringify(tickets));
      updateTickets();
      sincronizarTicketsComBanco();
    }
    popupExcluir.style.display = 'none';
  });

  cancelarExclusao.addEventListener('click', () => {
    popupExcluir.style.display = 'none';
  });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      tabContents.forEach(tc => tc.classList.remove('active'));
      document
        .getElementById(`tab-${tab.getAttribute('data-tab')}`)
        .classList.add('active');
    });
  });

  painelCards.forEach(card => {
    card.addEventListener('click', () => {
      const tab = card.getAttribute('data-tab');
      document.querySelector(`.tab-button[data-tab="${tab}"]`).click();
    });
  });

  downloadJsonButton.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(tickets, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'tickets.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  });

  downloadXlsxButton.addEventListener('click', () => {
    const worksheet = XLSX.utils.json_to_sheet(
      tickets.map(ticket => ({
        id: ticket.id,
        Cliente: ticket.cliente,
        Usuário: ticket.usuario,
        Rede: ticket.rede,
        Motivo: ticket.motivo,
        Veículo: ticket.veiculo,
        Início: ticket.dataInicio,
        Fim: ticket.dataFim,
        Abertura: new Date(ticket.dataAbertura).toLocaleString('pt-BR'),
        Finalização: ticket.dataFinalizacao
          ? new Date(ticket.dataFinalizacao).toLocaleString('pt-BR')
          : '',
        'Tempo de ticket aberto': ticket.tempoInicio
          ? calculateTempoAberto(ticket.tempoInicio, ticket.tempoFim)
          : 'Não Iniciado',
        Prioridade: ticket.prioridade,
        Descrição: ticket.descricao,
        Anexos: (ticket.anexos && ticket.anexos.length > 0)
          ? `Sim (${ticket.anexos.length})`
          : 'Não',
        'Motivo para Exclusão': ticket.motivoExclusao || '',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');
    XLSX.writeFile(workbook, 'tickets.xlsx');
  });

  toggleThemeButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  });
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    searchTicketsByActiveTab(query);
  });

  function searchTicketsByActiveTab(query) {
    const activeTabButton  = document.querySelector('.tab-button.active');
    const activeTabContent = document.querySelector('.tab-content.active');
    const tabId = activeTabButton.getAttribute('data-tab');
    activeTabContent.innerHTML = '';

    const filteredTickets = tickets.filter(ticket => {
      return (
        ticket.cliente.toLowerCase().includes(query) &&
        (
          (tabId === 'nao-iniciados' && ticket.status === 'não iniciado') ||
          (tabId === 'em-andamento'  && ticket.status === 'em andamento') ||
          (tabId === 'finalizados'   && ticket.status === 'finalizado') ||
          (tabId === 'excluidos'     && ticket.status === 'excluído') ||
          tabId === 'todos'
        )
      );
    });

    filteredTickets.forEach(ticket => {
      const ticketElement = createTicketElement(ticket);
      activeTabContent.appendChild(ticketElement);
    });

    if (filteredTickets.length === 0) {
      activeTabContent.innerHTML = '<p>Nenhum ticket encontrado para esta aba.</p>';
    }
  }

  // Atualiza contagem de tempo a cada 1s
  setInterval(() => {
    const elements = document.querySelectorAll('.tempo-aberto');
    elements.forEach(element => {
      const ticketId = element.getAttribute('data-id');
      const ticket   = tickets.find(t => t.id === ticketId);
      if (ticket && ticket.status === 'em andamento') {
        element.textContent = calculateTempoAberto(ticket.tempoInicio);
      }
    });
  }, 1000);

  // ======================================
  // 9. FUNÇÕES DE SINCRONIZAÇÃO (POST)
  // ======================================
  function formatarDataParaMySQL(dataISO) {
    if (!dataISO) return null;
    const data = new Date(dataISO);
    if (isNaN(data.getTime())) return null;
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const segundos = String(data.getSeconds()).padStart(2, '0');
    return `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
  }

  function sincronizarTicketsComBanco() {
    const ticketsLS = JSON.parse(localStorage.getItem('tickets')) || [];
    if (ticketsLS.length === 0) return;
    fetch('http://127.0.0.1:3000/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickets: ticketsLS })
    })
    .then(resp => resp.text())
    .then(data => {
      console.log('Resposta da API (Tickets):', data);
    })
    .catch(err => {
      console.error('Erro ao sincronizar tickets:', err);
    });
  }

  function sincronizarObservacoes() {
    const observacoesLS = JSON.parse(localStorage.getItem('observacoes')) || [];
    const normalizadas = observacoesLS.map(obs => ({
      ticket_id:     obs.ticket_id     || obs.ticketId,
      usuario_email: obs.usuario_email || obs.usuario,
      mensagem:      obs.mensagem,
      hora:          obs.hora
    }));
    const validas = normalizadas.filter(obs => {
      if (!obs.ticket_id || !obs.usuario_email || !obs.mensagem || !obs.hora) return false;
      return true;
    });
    if (validas.length === 0) return;
    fetch('http://127.0.0.1:3000/observacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observacoes: validas })
    })
    .then(r => r.text())
    .then(d => {
      console.log('Resposta da API (Observações):', d);
    })
    .catch(e => {
      console.error('Erro ao sincronizar observações:', e);
    });
  }

  function sincronizarAnexos() {
    const ticketsLS = JSON.parse(localStorage.getItem('tickets')) || [];
    const anexosParaEnviar = [];
    ticketsLS.forEach(ticket => {
      if (ticket.anexos && Array.isArray(ticket.anexos)) {
        ticket.anexos.forEach(ax => {
          if (ax.name && ax.url) {
            anexosParaEnviar.push({
              referencia_id: ticket.id,
              tipo_referencia: 'ticket',
              nome: ax.name,
              url: ax.url
            });
          }
        });
      }
    });
    if (anexosParaEnviar.length === 0) return;
    anexosParaEnviar.forEach(ax => {
      fetch('http://127.0.0.1:3000/anexos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ax)
      })
      .then(resp => resp.text())
      .then(d => console.log('Resposta da API (Anexo):', d))
      .catch(e => console.error('Erro ao sincronizar anexo:', e));
    });
  }

  function sincronizarConvidados() {
    const ticketsLS = JSON.parse(localStorage.getItem('tickets')) || [];
    const convidados = [];
    ticketsLS.forEach(ticket => {
      if (ticket.convidados && Array.isArray(ticket.convidados)) {
        ticket.convidados.forEach(email => {
          convidados.push({ ticket_id: ticket.id, convidado_email: email });
        });
      }
    });
    if (convidados.length === 0) return;
    fetch('http://127.0.0.1:3000/ticket-convidados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(convidados)
    })
    .then(r => r.text())
    .then(d => {
      console.log('Resposta da API (Convidados):', d);
    })
    .catch(e => console.error('Erro ao sincronizar convidados:', e));
  }

  function sincronizarUsuarios() {
    const usuariosLS = JSON.parse(localStorage.getItem('usuarios')) || [];
    if (usuariosLS.length === 0) return;
    fetch('http://127.0.0.1:3000/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarios: usuariosLS })
    })
    .then(r => r.text())
    .then(d => {
      console.log('Resposta da API (Usuários):', d);
    })
    .catch(e => console.error('Erro ao sincronizar usuários:', e));
  }

  // ================================
  // 10. INICIALIZAÇÃO DO SISTEMA
  // ================================

  // 1) Carregar selects do BD
  carregarSelectClientes();
  carregarSelectRedes();
  carregarSelectMotivos();
  carregarSelectPrioridades();
  carregarSelectVeiculos();

  // 2) Carregar dados do BD
  carregarTicketsDoBanco();
  carregarObservacoesDoBanco();
  carregarAnexosDoBanco();
  carregarConvidadosDoBanco();
  carregarUsuariosDoBanco();

  // 3) Sincronizar local->BD
  sincronizarTicketsComBanco();
  sincronizarObservacoes();
  sincronizarAnexos();
  sincronizarConvidados();
  sincronizarUsuarios();

  // 4) Renderizar
  renderizarObservacoes();
  updateTickets();
});
