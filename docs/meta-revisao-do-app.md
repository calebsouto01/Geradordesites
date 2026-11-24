# Revisão do app na Meta: material pronto

Cole estes textos nos campos da revisão (Análise do app → Permissões e recursos). Troque `{DOMINIO}` pelo domínio final e `{EMAIL_TESTE}` / `{SENHA_TESTE}` por um usuário de teste criado só para o revisor.

## Permissões a solicitar (acesso avançado)

- `whatsapp_business_management`
- `whatsapp_business_messaging`

## Descrição de uso (colar nos dois campos)

O Gerador de Sites é uma plataforma em que empresas criam agentes virtuais de atendimento. A empresa entra no painel, cria um agente (nome, tom de voz, instruções e base de conhecimento) e clica em "Conectar WhatsApp". Uma janela do Cadastro Incorporado da Meta abre, a empresa escolhe o número do WhatsApp Business e autoriza o app. Depois disso, quando um cliente da empresa envia mensagem para esse número, o nosso servidor recebe o evento `messages` pelo webhook e o agente responde ao cliente.

- `whatsapp_business_management`: usada para inscrever o nosso app (subscribed_apps) na conta do WhatsApp Business da empresa e registrar o número na Cloud API durante o Cadastro Incorporado.
- `whatsapp_business_messaging`: usada para enviar, pelo número da própria empresa, as respostas do agente às mensagens que os clientes enviaram primeiro.

Só respondemos a clientes que escreveram para a empresa. Não enviamos mensagens em massa nem promoções. O token de acesso fica apenas no servidor, e a empresa pode desconectar o número a qualquer momento no painel.

## Roteiro do vídeo de tela (2 a 3 minutos, sem cortes)

1. Abra `https://{DOMINIO}/login` e entre com o usuário de teste.
2. No menu lateral, clique em **Agentes de IA**. Mostre os 3 passos no topo da página.
3. Clique em **+ Novo agente**. Preencha nome, empresa, tom de voz, instruções e base de conhecimento e clique em **Salvar**.
4. No agente, clique em **WhatsApp** e depois em **Conectar WhatsApp**.
5. Na janela da Meta: faça login, escolha ou crie a conta empresarial, selecione o número, confirme o código e conclua. Mostre a janela se fechando e a mensagem "WhatsApp conectado" com o selo **conectado**.
6. No celular (grave a tela dividida ou mostre o aparelho), envie uma mensagem para o número conectado, por exemplo "Olá, qual o horário de atendimento?".
7. Volte ao painel e mostre a mensagem recebida e a resposta do agente em **Últimas mensagens**, e a mesma resposta chegando no celular.
8. Clique em **Desconectar** para mostrar que a empresa controla a conexão. Mostre também `https://{DOMINIO}/privacidade` e `https://{DOMINIO}/exclusao-de-dados`.

## Instruções de teste para o revisor

1. Acesse `https://{DOMINIO}/login` com o e-mail `{EMAIL_TESTE}` e a senha `{SENHA_TESTE}`.
2. Abra **Agentes de IA** no menu lateral. Já existe um agente de exemplo.
3. Clique em **WhatsApp** no agente e depois em **Conectar WhatsApp**. Conclua o Cadastro Incorporado com um número de teste.
4. Envie uma mensagem de texto para o número conectado.
5. A resposta do agente chega no WhatsApp em poucos segundos e aparece em **Últimas mensagens** no painel.
6. Para encerrar, clique em **Desconectar**.

## Dados do app (Configurações do app → Básico)

- Política de privacidade: `https://{DOMINIO}/privacidade`
- Termos de serviço: `https://{DOMINIO}/termos`
- Exclusão de dados (instruções): `https://{DOMINIO}/exclusao-de-dados`
- Domínio do app: `{DOMINIO}`
- Domínios do SDK JavaScript (Login do Facebook para Empresas → Configurações): `https://{DOMINIO}`
- URL do webhook (WhatsApp → Configuração): `https://{DOMINIO}/api/whatsapp/webhook`, com o campo `messages` assinado.
