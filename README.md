# MOQUA - Monitoramento da Qualidade da Água

## Descrição

MOQUA é uma aplicação web para monitorar a qualidade da água em universidades com escalabilidade para outros setores e empresas. Permite aos usuários buscar por um local, visualizar dados de qualidade da água, registrar reclamações e, para gestores, analisar dados e gerar relatórios.

## Motivação

Este é um projeto da disciplina de Engenharia de Software II e o principal motivador do desenvolvimento desta aplicação foram os últimos acontecimentos do primeiro semestre de 2025 na Universidade Federal da Bahia sobre a qualidade de água. Com esta aplicação, não só alunos poderiam acompanhar o status de determinadas fontes de água, mas também as lideranças poderiam tomar medidas com maior celeridade tendo insights e acesso aos dados para melhor gestão.

## Divisão do projeto

No momento, o desenvolvimento do projeto está da seguinte forma:
*   Documento reunindo a análise de requisitos - Alan Melo e Rafael Rocha
*   Prototipação e desenvolvimento do produto - Lucas Almeida
*   Material e apresentação em sala - Abner Mateus e Matheus Barretto
*   Reuniões com cliente - Todos os membros

## Funcionalidades

*   **Busca Global:** Encontre universidades e institutos/setores.
*   **Dashboard:** Visualize dados de qualidade da água por setor/instituto.
*   **Registro de Reclamações:** Usuários podem registrar reclamações sobre a qualidade da água.
*   **Acesso Restrito (Gestores):**
    *   Login para gestores.
    *   Visão geral dos dados em tempo real.
    *   Configurações de notificação (SMS, Email, WhatsApp).
    *   Análise inteligente com IA (requer chave da API Gemini).
    *   Geração de relatórios em PDF.
*   **Modos Claro e Escuro:** Personalize a aparência da aplicação.

## Estrutura de Arquivos

```
MOQUA/
├── js/
│   ├── complaint.js               # Lógica para o registro de reclamações
│   ├── config.js                  # Configurações da aplicação (Firebase, Gemini API)
│   ├── dashboard.js               # Lógica para o dashboard
│   ├── firebase.js                # Inicialização e configuração do Firebase
│   ├── main.js                    # Lógica principal da aplicação
│   ├── manager.js                 # Lógica para o painel do gestor
│   └── ui.js                      # Funções de interface do usuário (modais, temas, etc.)
├── keys/
│   ├── .env                       # Arquivo para armazenar chaves de API (Você irá criar este arquivo com suas chaves)
│   ├── .env.example               # Exemplo de como o arquivo .env deve ser preenchido
│   └── generate-env-config.js     # Script Node.js para gerar o arquivo de configuração com as chaves de API
├── .gitignore                     # Arquivos ignorados pelo Git
├── index.html                     # Arquivo HTML principal
└── README.md                      # Você está aqui!
```

## Configuração

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/lucas-almeida-1/MOQUA.git
    cd MOQUA
    ```

2.  **Configurar as chaves de API:**

    *   Crie um arquivo `.env` na raiz do projeto (na pasta `MOQUA/`).
    *   Copie o conteúdo do arquivo `.env.example` para o arquivo `.env`.
    *   Preencha as chaves de API do Firebase e Gemini no arquivo `.env`.

    ```
    FIREBASE_CONFIG_JSON='{"apiKey":"SUA_CHAVE_FIREBASE", ...}'
    GEMINI_API_KEY="SUA_CHAVE_GEMINI"
    ```

    **Importante:** Não commite o arquivo `.env` para o GitHub! Ele já está no `.gitignore`.

3.  **Gerar o arquivo de configuração `js/env-config.js`:**

    *   Certifique-se de ter o Node.js instalado.
    *   Execute o seguinte comando na raiz do projeto:

        ```bash
        node keys/generate-env-config.js
        ```

        Este comando irá ler as chaves de API do arquivo `.env` e gerar o arquivo `js/env-config.js`, que será usado pela aplicação.

4.  **Abrir o `index.html` no navegador:**

    *   Abra o arquivo `index.html` no seu navegador.

## Notas

*   A aplicação utiliza o Firebase para armazenar os dados e autenticar os usuários.
*   A funcionalidade de análise com IA requer uma chave da API Gemini.
*   As configurações de notificação (SMS, Email, WhatsApp) são apenas simulações e não enviam notificações reais.
*   Este projeto foi desenvolvido para fins de estudo e demonstração.

## Capturas de tela

Estas são capturas de recursos de cada tela da aplicação:

<div align="center">
  Home Screen. Nela, podemos buscar uma universidade específica ou seus respectivos setores internos.
  <img src="https://github.com/user-attachments/assets/3bff0804-5eac-4392-9b5d-6d69fddc3606" alt="Home Screen" width="" height="" >
</div>
<hr>
<div align="center">
  Dark Home Screen. Perceba que todas as páginas possuem essa feature no canto superior da página para troca.
  <img src="https://github.com/user-attachments/assets/fb0611b4-c186-4667-b88f-2e1ab54c8959" alt="Dark Home Screen" width="" height="" >
</div>
<hr>
<div align="center">
  Busca de um determinado setor de uma universidade. Desta vez, a filtragem é apenas dentro da mesma universidade.
  <img src="https://github.com/user-attachments/assets/92807bc7-46ca-4d48-8ae7-d7cb3cce3724" alt="Sector Search Screen" width="" height="" >
</div>
<hr>
<div align="center">
  Um pop-up é exibido ao abrir o dashboard caso tenha um caso crítico ou alerta de má qualidade de água.
  <img src="https://github.com/user-attachments/assets/daea0776-49fd-4d16-8dd6-b1b92dd75551" alt="Alert Pop-up" width="" height="" >
</div>
<hr>
<div align="center">
  Recurso de filtragem de fontes de água.
  <img src="https://github.com/user-attachments/assets/58dd701a-94ea-418a-811a-b719ec277131" alt="Dashboard screen with filter feature" width="" height="" >
</div>
<hr>
<div align="center">
  Pop-up para feedback do usuário. Estas reclamações serão enviadas diretamente aos gestores para posterior análise.
  <img src="https://github.com/user-attachments/assets/f11f9e08-4fc3-4391-a552-f461dfa6542e" alt="User feedback pop-up with text field validation" width="" height="" >
</div>
<hr>
<div align="center">
  Login para acesso restrito aos gestores. Note que todas os campos obrigatórios da plataforma já possuem sistema de validação de conteúdo.
  <img src="https://github.com/user-attachments/assets/dc55315c-4702-4a27-865c-166d15beaa6d" alt="Manager Login Screen with text field validation" width="" height="" >
</div>
<hr>
<div align="center">
  Área do Gestor com integração IA para gerar insights em tempo real dos dados.
  <img src="https://github.com/user-attachments/assets/5c5af159-2b73-438a-a78f-96d08dc444e9" alt="Manager Screen with AI integration for real time insights" width="" height="" >
</div>
<hr>
<div align="center">
  Sistema de notificação para os gestores.
  <img src="https://github.com/user-attachments/assets/9ddba96d-a72a-4f63-a192-b7c0684dd8d9" alt="Notification System on Manager Screen" width="" height="" >
</div>
<hr>
<div align="center">
  O gestor consegue gerar insights com IA sobre a qualidade da água em tempo real.
  <img src="https://github.com/user-attachments/assets/91677278-58fa-41fe-8424-c623cfb4945e" alt="AI insights in real time" width="" height="" >
</div>
<hr>
<div align="center">
  Preview do PDF com os dados para exportação e possibilidade de baixar o material.
  <img src="https://github.com/user-attachments/assets/4ccab449-c880-416c-900e-086e66d7fae9" alt="PDF preview and download option on manager screen pop-up" width="" height="" >
</div>

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.
