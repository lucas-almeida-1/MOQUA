# MOQUA - Monitoramento da Qualidade da Água

## Descrição

MOQUA é uma aplicação web para monitorar a qualidade da água em universidades com escalabilidade para outros setores e empresas. Permite aos usuários buscar por um local, visualizar dados de qualidade da água, registrar reclamações e, para gestores, analisar dados e gerar relatórios.

## Motivação

Este é um projeto da disciplina de Engenharia de Software II e o principal motivador do desenvolvimento desta aplicação foram os últimos acontecimentos do primeiro semestre de 2025 na Universidade Federal da Bahia sobre a qualidade de água. Com esta aplicação, não só alunos poderiam acompanhar o status de determinadas fontes de água, mas também as lideranças poderiam tomar medidas com maior celeridade tendo insights e acesso aos dados para melhor gestão.

## Divisão do projeto

No momento, o desenvolvimento do projeto está da seguinte forma:
*   Documento reunindo a análise de requisitos - Alan Melo e Rafael Rocha
*   Prototipação e desenvolvimento do produto - Lucas Almeida
*   Material e apresentação em sala - Abner Mateus
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
    git clone <seu-repositorio>
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

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.