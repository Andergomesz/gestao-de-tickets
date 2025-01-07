// dashboardTickets.js

// Variáveis globais para armazenar todos os tickets e facilitar filtragem
let todosOsTickets = [];

// Objeto para armazenar as instâncias dos gráficos
let charts = {};

// Variáveis para paginação da tabela
let currentPage = 1;
const ticketsPerPage = 15; // Pode ajustar aqui o número de itens por página na tabela
let paginatedTickets = [];

// Objeto para armazenar estados de paginação dos gráficos
let paginacaoGraficos = {};

// Objeto para armazenar filtros quando clicamos nos gráficos
let filtroGlobal = {}; // Exemplo: { campo: 'usuario', valor: 'Fulano' }

/**
 * Classe para tornar a tabela ordenável usando a biblioteca Sortable.
 */
class SortableTable {
    constructor(table) {
        this.table = table;
        this.headers = table.querySelectorAll('th');
        this.sortDirection = {};
        this.addSortListeners();
    }

    addSortListeners() {
        this.headers.forEach((header, index) => {
            header.style.cursor = 'pointer'; // Indica que é clicável
            header.addEventListener('click', () => {
                console.log(`Clique no header da coluna ${index}`);
                this.sortTableByColumn(index);
            });
        });
    }

    sortTableByColumn(columnIndex) {
        console.log(`Ordenando tabela pela coluna index ${columnIndex}`);
        const tbody = this.table.querySelector('tbody');
        const rowsArray = Array.from(tbody.querySelectorAll('tr'));
        const isAscending = this.sortDirection[columnIndex] === 'asc';
        const direction = isAscending ? 'desc' : 'asc';
        this.sortDirection[columnIndex] = direction;

        rowsArray.sort((a, b) => {
            const aText = a.querySelectorAll('td')[columnIndex].textContent.trim().toLowerCase();
            const bText = b.querySelectorAll('td')[columnIndex].textContent.trim().toLowerCase();

            // Verificar se é número
            const aNum = parseFloat(aText);
            const bNum = parseFloat(bText);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return direction === 'asc' ? aNum - bNum : bNum - aNum;
            }

            // Verificar se é data no formato YYYY-MM-DD ou algo parecido
            const aDate = new Date(aText);
            const bDate = new Date(bText);
            if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
                return direction === 'asc' ? aDate - bDate : bDate - aDate;
            }

            // Comparação padrão (texto)
            if (aText < bText) return direction === 'asc' ? -1 : 1;
            if (aText > bText) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        // Reorganizar as linhas na tabela
        rowsArray.forEach(row => tbody.appendChild(row));

        // Atualizar os indicadores de ordenação nos headers
        this.headers.forEach((header, i) => {
            header.classList.remove('sorted-asc', 'sorted-desc');
            if (i === columnIndex) {
                header.classList.add(direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
            }
        });

        console.log(`Tabela ordenada em ordem ${direction}.`);
    }
}

// Quando a página carrega
window.addEventListener('DOMContentLoaded', async () => {
    console.log('Página carregada. Iniciando dashboard.');

    // 1. Buscar dados no servidor
    await carregarDados();

    // 2. Inicializar os filtros principais
    inicializarFiltros();

    // 3. Inicializar estados de paginação dos gráficos
    inicializarPaginacaoGraficos();

    // 4. Renderizar os gráficos
    renderizarGraficos(todosOsTickets);

    // 5. Renderizar a tabela
    atualizarTabelaComPaginacao(todosOsTickets);
    renderizarTabelaPagina();
    atualizarControlesPaginacao();

    // 6. Inicializar a tabela ordenável
    const tabela = document.getElementById('tabelaTickets');
    if (tabela) {
        new SortableTable(tabela);
        console.log('Classe SortableTable inicializada para a tabela.');
    } else {
        console.error('Tabela #tabelaTickets não encontrada para aplicar SortableTable.');
    }

    // 7. Configurar eventos dos botões de paginação da tabela
    const btnPrevPage = document.getElementById('prevPage');
    const btnNextPage = document.getElementById('nextPage');

    if (btnPrevPage && btnNextPage) {
        btnPrevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderizarTabelaPagina();
                atualizarControlesPaginacao();
            }
        });

        btnNextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(paginatedTickets.length / ticketsPerPage) || 1;
            if (currentPage < totalPages) {
                currentPage++;
                renderizarTabelaPagina();
                atualizarControlesPaginacao();
            }
        });
    } else {
        console.warn('Botões de paginação não encontrados.');
    }

    // 8. Configurar eventos dos filtros principais
    const btnAplicarFiltros = document.getElementById('btnAplicarFiltros');
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');

    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', aplicarFiltrosPrincipais);
        console.log('Evento click adicionado ao botão #btnAplicarFiltros.');
    } else {
        console.warn('Botão #btnAplicarFiltros não encontrado.');
    }

    if (btnLimparFiltros) {
        btnLimparFiltros.addEventListener('click', limparFiltros);
        console.log('Evento click adicionado ao botão #btnLimparFiltros.');
    } else {
        console.warn('Botão #btnLimparFiltros não encontrado.');
    }

    // 9. Configurar eventos dos filtros internos dos gráficos e paginação interna
    configurarFiltrosGraficos();

    // 10. Configurar eventos do modal de download
    configurarEventosDownload();
});

/**
 * Faz a requisição ao servidor para buscar todos os tickets.
 */
async function carregarDados() {
    try {
        console.log('Buscando dados dos tickets...');
        const response = await fetch('http://localhost:3000/tickets'); // Ajuste a URL conforme seu backend
        console.log('Status da resposta:', response.status);

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dados dos tickets recebidos:', data);

        todosOsTickets = data;
    } catch (error) {
        console.error('Erro ao carregar dados dos tickets:', error);
        todosOsTickets = [];
    }
}

/**
 * Preenche as opções dos selects de filtros com base nos tickets existentes.
 */
function inicializarFiltros() {
    console.log('Inicializando filtros.');
    const filtroClienteEl = document.getElementById('filtroCliente');
    const filtroUsuarioEl = document.getElementById('filtroUsuario');
    const filtroRedeEl = document.getElementById('filtroRede');
    const filtroMotivoEl = document.getElementById('filtroMotivo');
    const filtroPrioridadeEl = document.getElementById('filtroPrioridade');
    const filtroStatusEl = document.getElementById('filtroStatus');

    if (!filtroClienteEl || 
        !filtroUsuarioEl || 
        !filtroRedeEl || 
        !filtroMotivoEl || 
        !filtroPrioridadeEl || 
        !filtroStatusEl) {
        console.error('Um ou mais elementos de filtro não foram encontrados no DOM.');
        return;
    }

    // Função auxiliar para adicionar a opção "Todos"
    function adicionarOpcaoTodos(selectElement) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Todos';
        selectElement.appendChild(option);
    }

    // Adicionar opção "Todos" a cada select
    adicionarOpcaoTodos(filtroClienteEl);
    adicionarOpcaoTodos(filtroUsuarioEl);
    adicionarOpcaoTodos(filtroRedeEl);
    adicionarOpcaoTodos(filtroMotivoEl);
    adicionarOpcaoTodos(filtroPrioridadeEl);
    adicionarOpcaoTodos(filtroStatusEl);

    // Obter valores únicos para cada filtro
    const clientesUnicos = [...new Set(todosOsTickets.map(t => t.cliente))].filter(Boolean).sort();
    const usuariosUnicos = [...new Set(todosOsTickets.map(t => t.usuario))].filter(Boolean).sort();
    const redesUnicas = [...new Set(todosOsTickets.map(t => t.rede))].filter(Boolean).sort();
    const motivosUnicos = [...new Set(todosOsTickets.map(t => t.motivo))].filter(Boolean).sort();
    const prioridadesUnicas = [...new Set(todosOsTickets.map(t => t.prioridade))].filter(Boolean).sort();
    const statusUnicos = [...new Set(todosOsTickets.map(t => t.status))].filter(Boolean).sort();

    console.log('Clientes únicos:', clientesUnicos);
    console.log('Usuários únicos:', usuariosUnicos);
    console.log('Redes únicas:', redesUnicas);
    console.log('Motivos únicos:', motivosUnicos);
    console.log('Prioridades únicas:', prioridadesUnicas);
    console.log('Status únicos:', statusUnicos);

    // Preencher select de Cliente
    clientesUnicos.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente;
        option.textContent = cliente;
        filtroClienteEl.appendChild(option);
    });
    console.log('Select de Cliente preenchido.');

    // Preencher select de Usuário
    usuariosUnicos.forEach(usuario => {
        const option = document.createElement('option');
        option.value = usuario;
        option.textContent = usuario;
        filtroUsuarioEl.appendChild(option);
    });
    console.log('Select de Usuário preenchido.');

    // Preencher select de Rede
    redesUnicas.forEach(rede => {
        const option = document.createElement('option');
        option.value = rede;
        option.textContent = rede;
        filtroRedeEl.appendChild(option);
    });
    console.log('Select de Rede preenchido.');

    // Preencher select de Motivo
    motivosUnicos.forEach(motivo => {
        const option = document.createElement('option');
        option.value = motivo;
        option.textContent = motivo;
        filtroMotivoEl.appendChild(option);
    });
    console.log('Select de Motivo preenchido.');

    // Preencher select de Prioridade
    prioridadesUnicas.forEach(prioridade => {
        const option = document.createElement('option');
        option.value = prioridade;
        option.textContent = prioridade;
        filtroPrioridadeEl.appendChild(option);
    });
    console.log('Select de Prioridade preenchido.');

    // Preencher select de Status
    statusUnicos.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        filtroStatusEl.appendChild(option);
    });
    console.log('Select de Status preenchido.');

    console.log('Filtros inicializados com', {
        clientesUnicos,
        usuariosUnicos,
        redesUnicas,
        motivosUnicos,
        prioridadesUnicas,
        statusUnicos
    });
}

/**
 * Inicializa os estados de paginação para cada gráfico.
 */
function inicializarPaginacaoGraficos() {
    const graficos = ['usuario', 'cliente', 'prioridade', 'motivo', 'mes', 'status'];
    graficos.forEach(campo => {
        paginacaoGraficos[campo] = {
            currentPage: 1,
            totalPages: 1,
            limit: 15, // Valor padrão inicial
            sortOrder: 'desc' // Ordem de classificação padrão
        };
    });
    console.log('Estados de paginação dos gráficos inicializados:', paginacaoGraficos);
}

/**
 * Configura os eventos dos filtros internos dos gráficos e paginação interna.
 */
function configurarFiltrosGraficos() {
    // Para cada gráfico, adicionamos listeners aos seus filtros internos e controles de paginação
    const graficos = [
        { id: 'usuario', type: 'bar' },
        { id: 'cliente', type: 'column' },
        { id: 'prioridade', type: 'pie' },
        { id: 'motivo', type: 'column' },
        { id: 'mes', type: 'line' },
        { id: 'status', type: 'pie' },
    ];

    graficos.forEach(grafico => {
        const sortSelect = document.getElementById(`sortPor${capitalizeFirstLetter(grafico.id)}`);
        const limitInput = document.getElementById(`limitPor${capitalizeFirstLetter(grafico.id)}`);
        const prevButton = document.querySelector(`.prevPageGrafico[data-campo="${grafico.id}"]`);
        const nextButton = document.querySelector(`.nextPageGrafico[data-campo="${grafico.id}"]`);
        const currentPageSpan = document.querySelector(`.currentPageGrafico[data-campo="${grafico.id}"]`);

        if (sortSelect && limitInput && prevButton && nextButton && currentPageSpan) {
            // Eventos para ordenar e limitar
            sortSelect.addEventListener('change', () => {
                paginacaoGraficos[grafico.id].sortOrder = sortSelect.value;
                paginacaoGraficos[grafico.id].currentPage = 1; // Resetar para a primeira página
                atualizarGrafico(grafico.id, grafico.type);
                atualizarControlesPaginacaoGrafico(grafico.id);
            });

            limitInput.addEventListener('input', () => {
                const novoLimite = parseInt(limitInput.value) || 15;
                paginacaoGraficos[grafico.id].limit = novoLimite;
                paginacaoGraficos[grafico.id].currentPage = 1; // Resetar para a primeira página
                atualizarGrafico(grafico.id, grafico.type);
                atualizarControlesPaginacaoGrafico(grafico.id);
            });

            // Eventos para paginação interna
            prevButton.addEventListener('click', () => {
                if (paginacaoGraficos[grafico.id].currentPage > 1) {
                    paginacaoGraficos[grafico.id].currentPage--;
                    atualizarGrafico(grafico.id, grafico.type);
                    atualizarControlesPaginacaoGrafico(grafico.id);
                }
            });

            nextButton.addEventListener('click', () => {
                if (paginacaoGraficos[grafico.id].currentPage < paginacaoGraficos[grafico.id].totalPages) {
                    paginacaoGraficos[grafico.id].currentPage++;
                    atualizarGrafico(grafico.id, grafico.type);
                    atualizarControlesPaginacaoGrafico(grafico.id);
                }
            });

            console.log(`Eventos adicionados para filtros internos e paginação do gráfico ${grafico.id}.`);
        } else {
            console.warn(`Filtros internos ou controles de paginação para o gráfico ${grafico.id} não encontrados.`);
        }
    });
}

/**
 * Atualiza os controles de paginação interna de um gráfico específico.
 */
function atualizarControlesPaginacaoGrafico(campo) {
    const graficoEstado = paginacaoGraficos[campo];
    const currentPageSpan = document.querySelector(`.currentPageGrafico[data-campo="${campo}"]`);
    const prevButton = document.querySelector(`.prevPageGrafico[data-campo="${campo}"]`);
    const nextButton = document.querySelector(`.nextPageGrafico[data-campo="${campo}"]`);

    if (currentPageSpan && prevButton && nextButton) {
        currentPageSpan.textContent = graficoEstado.currentPage;
        prevButton.disabled = graficoEstado.currentPage === 1;
        nextButton.disabled = graficoEstado.currentPage === graficoEstado.totalPages;
    }
}

/**
 * Atualiza o gráfico com base nos filtros internos e paginação.
 */
function atualizarGrafico(campo, type) {
    const graficoEstado = paginacaoGraficos[campo];
    const sortOrder = graficoEstado.sortOrder;
    const limit = graficoEstado.limit;

    let dadosFiltrados;

    switch (campo) {
        case 'usuario':
        case 'cliente':
        case 'prioridade':
        case 'motivo':
        case 'status':
            dadosFiltrados = agruparPorCampo(todosOsTickets, campo);
            break;
        case 'mes':
            dadosFiltrados = agruparTicketsPorMes(todosOsTickets);
            break;
        default:
            dadosFiltrados = [];
    }

    // Ordenar os dados
    dadosFiltrados.sort((a, b) => {
        if (sortOrder === 'asc') {
            return a.quantidade - b.quantidade;
        } else {
            return b.quantidade - a.quantidade;
        }
    });

    // Calcular total de páginas
    graficoEstado.totalPages = Math.ceil(dadosFiltrados.length / limit) || 1;

    // Garantir que a página atual não exceda o total de páginas
    if (graficoEstado.currentPage > graficoEstado.totalPages) {
        graficoEstado.currentPage = graficoEstado.totalPages;
    }

    // Paginar os dados
    const start = (graficoEstado.currentPage - 1) * limit;
    const end = start + limit;
    const dadosPaginated = dadosFiltrados.slice(start, end);

    // Atualizar o gráfico correspondente
    if (charts[campo]) {
        if (type === 'pie') {
            // Para gráficos de pizza
            charts[campo].update({
                title: {
                    text: charts[campo].options.title.text
                },
                series: [{
                    name: campo === 'prioridade' ? 'Prioridade' : 'Status',
                    colorByPoint: true,
                    data: dadosPaginated.map(item => ({
                        name: item.campo || item.mes,
                        y: item.quantidade
                    }))
                }],
                xAxis: {
                    categories: [] // Remover categorias para gráficos de pizza
                }
            }, true, true);
        } else {
            // Para outros tipos de gráficos (bar, column, line)
            charts[campo].update({
                title: {
                    text: charts[campo].options.title.text
                },
                xAxis: {
                    categories: dadosPaginated.map(item => item.campo || item.mes),
                },
                series: [{
                    name: 'Tickets',
                    data: dadosPaginated.map(item => item.quantidade)
                }]
            }, true, true);
        }
        console.log(`Gráfico "${campo}" atualizado para página ${graficoEstado.currentPage} de ${graficoEstado.totalPages}.`);
    } else {
        console.error(`Gráfico para o campo "${campo}" não encontrado.`);
    }
}

/**
 * Renderiza todos os gráficos com base em um conjunto de tickets.
 */
function renderizarGraficos(tickets) {
    console.log(`Renderizando gráficos com ${tickets.length} tickets.`);

    const graficos = [
        { id: 'usuario', type: 'bar', container: 'chartPorUsuario', title: 'Quantidade de Tickets por Usuário' },
        { id: 'cliente', type: 'column', container: 'chartPorCliente', title: 'Quantidade de Tickets por Cliente' },
        { id: 'prioridade', type: 'pie', container: 'chartPorPrioridade', title: 'Distribuição de Tickets por Prioridade' },
        { id: 'motivo', type: 'column', container: 'chartPorMotivo', title: 'Quantidade de Tickets por Motivo' },
        { id: 'mes', type: 'line', container: 'chartTicketsPorMes', title: 'Quantidade de Tickets Abertos por Mês' },
        { id: 'status', type: 'pie', container: 'chartStatusGeral', title: 'Status Geral dos Tickets' },
    ];

    graficos.forEach(grafico => {
        let dadosFiltrados;

        switch (grafico.id) {
            case 'usuario':
            case 'cliente':
            case 'prioridade':
            case 'motivo':
            case 'status':
                dadosFiltrados = agruparPorCampo(tickets, grafico.id);
                break;
            case 'mes':
                dadosFiltrados = agruparTicketsPorMes(tickets);
                break;
            default:
                dadosFiltrados = [];
        }

        // Ordenar os dados conforme o filtro interno (se aplicável)
        const graficoEstado = paginacaoGraficos[grafico.id];
        const sortOrder = graficoEstado.sortOrder;
        const limit = graficoEstado.limit;

        dadosFiltrados.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.quantidade - b.quantidade;
            } else {
                return b.quantidade - a.quantidade;
            }
        });

        // Paginar os dados
        const start = (graficoEstado.currentPage - 1) * limit;
        const end = start + limit;
        const dadosPaginated = dadosFiltrados.slice(start, end);

        // Preparar dados para o gráfico
        let seriesData;
        let categorias = [];

        if (grafico.type === 'pie') {
            seriesData = dadosPaginated.map(item => ({
                name: item.campo || item.mes,
                y: item.quantidade
            }));
        } else {
            categorias = dadosPaginated.map(item => item.campo || item.mes);
            seriesData = [{
                name: 'Tickets',
                data: dadosPaginated.map(item => item.quantidade)
            }];
        }

        // Se o gráfico já existir, atualiza; se não, cria
        if (charts[grafico.id]) {
            if (grafico.type === 'pie') {
                charts[grafico.id].update({
                    series: [{
                        name: grafico.id === 'prioridade' ? 'Prioridade' : 'Status',
                        colorByPoint: true,
                        data: seriesData
                    }],
                    xAxis: {
                        categories: []
                    }
                }, true, true);
            } else {
                charts[grafico.id].update({
                    xAxis: {
                        categories: categorias,
                    },
                    series: seriesData
                }, true, true);
            }
            console.log(`Gráfico "${grafico.id}" atualizado.`);
        } else {
            // Criar novo gráfico
            charts[grafico.id] = Highcharts.chart(grafico.container, {
                chart: {
                    type: grafico.type,
                    zoomType: 'xy'
                },
                title: {
                    text: grafico.title
                },
                xAxis: grafico.type !== 'pie' ? {
                    categories: categorias,
                    crosshair: true,
                    title: {
                        text: grafico.id === 'mes' ? 'Mês' : null
                    }
                } : {},
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Quantidade',
                        align: 'high'
                    },
                    labels: {
                        overflow: 'justify'
                    }
                },
                tooltip: {
                    valueSuffix: ' tickets'
                },
                plotOptions: {
                    // Configurações especiais para cada tipo
                    [grafico.type]: {
                        dataLabels: {
                            enabled: true,
                            // Para pizza, exibimos o nome e a quantidade
                            format: grafico.type === 'pie' ? '{point.name}: {point.y}' : null
                        },
                        point: {
                            events: {
                                // Clique no ponto: filtra TUDO (tabela e os outros gráficos)
                                click: function () {
                                    let campo;
                                    let valor;

                                    if (grafico.id === 'mes') {
                                        campo = 'mes';
                                        valor = this.category;
                                    } else {
                                        campo = grafico.id;
                                        valor = this.name || this.category;
                                    }

                                    console.log(`Filtrando globalmente por ${campo}: ${valor}`);
                                    filtroGlobal = { campo, valor };

                                    // Aplicar o filtro global
                                    aplicarFiltroGlobal(campo, valor);
                                }
                            }
                        }
                    }
                },
                series: grafico.type === 'pie'
                    ? [{
                        name: grafico.id === 'prioridade' ? 'Prioridade' : 'Status',
                        colorByPoint: true,
                        data: seriesData
                    }]
                    : seriesData,
                exporting: {
                    enabled: true
                },
                responsive: {
                    rules: [{
                        condition: {
                            maxWidth: 500
                        },
                        chartOptions: {
                            legend: {
                                layout: 'horizontal',
                                align: 'center',
                                verticalAlign: 'bottom'
                            }
                        }
                    }]
                }
            });
            console.log(`Gráfico "${grafico.id}" criado.`);
        }

        // Atualizar paginação total
        graficoEstado.totalPages = Math.ceil(dadosFiltrados.length / limit) || 1;
        atualizarControlesPaginacaoGrafico(grafico.id);
    });

    console.log('Gráficos renderizados/atualizados.');
}

/**
 * Aplica um filtro global (gatilhado pelo clique em um ponto de qualquer gráfico).
 * Filtra os tickets e chama renderização dos gráficos e tabela de novo.
 */
function aplicarFiltroGlobal(campo, valor) {
    let ticketsFiltrados;

    if (campo === 'mes') {
        // Filtrar por mês
        ticketsFiltrados = filtrarPorMes(todosOsTickets, valor);
    } else {
        // Filtrar por campo
        ticketsFiltrados = todosOsTickets.filter(ticket => {
            // Se for 'usuario', observe a máscara original do ticket
            // pois a tabela exibe a máscara, mas aqui filtramos o dado cru
            if (campo === 'usuario') {
                return ticket[campo] === valor;
            }
            return ticket[campo] === valor;
        });
    }

    // Atualiza todos os gráficos com os dados filtrados
    renderizarGraficos(ticketsFiltrados);

    // Atualiza a tabela
    atualizarTabelaComPaginacao(ticketsFiltrados);
    renderizarTabelaPagina();
    atualizarControlesPaginacao();
}

/**
 * Função auxiliar para filtrar tickets por mês (data_abertura ou data_inicio).
 */
function filtrarPorMes(tickets, mesSelecionado) {
    return tickets.filter(ticket => {
        const dataCampo = ticket.data_abertura || ticket.data_inicio;
        if (dataCampo) {
            const data = new Date(dataCampo);
            if (!isNaN(data.getTime())) {
                const mes = data.toLocaleString('default', { month: 'long', year: 'numeric' });
                return mes === mesSelecionado;
            }
        }
        return false;
    });
}

/**
 * Agrupa os tickets pelo campo especificado e retorna um array com objetos { campo, quantidade }.
 */
function agruparPorCampo(tickets, nomeCampo) {
    const contagem = {};
    tickets.forEach(ticket => {
        const valor = ticket[nomeCampo] || 'Indefinido';
        if (!contagem[valor]) {
            contagem[valor] = 0;
        }
        contagem[valor]++;
    });

    const resultado = Object.keys(contagem).map(chave => ({
        campo: chave,
        quantidade: contagem[chave]
    }));

    return resultado;
}

/**
 * Agrupa os tickets abertos por mês e ano.
 */
function agruparTicketsPorMes(tickets) {
    const contagem = {};
    tickets.forEach(ticket => {
        // Usando data_inicio se data_abertura não estiver presente
        const dataCampo = ticket.data_abertura || ticket.data_inicio;
        if (dataCampo) {
            const data = new Date(dataCampo);
            if (!isNaN(data.getTime())) {
                const mes = data.toLocaleString('default', { month: 'long', year: 'numeric' });
                if (!contagem[mes]) {
                    contagem[mes] = 0;
                }
                contagem[mes]++;
            }
        }
    });

    // Ordenar os meses cronologicamente
    const mesesOrdenados = Object.keys(contagem).sort((a, b) => {
        const [mesA, anoA] = a.split(' ');
        const [mesB, anoB] = b.split(' ');
        const dateA = new Date(`${mesA} 1, ${anoA}`);
        const dateB = new Date(`${mesB} 1, ${anoB}`);
        return dateA - dateB;
    });

    const resultado = mesesOrdenados.map(mes => ({
        mes: mes,
        quantidade: contagem[mes]
    }));

    return resultado;
}

/**
 * Atualiza a exibição da tabela com base na página atual.
 */
function renderizarTabelaPagina() {
    const tbody = document.querySelector('#tabelaTickets tbody');
    if (!tbody) {
        console.error('Elemento tbody da tabela #tabelaTickets não encontrado.');
        return;
    }
    tbody.innerHTML = ''; // Limpar a tabela

    const start = (currentPage - 1) * ticketsPerPage;
    const end = start + ticketsPerPage;
    const ticketsParaExibir = paginatedTickets.slice(start, end);

    ticketsParaExibir.forEach(ticket => {
        const tr = document.createElement('tr');

        // Células com campos
        const tdId = document.createElement('td');
        tdId.textContent = ticket.id;

        const tdCliente = document.createElement('td');
        tdCliente.textContent = ticket.cliente;

        // === MÁSCARA NO USUÁRIO ===
        const tdUsuario = document.createElement('td');
        tdUsuario.textContent = mascararUsuario(ticket.usuario); 
        // ==========================

        const tdRede = document.createElement('td');
        tdRede.textContent = ticket.rede;

        const tdMotivo = document.createElement('td');
        tdMotivo.textContent = ticket.motivo;

        const tdPrioridade = document.createElement('td');
        tdPrioridade.textContent = ticket.prioridade;

        const tdStatus = document.createElement('td');
        tdStatus.textContent = ticket.status;

        const tdDataInicio = document.createElement('td');
        tdDataInicio.textContent = formatarDataDisplay(ticket.data_inicio);

        const tdDataFim = document.createElement('td');
        tdDataFim.textContent = formatarDataDisplay(ticket.data_fim);

        const tdDescricao = document.createElement('td');
        tdDescricao.textContent = ticket.descricao;

        // Adiciona as células na linha
        tr.appendChild(tdId);
        tr.appendChild(tdCliente);
        tr.appendChild(tdUsuario);
        tr.appendChild(tdRede);
        tr.appendChild(tdMotivo);
        tr.appendChild(tdPrioridade);
        tr.appendChild(tdStatus);
        tr.appendChild(tdDataInicio);
        tr.appendChild(tdDataFim);
        tr.appendChild(tdDescricao);

        // Adiciona a linha no tbody
        tbody.appendChild(tr);
    });
}

/**
 * Função para aplicar a máscara no usuário:
 * - Remove "@grupononna.com.br"
 * - Substitui todos os "." por espaço
 * - Deixa a primeira letra de cada palavra em maiúscula
 */
function mascararUsuario(usuario) {
    if (!usuario) return '';

    // Remove o domínio
    let resultado = usuario.replace('@grupononna.com.br', '');

    // Substitui todos os pontos por espaço
    resultado = resultado.replace(/\./g, ' ');

    // Deixa a primeira letra de cada palavra em maiúscula
    const palavras = resultado.split(' ');
    const palavrasFormatadas = palavras.map(p => {
        if (!p) return '';
        return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    });

    return palavrasFormatadas.join(' ').trim();
}

/**
 * Atualiza os controles de paginação da tabela.
 */
function atualizarControlesPaginacao() {
    const totalPages = Math.ceil(paginatedTickets.length / ticketsPerPage) || 1;
    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');

    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalPages;

    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
}

/**
 * Renderiza a tabela de tickets com paginação.
 */
function atualizarTabelaComPaginacao(tickets) {
    paginatedTickets = tickets;
    currentPage = 1;
    renderizarTabelaPagina();
    atualizarControlesPaginacao();
}

/**
 * Formata a data para exibição no formato DD/MM/AAAA.
 */
function formatarDataDisplay(dataISO) {
    if (!dataISO) return '';
    const data = new Date(dataISO);
    if (isNaN(data.getTime())) return '';
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

/**
 * Aplica os filtros principais e atualiza os gráficos e a tabela.
 */
function aplicarFiltrosPrincipais() {
    console.log('Aplicando filtros principais.');

    const filtroClienteEl = document.getElementById('filtroCliente');
    const filtroUsuarioEl = document.getElementById('filtroUsuario');
    const filtroRedeEl = document.getElementById('filtroRede');
    const filtroMotivoEl = document.getElementById('filtroMotivo');
    const filtroPrioridadeEl = document.getElementById('filtroPrioridade');
    const filtroStatusEl = document.getElementById('filtroStatus');
    const filtroDataInicioEl = document.getElementById('filtroDataInicio');
    const filtroDataFimEl = document.getElementById('filtroDataFim');

    const clienteSelecionado = filtroClienteEl ? filtroClienteEl.value : '';
    const usuarioSelecionado = filtroUsuarioEl ? filtroUsuarioEl.value : '';
    const redeSelecionada = filtroRedeEl ? filtroRedeEl.value : '';
    const motivoSelecionado = filtroMotivoEl ? filtroMotivoEl.value : '';
    const prioridadeSelecionada = filtroPrioridadeEl ? filtroPrioridadeEl.value : '';
    const statusSelecionado = filtroStatusEl ? filtroStatusEl.value : '';
    const dataInicio = filtroDataInicioEl ? filtroDataInicioEl.value : '';
    const dataFim = filtroDataFimEl ? filtroDataFimEl.value : '';

    // Filtrar
    let ticketsFiltrados = [...todosOsTickets];

    if (clienteSelecionado) {
        ticketsFiltrados = ticketsFiltrados.filter(t => t.cliente === clienteSelecionado);
    }

    if (usuarioSelecionado) {
        ticketsFiltrados = ticketsFiltrados.filter(t => t.usuario === usuarioSelecionado);
    }

    if (redeSelecionada) {
        ticketsFiltrados = ticketsFiltrados.filter(t => t.rede === redeSelecionada);
    }

    if (motivoSelecionado) {
        ticketsFiltrados = ticketsFiltrados.filter(t => t.motivo === motivoSelecionado);
    }

    if (prioridadeSelecionada) {
        ticketsFiltrados = ticketsFiltrados.filter(t => t.prioridade === prioridadeSelecionada);
    }

    if (statusSelecionado) {
        ticketsFiltrados = ticketsFiltrados.filter(t => t.status === statusSelecionado);
    }

    if (dataInicio) {
        const dataInicioDate = new Date(dataInicio);
        ticketsFiltrados = ticketsFiltrados.filter(t => {
            const dataTicket = new Date(t.data_inicio);
            return !isNaN(dataTicket) && dataTicket >= dataInicioDate;
        });
    }

    if (dataFim) {
        const dataFimDate = new Date(dataFim);
        ticketsFiltrados = ticketsFiltrados.filter(t => {
            const dataTicket = new Date(t.data_fim);
            return !isNaN(dataTicket) && dataTicket <= dataFimDate;
        });
    }

    console.log('Tickets após aplicação dos filtros principais:', ticketsFiltrados);

    // Resetar filtroGlobal
    filtroGlobal = {};

    // Atualizar gráficos
    renderizarGraficos(ticketsFiltrados);

    // Atualizar tabela
    atualizarTabelaComPaginacao(ticketsFiltrados);
    renderizarTabelaPagina();
    atualizarControlesPaginacao();
}

/**
 * Limpa todos os filtros e atualiza os gráficos e a tabela para mostrar todos os tickets.
 */
function limparFiltros() {
    console.log('Limpando filtros.');
    // Resetar os filtros principais
    document.getElementById('filtroCliente').value = '';
    document.getElementById('filtroUsuario').value = '';
    document.getElementById('filtroRede').value = '';
    document.getElementById('filtroMotivo').value = '';
    document.getElementById('filtroPrioridade').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroDataInicio').value = '';
    document.getElementById('filtroDataFim').value = '';

    // Resetar o filtro global e a paginação dos gráficos
    filtroGlobal = {};
    resetarPaginacaoGraficos();

    // Atualizar gráficos e tabela com todos os tickets
    renderizarGraficos(todosOsTickets);
    atualizarTabelaComPaginacao(todosOsTickets);
    renderizarTabelaPagina();
    atualizarControlesPaginacao();
}

/**
 * Reseta os estados de paginação de todos os gráficos para página 1.
 */
function resetarPaginacaoGraficos() {
    for (const campo in paginacaoGraficos) {
        if (paginacaoGraficos.hasOwnProperty(campo)) {
            paginacaoGraficos[campo].currentPage = 1;
            // Atualiza também o gráfico
            atualizarGrafico(campo, charts[campo]?.options.chart.type);
        }
    }
    console.log('Estados de paginação dos gráficos resetados.');
}

/**
 * Função para capitalizar a primeira letra de uma string.
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Configura os eventos do modal de download.
 */
function configurarEventosDownload() {
    const btnDownloadTabela = document.getElementById('btnDownloadTabela');
    const modal = document.getElementById('modalDownloadTabela');
    const spanClose = modal ? modal.querySelector('.close') : null;
    const btnBaixarTodos = document.getElementById('btnBaixarTodos');
    const btnBaixarFiltrados = document.getElementById('btnBaixarFiltrados');

    if (btnDownloadTabela && modal) {
        btnDownloadTabela.addEventListener('click', () => {
            modal.style.display = 'block';
        });
        console.log('Evento click adicionado ao botão #btnDownloadTabela.');
    } else {
        console.warn('Botão #btnDownloadTabela ou modal não encontrado.');
    }

    if (spanClose && modal) {
        spanClose.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        console.log('Evento click adicionado ao elemento .close do modal.');
    } else {
        console.warn('Elemento .close do modal não encontrado.');
    }

    // Fechar o modal ao clicar fora do conteúdo
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    if (btnBaixarTodos) {
        btnBaixarTodos.addEventListener('click', () => {
            baixarTodosComoCSV();
            if (modal) modal.style.display = 'none';
        });
        console.log('Evento click adicionado ao botão #btnBaixarTodos.');
    } else {
        console.warn('Botão #btnBaixarTodos não encontrado.');
    }

    if (btnBaixarFiltrados) {
        btnBaixarFiltrados.addEventListener('click', () => {
            baixarFiltradosComoCSV();
            if (modal) modal.style.display = 'none';
        });
        console.log('Evento click adicionado ao botão #btnBaixarFiltrados.');
    } else {
        console.warn('Botão #btnBaixarFiltrados não encontrado.');
    }
}

/**
 * Converte um array de tickets para CSV.
 * @param {Array} tickets - Array de objetos de tickets.
 * @param {boolean} incluirCabecalho - Se true, inclui o cabeçalho no CSV.
 * @returns {string} - String CSV.
 */
function ticketsParaCSV(tickets, incluirCabecalho = true) {
    const linhas = [];
    const cabecalho = [
        "ID", 
        "Cliente", 
        "Usuário", 
        "Rede", 
        "Motivo", 
        "Prioridade", 
        "Status", 
        "Data Início", 
        "Data Fim", 
        "Descrição"
    ];

    if (incluirCabecalho) {
        linhas.push(cabecalho.join(','));
    }

    tickets.forEach(ticket => {
        const linha = [
            `"${ticket.id}"`,
            `"${ticket.cliente}"`,
            `"${ticket.usuario}"`,
            `"${ticket.rede}"`,
            `"${ticket.motivo}"`,
            `"${ticket.prioridade}"`,
            `"${ticket.status}"`,
            `"${formatarDataDisplay(ticket.data_inicio)}"`,
            `"${formatarDataDisplay(ticket.data_fim)}"`,
            `"${(ticket.descricao || '').replace(/"/g, '""')}"`
        ];
        linhas.push(linha.join(','));
    });

    return linhas.join('\n');
}

/**
 * Baixa todos os tickets como CSV.
 */
function baixarTodosComoCSV() {
    if (!todosOsTickets || todosOsTickets.length === 0) {
        console.warn('Nenhum ticket disponível para download.');
        return;
    }

    const csv = ticketsParaCSV(todosOsTickets, true);
    baixarCSV(csv, 'tabela_completa.csv');
    console.log('Tabela completa baixada como CSV.');
}

/**
 * Baixa os tickets filtrados como CSV.
 */
function baixarFiltradosComoCSV() {
    // Se quiser baixar somente a página atual, use "paginatedTickets.slice(...)"
    // Se quiser baixar todos os filtrados, é "paginatedTickets" inteiro
    if (!paginatedTickets || paginatedTickets.length === 0) {
        console.warn('Nenhum ticket filtrado disponível para download.');
        return;
    }

    const csv = ticketsParaCSV(paginatedTickets, true);
    baixarCSV(csv, 'tabela_filtrada.csv');
    console.log('Tabela filtrada baixada como CSV.');
}

/**
 * Baixa o conteúdo fornecido como um arquivo CSV.
 * @param {string} conteudo - Conteúdo CSV.
 * @param {string} nomeArquivo - Nome do arquivo a ser baixado.
 */
function baixarCSV(conteudo, nomeArquivo) {
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // Suporte para navegadores
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", nomeArquivo);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Função para inicializar os gráficos responsivos após redimensionamento.
 */
function inicializarReflowGraficos() {
    window.addEventListener('resize', () => {
        console.log('Redimensionando janela. Reflow nos gráficos.');
        Highcharts.charts.forEach(chart => {
            if (chart) {
                chart.reflow();
                console.log(`Gráfico ${chart.renderTo.id} reflowed.`);
            }
        });
    });
}

// Chamando a função para inicializar o reflow dos gráficos
inicializarReflowGraficos();
