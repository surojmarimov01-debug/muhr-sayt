import * as vscode from 'vscode';
import Anthropic from '@anthropic-ai/sdk';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
let history: ChatMessage[] = [];

export function activate(context: vscode.ExtensionContext) {
  const provider = new ClaudeViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ClaudeViewProvider.viewType, provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('claude.setApiKey', async () => {
      const key = await vscode.window.showInputBox({
        prompt: 'Anthropic API kalitingizni kiriting',
        password: true, ignoreFocusOut: true, placeHolder: 'sk-ant-...'
      });
      if (key) {
        await context.secrets.store('claude.apiKey', key.trim());
        vscode.window.showInformationMessage('Claude API kaliti saqlandi.');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('claude.newChat', () => {
      history = [];
      provider.reset();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('claude.explainSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) { vscode.window.showWarningMessage("Ochiq fayl yo'q."); return; }
      const sel = editor.selection;
      const text = sel.isEmpty ? editor.document.getText() : editor.document.getText(sel);
      if (!text.trim()) { vscode.window.showWarningMessage("Tanlangan kod yo'q."); return; }
      const lang = editor.document.languageId;
      await vscode.commands.executeCommand('claudeChatView.focus');
      const prompt = `Quyidagi ${lang} kodini tushuntir:\n\n\`\`\`${lang}\n${text}\n\`\`\``;
      await provider.sendUserMessage(prompt);
    })
  );
}

export function deactivate() {}

class ClaudeViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'claudeChatView';
  private view?: vscode.WebviewView;
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };
    webviewView.webview.html = this.getHtml(webviewView.webview);
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'send') { await this.handleSend(msg.text); }
      else if (msg.type === 'new') { history = []; }
    });
  }

  public reset() { this.view?.webview.postMessage({ type: 'reset' }); }

  public async sendUserMessage(text: string) {
    this.view?.webview.postMessage({ type: 'user', text });
    await this.handleSend(text);
  }

  private async getClient(): Promise<Anthropic | undefined> {
    const key = await this.context.secrets.get('claude.apiKey');
    if (!key) {
      const pick = await vscode.window.showErrorMessage(
        "API kaliti o'rnatilmagan.", "Kalitni o'rnatish");
      if (pick) { await vscode.commands.executeCommand('claude.setApiKey'); }
      return undefined;
    }
    return new Anthropic({ apiKey: key });
  }

  private async handleSend(text: string) {
    const client = await this.getClient();
    if (!client) { return; }
    const cfg = vscode.workspace.getConfiguration('claude');
    const model = cfg.get<string>('model', 'claude-sonnet-5');
    const maxTokens = cfg.get<number>('maxTokens', 4096);
    const system = cfg.get<string>('systemPrompt', '');

    history.push({ role: 'user', content: text });
    this.view?.webview.postMessage({ type: 'assistantStart' });

    let full = '';
    try {
      const stream = client.messages.stream({
        model, max_tokens: maxTokens,
        system: system || undefined,
        messages: history.map((m) => ({ role: m.role, content: m.content }))
      });
      stream.on('text', (delta) => {
        full += delta;
        this.view?.webview.postMessage({ type: 'delta', text: delta });
      });
      await stream.finalMessage();
      history.push({ role: 'assistant', content: full });
      this.view?.webview.postMessage({ type: 'done' });
    } catch (err: any) {
      const message = err?.message ?? String(err);
      this.view?.webview.postMessage({ type: 'error', text: message });
      vscode.window.showErrorMessage('Claude xatosi: ' + message);
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const csp = `default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    return `<!DOCTYPE html><html lang="uz"><head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);margin:0;display:flex;flex-direction:column;height:100vh}
  #messages{flex:1;overflow-y:auto;padding:10px}
  .msg{margin-bottom:12px;white-space:pre-wrap;word-wrap:break-word}
  .msg .role{font-size:11px;opacity:.7;margin-bottom:3px;text-transform:uppercase}
  .user .bubble{background:var(--vscode-input-background);padding:8px;border-radius:6px}
  pre{background:var(--vscode-textCodeBlock-background);padding:8px;border-radius:6px;overflow-x:auto}
  code{font-family:var(--vscode-editor-font-family)}
  #inputArea{display:flex;flex-direction:column;border-top:1px solid var(--vscode-panel-border);padding:8px;gap:6px}
  textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:48px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border);border-radius:4px;padding:6px;font-family:inherit}
  .row{display:flex;gap:6px}
  button{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;padding:6px 12px;border-radius:4px;cursor:pointer}
  button.secondary{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}
</style></head><body>
  <div id="messages"></div>
  <div id="inputArea">
    <textarea id="input" placeholder="Savolingizni yozing... (Ctrl+Enter — yuborish)"></textarea>
    <div class="row">
      <button id="send">Yuborish</button>
      <button id="new" class="secondary">Yangi chat</button>
    </div>
  </div>
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const messages = document.getElementById('messages');
  const input = document.getElementById('input');
  let current = null;
  function escapeHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function render(text){
    const parts = text.split('\`\`\`'); let html='';
    for(let i=0;i<parts.length;i++){
      if(i%2===1){ const body=parts[i].replace(/^[a-zA-Z0-9]*\\n/,''); html+='<pre><code>'+escapeHtml(body)+'</code></pre>'; }
      else { html+=escapeHtml(parts[i]); }
    }
    return html;
  }
  function addMessage(role,text){
    const div=document.createElement('div'); div.className='msg '+role;
    div.innerHTML='<div class="role">'+(role==='user'?'Siz':'Claude')+'</div><div class="bubble"></div>';
    div.querySelector('.bubble').innerHTML=render(text); div.dataset.raw=text;
    messages.appendChild(div); messages.scrollTop=messages.scrollHeight; return div;
  }
  function send(){
    const text=input.value.trim(); if(!text)return;
    addMessage('user',text); input.value='';
    vscode.postMessage({type:'send',text});
  }
  document.getElementById('send').addEventListener('click',send);
  document.getElementById('new').addEventListener('click',()=>{messages.innerHTML='';vscode.postMessage({type:'new'});});
  input.addEventListener('keydown',(e)=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();send();}});
  window.addEventListener('message',(event)=>{
    const m=event.data;
    if(m.type==='user'){addMessage('user',m.text);}
    else if(m.type==='assistantStart'){current=addMessage('assistant','');}
    else if(m.type==='delta'){if(!current)current=addMessage('assistant','');current.dataset.raw+=m.text;current.querySelector('.bubble').innerHTML=render(current.dataset.raw);messages.scrollTop=messages.scrollHeight;}
    else if(m.type==='done'){current=null;}
    else if(m.type==='error'){addMessage('assistant','⚠️ Xato: '+m.text);current=null;}
    else if(m.type==='reset'){messages.innerHTML='';}
  });
</script></body></html>`;
  }
}

function getNonce() {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) text += chars.charAt(Math.floor(Math.random() * chars.length));
  return text;
}
