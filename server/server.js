/************************************************
 * server.js
 ************************************************/
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// ===== Socket.IO =====
const http = require('http');
const { Server } = require('socket.io');

const app = express();
// Cria um servidor HTTP a partir do app Express
const server = http.createServer(app);

// Inicializa o Socket.IO, permitindo conexões de qualquer origem (CORS)
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

mysql://root:XsmxjCgluNLpkAuaQkkQRzNgLCutOUwE@autorack.proxy.rlwy.net:57619/railway

// 1. Configura o CORS
app.use(cors());

// 2. Aumenta o limite de dados aceitos no body para 50 MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. Conexão com o banco de dados (Railway)
const db = mysql.createConnection({
  host: 'mysql.railway.internal',              // ou mysql.railway.internal
  user: 'root',
  password: 'XsmxjCgluNLpkAuaQkkQRzNgLCutOUwE',
  database: 'railway',
  port: 3000
});


// Conecta ao banco de dados
db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1); // Encerra o servidor se não conectar ao BD
  } else {
    console.log('Conectado ao banco de dados MySQL (Railway).');
  }
});

// 4. Serve arquivos estáticos da pasta 'public'
app.use(express.static('public'));

// Função para converter data ISO em formato MySQL
function formatarDataParaMySQL(dataISO) {
  if (!dataISO) return null;
  const data = new Date(dataISO);
  if (isNaN(data.getTime())) {
    // Data inválida
    return null;
  }
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');
  const segundos = String(data.getSeconds()).padStart(2, '0');
  return `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}

/* ======================================================
   ROTAS GET PARA LER DADOS DO BANCO
   ====================================================== */

// Rota GET para buscar todos os tickets
app.get('/tickets', (req, res) => {
  const query = 'SELECT * FROM tickets';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar tickets:', err);
      return res.status(500).json({ error: 'Erro ao buscar tickets' });
    }
    res.json(results);
  });
});

// Rota GET para buscar todas as observações
app.get('/observacoes', (req, res) => {
  const query = 'SELECT * FROM observacoes';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar observações:', err);
      return res.status(500).json({ error: 'Erro ao buscar observações' });
    }
    res.json(results);
  });
});

// Rota GET para buscar todos os anexos
app.get('/anexos', (req, res) => {
  const query = 'SELECT * FROM anexos';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar anexos:', err);
      return res.status(500).json({ error: 'Erro ao buscar anexos' });
    }
    res.json(results);
  });
});

// Rota GET para buscar todos os convidados de tickets
app.get('/ticket-convidados', (req, res) => {
  const query = 'SELECT * FROM ticket_convidados';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar convidados:', err);
      return res.status(500).json({ error: 'Erro ao buscar convidados' });
    }
    res.json(results);
  });
});

// Rota GET para buscar todos os usuários
app.get('/usuarios', (req, res) => {
  const query = 'SELECT * FROM usuarios';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar usuários:', err);
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
    res.json(results);
  });
});

// Rota GET para buscar todos os clientes em ordem alfabética
app.get('/clientes', (req, res) => {
  const query = `
    SELECT DISTINCT TRIM(Cliente) AS Cliente 
    FROM cliente 
    WHERE Cliente IS NOT NULL AND TRIM(Cliente) <> '' 
    ORDER BY Cliente ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar clientes:', err);
      return res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
    const clientes = results
      .map(row => row.Cliente)
      .filter(cliente => cliente && cliente.trim() !== '');
    console.log(`Clientes encontrados: ${clientes.length}`);
    res.json(clientes);
  });
});

// Rota GET para buscar todas as redes em ordem alfabética
app.get('/redes', (req, res) => {
  const query = `
    SELECT DISTINCT TRIM(Rede) AS Rede 
    FROM rede 
    WHERE Rede IS NOT NULL AND TRIM(Rede) <> '' 
    ORDER BY Rede ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar redes:', err);
      return res.status(500).json({ error: 'Erro ao buscar redes' });
    }
    const redes = results
      .map(row => row.Rede)
      .filter(rede => rede && rede.trim() !== '');
    console.log(`Redes encontradas: ${redes.length}`);
    res.json(redes);
  });
});

// Rota GET para buscar todas as motivos em ordem alfabética
app.get('/motivos', (req, res) => {
  const query = `
    SELECT DISTINCT TRIM(Motivo) AS Motivo 
    FROM motivo 
    WHERE Motivo IS NOT NULL AND TRIM(Motivo) <> '' 
    ORDER BY Motivo ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar motivos:', err);
      return res.status(500).json({ error: 'Erro ao buscar motivos' });
    }
    const motivos = results
      .map(row => row.Motivo)
      .filter(motivo => motivo && motivo.trim() !== '');
    console.log(`Motivos encontrados: ${motivos.length}`);
    res.json(motivos);
  });
});

// Rotas de contagem (opcional)
app.get('/clientes/count', (req, res) => {
  const query = `
    SELECT COUNT(DISTINCT TRIM(Cliente)) AS total 
    FROM cliente 
    WHERE Cliente IS NOT NULL AND TRIM(Cliente) <> ''
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao contar clientes:', err);
      return res.status(500).json({ error: 'Erro ao contar clientes' });
    }
    const total = results[0].total;
    console.log(`Total de clientes: ${total}`);
    res.json({ total });
  });
});

app.get('/redes/count', (req, res) => {
  const query = `
    SELECT COUNT(DISTINCT TRIM(Rede)) AS total 
    FROM rede 
    WHERE Rede IS NOT NULL AND TRIM(Rede) <> ''
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao contar redes:', err);
      return res.status(500).json({ error: 'Erro ao contar redes' });
    }
    const total = results[0].total;
    console.log(`Total de redes: ${total}`);
    res.json({ total });
  });
});

app.get('/motivos/count', (req, res) => {
  const query = `
    SELECT COUNT(DISTINCT TRIM(Motivo)) AS total 
    FROM motivo 
    WHERE Motivo IS NOT NULL AND TRIM(Motivo) <> ''
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao contar motivos:', err);
      return res.status(500).json({ error: 'Erro ao contar motivos' });
    }
    const total = results[0].total;
    console.log(`Total de motivos: ${total}`);
    res.json({ total });
  });
});

// Middleware de Tratamento de Erros (opcional)
app.use((err, req, res, next) => {
  console.error('Erro interno:', err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

/* ======================================================
   ROTAS POST PARA CRIAR/ATUALIZAR DADOS DO BANCO
   ====================================================== */

// Rota para criar ou atualizar tickets
app.post('/tickets', async (req, res) => {
  const tickets = req.body.tickets;

  if (!Array.isArray(tickets) || tickets.length === 0) {
    return res.status(400).send('Nenhum ticket para sincronizar.');
  }

  const dbPromise = db.promise();
  let erros = [];

  try {
    for (const ticket of tickets) {
      // Formatar datas para o formato MySQL
      const dataInicio      = ticket.dataInicio      ? formatarDataParaMySQL(ticket.dataInicio)      : null;
      const dataFim         = ticket.dataFim         ? formatarDataParaMySQL(ticket.dataFim)         : null;
      const dataAbertura    = ticket.dataAbertura    ? formatarDataParaMySQL(ticket.dataAbertura)    : null;
      const dataFinalizacao = ticket.dataFinalizacao ? formatarDataParaMySQL(ticket.dataFinalizacao) : null;
      const tempoInicio     = ticket.tempoInicio     ? formatarDataParaMySQL(ticket.tempoInicio)     : null;
      const tempoFim        = ticket.tempoFim        ? formatarDataParaMySQL(ticket.tempoFim)        : null;
      const motivoExclusao  = ticket.motivoExclusao  || null;

      // Verificar se o usuário existe antes de inserir/atualizar
      const usuarioExiste = await verificarUsuarioExiste(dbPromise, ticket.usuario);
      if (!usuarioExiste) {
        // Se não existe, registra erro e continua
        erros.push(`Usuário não encontrado: ${ticket.usuario} (Ticket ID: ${ticket.id})`);
        continue;
      }

      // Verifica se o ticket já existe
      const [results] = await dbPromise.query('SELECT id FROM tickets WHERE id = ?', [ticket.id]);
      
      if (results.length > 0) {
        // Atualizar ticket
        const atualizarQuery = `
          UPDATE tickets SET
            cliente = ?, usuario = ?, rede = ?, motivo = ?, prioridade = ?, veiculo = ?,
            data_inicio = ?, data_fim = ?, descricao = ?, status = ?, data_abertura = ?,
            data_finalizacao = ?, tempo_inicio = ?, tempo_fim = ?, motivo_exclusao = ?
          WHERE id = ?
        `;
        try {
          await dbPromise.query(atualizarQuery, [
            ticket.cliente,
            ticket.usuario,
            ticket.rede,
            ticket.motivo,
            ticket.prioridade,
            ticket.veiculo,
            dataInicio,
            dataFim,
            ticket.descricao,
            ticket.status,
            dataAbertura,
            dataFinalizacao,
            tempoInicio,
            tempoFim,
            motivoExclusao,
            ticket.id,
          ]);

          // Emite evento via Socket.IO
          io.emit('ticketsAtualizados', { ticketId: ticket.id });
        } catch (err) {
          erros.push(`Erro ao atualizar o ticket ${ticket.id}: ${err.message}`);
        }

      } else {
        // Inserir ticket
        const inserirQuery = `
          INSERT INTO tickets (
            id, cliente, usuario, rede, motivo, prioridade, veiculo,
            data_inicio, data_fim, descricao, status, data_abertura,
            data_finalizacao, tempo_inicio, tempo_fim, motivo_exclusao
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        try {
          await dbPromise.query(inserirQuery, [
            ticket.id,
            ticket.cliente,
            ticket.usuario,
            ticket.rede,
            ticket.motivo,
            ticket.prioridade,
            ticket.veiculo,
            dataInicio,
            dataFim,
            ticket.descricao,
            ticket.status,
            dataAbertura,
            dataFinalizacao,
            tempoInicio,
            tempoFim,
            motivoExclusao,
          ]);

          // Emite evento via Socket.IO
          io.emit('ticketsAtualizados', { ticketId: ticket.id });
        } catch (err) {
          erros.push(`Erro ao inserir o ticket ${ticket.id}: ${err.message}`);
        }
      }
    }

    if (erros.length > 0) {
      return res.status(500).send(`Erros encontrados: ${erros.join(', ')}`);
    } else {
      return res.send('Tickets sincronizados com sucesso.');
    }

  } catch (globalError) {
    console.error('Erro geral ao sincronizar tickets:', globalError);
    return res.status(500).send(`Erro geral: ${globalError.message}`);
  }
});

// Rota para criar ou atualizar observações
app.post('/observacoes', async (req, res) => {
  const { observacoes } = req.body;

  if (!Array.isArray(observacoes) || observacoes.length === 0) {
    return res.status(400).send('Nenhuma observação fornecida.');
  }

  const dbPromise = db.promise();
  let erros = [];

  try {
    for (let i = 0; i < observacoes.length; i++) {
      const obs = observacoes[i];
      const { ticket_id, usuario_email, mensagem, hora } = obs;

      // Validação básica
      if (!ticket_id || !usuario_email || !mensagem || !hora) {
        erros.push(`Observação inválida no índice ${i}: Campos ausentes.`);
        continue;
      }

      // Converte hora ISO para formato MySQL
      const horaFormatada = formatarDataParaMySQL(hora);
      if (!horaFormatada) {
        erros.push(`Observação inválida no índice ${i}: Hora inválida.`);
        continue;
      }

      // Insere a observação
      const inserirQuery = `
        INSERT INTO observacoes (ticket_id, usuario_email, mensagem, hora)
        VALUES (?, ?, ?, ?)
      `;
      try {
        await dbPromise.query(inserirQuery, [ticket_id, usuario_email, mensagem, horaFormatada]);
        // Emite evento via Socket.IO
        io.emit('observacoesAtualizadas', { ticketId: ticket_id });
      } catch (err) {
        erros.push(`Erro no índice ${i} ao inserir a observação: ${err.message}`);
      }
    }

    if (erros.length > 0) {
      return res.status(500).send(`Erros encontrados: ${erros.join(', ')}`);
    } else {
      return res.send('Observações sincronizadas com sucesso.');
    }

  } catch (error) {
    console.error('Erro geral em /observacoes:', error);
    return res.status(500).send(`Erro geral: ${error.message}`);
  }
});

// Rota para criar ou atualizar anexos
app.post('/anexos', async (req, res) => {
  const { referencia_id, tipo_referencia, nome, url } = req.body;

  if (!referencia_id || !tipo_referencia || !nome || !url) {
    return res.status(400).send('Dados insuficientes para adicionar anexo.');
  }

  try {
    const inserirQuery = `
      INSERT INTO anexos (referencia_id, tipo_referencia, nome, url)
      VALUES (?, ?, ?, ?)
    `;
    const dbPromise = db.promise();
    await dbPromise.query(inserirQuery, [referencia_id, tipo_referencia, nome, url]);

    // Emite evento via Socket.IO
    io.emit('anexosAtualizados', { referenciaId: referencia_id });
    res.send('Anexo adicionado com sucesso.');
  } catch (err) {
    console.error('Erro ao inserir o anexo:', err);
    res.status(500).send('Erro ao inserir o anexo.');
  }
});

// Rota para criar ou atualizar convidados do ticket
app.post('/ticket-convidados', async (req, res) => {
  const convidados = req.body;

  if (!Array.isArray(convidados) || convidados.length === 0) {
    return res.status(400).send('Nenhum convidado para sincronizar.');
  }

  const dbPromise = db.promise();
  let erros = [];

  try {
    for (const convidado of convidados) {
      const { ticket_id, convidado_email } = convidado;
      if (!ticket_id || !convidado_email) {
        erros.push('Dados insuficientes: ticket_id ou convidado_email ausente.');
        continue;
      }

      try {
        const [results] = await dbPromise.query(
          `SELECT id FROM ticket_convidados WHERE ticket_id = ? AND convidado_email = ?`,
          [ticket_id, convidado_email]
        );

        if (results.length > 0) {
          // Se o convidado já existir, podemos ignorar ou atualizar
          console.log(`Convidado já existe para o ticket_id ${ticket_id}. Nenhuma atualização necessária.`);
        } else {
          // Inserir
          await dbPromise.query(
            `INSERT INTO ticket_convidados (ticket_id, convidado_email) VALUES (?, ?)`,
            [ticket_id, convidado_email]
          );
          // Emite evento via Socket.IO
          io.emit('convidadosAtualizados', { ticketId: ticket_id });
        }
      } catch (err) {
        console.error(`Erro ao processar convidado para ticket_id ${ticket_id}:`, err);
        erros.push(`Erro ao processar convidado para ticket_id ${ticket_id}: ${err.message}`);
      }
    }

    if (erros.length > 0) {
      return res.status(500).send(`Erros encontrados: ${erros.join(', ')}`);
    } else {
      return res.send('Convidados sincronizados com sucesso.');
    }
  } catch (error) {
    console.error('Erro geral em /ticket-convidados:', error);
    return res.status(500).send(`Erro geral: ${error.message}`);
  }
});

// Rota para criar ou atualizar usuários
app.post('/usuarios', async (req, res) => {
  const { usuarios } = req.body;
  if (!Array.isArray(usuarios) || usuarios.length === 0) {
    return res.status(400).send('Nenhum usuário para sincronizar.');
  }

  const dbPromise = db.promise();
  let erros = [];

  try {
    for (const usuario of usuarios) {
      const { email, senha, perfil } = usuario;
      if (!email || !senha || !perfil) {
        erros.push(`Usuário inválido: Campos ausentes para email ${email}.`);
        continue;
      }

      try {
        const [results] = await dbPromise.query(`SELECT email FROM usuarios WHERE email = ?`, [email]);

        if (results.length > 0) {
          // Atualizar usuário
          await dbPromise.query(
            `UPDATE usuarios SET senha = ?, perfil = ? WHERE email = ?`,
            [senha, perfil, email]
          );
          io.emit('usuariosAtualizados', { email });
        } else {
          // Inserir
          await dbPromise.query(
            `INSERT INTO usuarios (email, senha, perfil) VALUES (?, ?, ?)`,
            [email, senha, perfil]
          );
          io.emit('usuariosAtualizados', { email });
        }
      } catch (err) {
        console.error(`Erro ao processar usuário ${email}:`, err);
        erros.push(`Erro ao processar usuário ${email}: ${err.message}`);
      }
    }

    if (erros.length > 0) {
      return res.status(500).send(`Erros encontrados: ${erros.join(', ')}`);
    } else {
      return res.send('Usuários sincronizados com sucesso.');
    }
  } catch (error) {
    console.error('Erro geral em /usuarios:', error);
    return res.status(500).send(`Erro geral: ${error.message}`);
  }
});

/**
 * Verifica se um 'email' existe na tabela 'usuarios'.
 * Retorna true se existe, false caso contrário.
 */
async function verificarUsuarioExiste(dbPromise, email) {
  const query = 'SELECT email FROM usuarios WHERE email = ?';
  try {
    const [rows] = await dbPromise.query(query, [email]);
    return rows.length > 0;
  } catch (err) {
    throw new Error(`Erro ao verificar usuário ${email}: ${err.message}`);
  }
}

/* ======================================================
   EVENTOS DE SOCKET.IO
   ====================================================== */
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

/* ======================================================
   INICIA O SERVIDOR
   ====================================================== */
// Usa a variável de ambiente PORT (se existir) ou 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://127.0.0.1:${PORT}`);
});
