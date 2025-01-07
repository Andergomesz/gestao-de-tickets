// Definindo usuários e perfis
const usuariosAtivos = {
    "anderson@grupononna.com.br": { senha: "Anderson", perfil: "Administrador" },
    "takeda@grupononna.com.br": { senha: "Takeda", perfil: "Administrador" },
    "renata.nogueira@grupononna.com.br": { senha: "Renata", perfil: "Administrador" },
    "rodrigo@grupononna.com.br": { senha: "Rodrigo", perfil: "Administrador" },
    "ana.monteiro@grupononna.com.br": { senha: "Anderson13", perfil: "Básico" },
    "angela@grupononna.com.br": { senha: "Anderson03", perfil: "Básico" },
    "caroline.carvalho@grupononna.com.br": { senha: "Anderson14", perfil: "Básico" },
    "guilherme.andrade@grupononna.com.br": { senha: "Anderson15", perfil: "Básico" },
    "flavia.ramos@grupononna.com.br": { senha: "Anderson04", perfil: "Básico" },
    "karine.siqueira@grupononna.com.br": { senha: "Anderson05", perfil: "Básico" },
    "leonardo.oliveira@grupononna.com.br": { senha: "Anderson06", perfil: "Básico" },
    "lincoln.jesus@grupononna.com.br": { senha: "Anderson07", perfil: "Básico" },
    "lisya@grupononna.com.br": { senha: "Anderson08", perfil: "Básico" },
    "nayara@grupononna.com.br": { senha: "Anderson09", perfil: "Básico" },
    "thais@grupononna.com.br": { senha: "Anderson10", perfil: "Básico" },
    "victoria.bacelar@grupononna.com.br": { senha: "Anderson11", perfil: "Básico" },
    "vitoria.aguiar@grupononna.com.br": { senha: "Anderson12", perfil: "Básico" }
};

// Lógica de login
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('error-message');

    // Limpar mensagens de erro anteriores
    if (errorMessage) {
        errorMessage.textContent = '';
    }

    // Validações básicas
    if (!email || !password) {  
        exibirErro('Por favor, preencha todos os campos.');
        return;
    }

    // Verificar se o usuário está registrado e se a senha está correta
    if (usuariosAtivos[email] && usuariosAtivos[email].senha === password) {
        const perfil = usuariosAtivos[email].perfil;

        // Salvar informações do usuário no LocalStorage
        localStorage.setItem('perfilUsuario', perfil);
        localStorage.setItem('emailUsuario', email);

        // Redirecionar para a página principal do sistema de tickets
        window.location.href = "/src/html/gestãodeTickets.html";
    } else {
        exibirErro('Credenciais incorretas ou usuário não registrado.');
    }
});

// Função para exibir mensagens de erro
function exibirErro(mensagem) {
    let errorMessage = document.getElementById('error-message');

    // Se o elemento de mensagem de erro não existir, criar um
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.id = 'error-message';
        errorMessage.style.color = 'red';
        errorMessage.style.marginTop = '10px';
        document.getElementById('login-form').appendChild(errorMessage);
    }

    errorMessage.textContent = mensagem;
}

// Função para sincronizar usuários com o servidor
function sincronizarUsuarios() {
    // Extrai os usuários de 'usuariosAtivos' e transforma em uma lista com email, senha, e perfil
    const usuarios = Object.keys(usuariosAtivos).map(email => {
        return {
            email: email,
            senha: usuariosAtivos[email].senha, // Usa a senha correta definida no objeto
            perfil: usuariosAtivos[email].perfil
        };
    });

    // Envia a lista de usuários para o servidor
    fetch('http://127.0.0.1:3000/usuarios', { // Certifique-se de que a URL está correta
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuarios })
    })
    .then(response => response.text())
    .then(data => {
        console.log('Resposta da API (Usuários):', data);
    })
    .catch(error => {
        console.error('Erro ao sincronizar usuários:', error);
    });
}

// Chama a função para sincronizar os usuários ao carregar a página
window.onload = sincronizarUsuarios;
