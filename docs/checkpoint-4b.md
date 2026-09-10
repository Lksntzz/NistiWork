# Checkpoint 4B: conexão e ciclo de sessão

Base: `7371d51bb565500aab052112c7542a473f215e43` (10/09/2026).
Status: correções implementadas; homologação interativa no Windows pendente.

## Problemas corrigidos

- O comando de login tratava `TokenResponse.access_token: String` e `expires_in: i64` como `Option`, causando incompatibilidade de tipos.
- Login e logout agora compartilham exclusão mútua assíncrona. Uma operação concorrente é rejeitada, sem login enfileirado que reconecte após o logout.
- Falhas e cancelamento do futuro de login restauram o estado anterior. Nova credencial é verificada por uma nova Entry; erros de banco limpam somente a nova credencial.
- Consultas SQLite distinguem ausência de linha de falha. Reconectar a mesma conta preserva pasta, cursor e data de criação; trocar conta reinicia esses metadados.
- Logout confirma a remoção no SQLite antes de apagar cache/credencial. Uma revogação remota limitada a cinco segundos ocorre depois do logout local; falhas remotas não revertem a desconexão. Falha ao apagar a credencial local é apresentada como aviso.
- TokenManager usa um único estado de cache por conexão e geração, com renovação serializada. Respostas antigas não repovoam o cache após logout ou troca de conta.
- Erros OAuth são classificados pelo campo `error`, sem devolver corpos brutos. O callback não anuncia conexão concluída antes da troca de tokens.
- Status IPC tem campos `status` e `message`; a UI permite reconectar uma conta conectada e bloqueia botões durante operações.
- O recurso `windows-native` já estava habilitado no commit base e foi preservado. Startup e leitura de status continuam sem rede.

O `package-lock.json` foi restaurado do commit `2c85987`: `package.json` não mudou entre essas versões. Isso recupera `npm ci`. O Cargo.lock removido na base ainda precisa ser gerado e versionado pelo Cargo em ambiente com compilador; não foi reconstruído manualmente.

## Validação

O ambiente de edição não dispõe de Rust/Cargo. A instalação de dependências Node foi cancelada pela camada de autorização do ambiente. `git diff --check` passou. Esses fatos não equivalem a build aprovado.

O workflow `Checkpoint 4B checks` executa TypeScript, build, cargo check, testes Rust e confirmação de `windows-native` no Windows, sem credenciais OAuth. Consultar o resultado do workflow no PR; sua existência não comprova aprovação.

Testes Rust adicionados cobrem preservação de metadata por conta, rollback transacional, erro SQLite, restauração de status, exclusão mútua e rejeição de tokens atrasados. Nenhum teste usa credenciais reais.

## Homologação interativa obrigatória

Na branch do PR, com a configuração OAuth local existente:

1. Execute `npm ci`, `npx tsc --noEmit`, `npm run build` e, em src-tauri, `cargo check` e `cargo test`.
2. Execute `npm run tauri dev`. Conecte uma vez, encerre completamente e reabra: deve permanecer conectado sem navegador.
3. Encerre, desligue a internet e reabra: a conexão local deve continuar reconhecida.
4. Desconecte offline, encerre e reabra: deve permanecer desconectado. Repita online. Falha de revogação remota não deve impedir o logout local.
5. Conectado, use Reconectar e negue a autorização no Google. A conexão anterior deve permanecer. Apenas fechar a aba pode levar até o timeout de 180 segundos.
6. Reconecte a mesma conta: uma única linha de conexão, com metadados preservados. Teste troca de conta somente se houver outra conta de teste disponível.
7. Confira mensagens de erro e logs: nenhum token, segredo, código ou verifier deve aparecer.
8. Registre resultados observados e a versão testada. Uma credencial gravada pelo backend anterior não persistente pode exigir novo consentimento uma vez.

A interface fica ocupada por até cinco segundos no logout durante a tentativa de revogação; o estado local já está desconectado nesse intervalo. Tentativas concorrentes de conexão são rejeitadas até a conclusão dessa tentativa, evitando revogar um novo consentimento.

4C permanece pendente até a homologação de 4B. Nenhuma navegação/importação do Drive foi adicionada nesta alteração.
