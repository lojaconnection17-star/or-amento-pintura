// Rafael Nunes - Orçamento de Pintura e Acabamentos
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const servicosSelecionados = new Set();
const itensOrcamento = [];
const tarefas = [];

document.getElementById("orcamento-data").value = new Date().toISOString().slice(0, 10);

function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1600);
}

function salvarEstado() {
  try {
    const estado = {
      cliente: {
        nome: document.getElementById("cliente-nome").value,
        telefone: document.getElementById("cliente-telefone").value,
        endereco: document.getElementById("cliente-endereco").value,
        obs: document.getElementById("cliente-obs").value,
        data: document.getElementById("orcamento-data").value,
        validade: document.getElementById("orcamento-validade").value,
        responsavel: document.getElementById("orcamento-responsavel").value
      },
      servicos: Array.from(servicosSelecionados),
      parede: {
        nome: document.getElementById("parede-nome").value,
        comprimento: document.getElementById("parede-comprimento").value,
        largura: document.getElementById("parede-largura").value,
        altura: document.getElementById("parede-altura").value,
        aberturas: document.getElementById("parede-aberturas").value
      },
      precos: {
        usarPadrao: document.getElementById("usar-padrao").checked,
        pinturaMo: document.getElementById("preco-pintura-mo").value,
        pinturaMat: document.getElementById("preco-pintura-mat").value,
        massaMo: document.getElementById("preco-massa-mo").value,
        massaMat: document.getElementById("preco-massa-mat").value,
        texturaMo: document.getElementById("preco-textura-mo").value,
        texturaMat: document.getElementById("preco-textura-mat").value
      },
      tarefas: tarefas,
      descontoPercent: document.getElementById("desconto-percent").value,
      descontoReais: document.getElementById("desconto-reais").value,
      mostrarDados: document.getElementById("mostrar-dados").checked
    };
    localStorage.setItem("rafaelnunes_orcamento", JSON.stringify(estado));
  } catch(e) {}
}

function carregarEstado() {
  try {
    const raw = localStorage.getItem("rafaelnunes_orcamento");
    if (!raw) return;
    const estado = JSON.parse(raw);
    if (estado.cliente) {
      document.getElementById("cliente-nome").value = estado.cliente.nome || "";
      document.getElementById("cliente-telefone").value = estado.cliente.telefone || "";
      document.getElementById("cliente-endereco").value = estado.cliente.endereco || "";
      document.getElementById("cliente-obs").value = estado.cliente.obs || "";
      if (estado.cliente.data) document.getElementById("orcamento-data").value = estado.cliente.data;
      if (estado.cliente.validade) document.getElementById("orcamento-validade").value = estado.cliente.validade;
      document.getElementById("orcamento-responsavel").value = estado.cliente.responsavel || "Rafael Nunes";
    }
    if (Array.isArray(estado.servicos)) {
      estado.servicos.forEach(s => {
        servicosSelecionados.add(s);
        const card = document.querySelector(`.service-card[data-service="${s}"]`);
        if (card) card.classList.add("active");
      });
      atualizarMedicoes();
    }
    if (estado.parede) {
      document.getElementById("parede-nome").value = estado.parede.nome || "";
      document.getElementById("parede-comprimento").value = estado.parede.comprimento || "";
      document.getElementById("parede-largura").value = estado.parede.largura || "";
      document.getElementById("parede-altura").value = estado.parede.altura || "2.70";
      document.getElementById("parede-aberturas").value = estado.parede.aberturas || "0";
    }
    if (estado.precos) {
      document.getElementById("usar-padrao").checked = estado.precos.usarPadrao !== false;
      togglePadrao();
      document.getElementById("preco-pintura-mo").value = estado.precos.pinturaMo || "18";
      document.getElementById("preco-pintura-mat").value = estado.precos.pinturaMat || "16";
      document.getElementById("preco-massa-mo").value = estado.precos.massaMo || "16";
      document.getElementById("preco-massa-mat").value = estado.precos.massaMat || "12";
      document.getElementById("preco-textura-mo").value = estado.precos.texturaMo || "25";
      document.getElementById("preco-textura-mat").value = estado.precos.texturaMat || "22";
    }
    if (Array.isArray(estado.tarefas)) {
      tarefas.length = 0;
      estado.tarefas.forEach(t => tarefas.push(t));
      renderizarTarefas();
    }
    if (estado.descontoPercent !== undefined) document.getElementById("desconto-percent").value = estado.descontoPercent;
    if (estado.descontoReais !== undefined) document.getElementById("desconto-reais").value = estado.descontoReais;
    if (estado.mostrarDados !== undefined) document.getElementById("mostrar-dados").checked = estado.mostrarDados;
    calcularMedidas();
    toast("Último orçamento carregado");
  } catch(e) {}
}

carregarEstado();

function irPara(etapa) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  const panel = document.getElementById("panel-" + etapa);
  if (panel) panel.classList.add("active");
  document.querySelectorAll(".step").forEach(s => {
    const n = Number(s.dataset.step);
    s.classList.toggle("active", n === etapa);
    s.classList.toggle("done", n < etapa);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (etapa === 5) atualizarResumo();
  salvarEstado();
}

function toggleServico(card) {
  const svc = card.dataset.service;
  if (servicosSelecionados.has(svc)) {
    servicosSelecionados.delete(svc);
    card.classList.remove("active");
  } else {
    servicosSelecionados.add(svc);
    card.classList.add("active");
  }
  atualizarMedicoes();
  salvarEstado();
}

function atualizarMedicoes() {
  document.getElementById("medicoes-pintura").hidden = !(servicosSelecionados.has("pintura") || servicosSelecionados.has("massa") || servicosSelecionados.has("textura") || servicosSelecionados.has("completo"));
  calcularMedidas();
}

["parede-comprimento", "parede-largura", "parede-altura", "parede-aberturas"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => { calcularMedidas(); salvarEstado(); });
});

["cliente-nome", "cliente-telefone", "cliente-endereco", "cliente-obs", "orcamento-data", "orcamento-validade", "orcamento-responsavel", "parede-nome"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", salvarEstado);
  if (el && el.tagName === "SELECT") el.addEventListener("change", salvarEstado);
});

["preco-pintura-mo", "preco-pintura-mat", "preco-massa-mo", "preco-massa-mat", "preco-textura-mo", "preco-textura-mat"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", salvarEstado);
});

document.getElementById("usar-padrao").addEventListener("change", () => { togglePadrao(); salvarEstado(); });
document.getElementById("desconto-percent").addEventListener("input", () => { atualizarResumo(); salvarEstado(); });
document.getElementById("desconto-reais").addEventListener("input", () => { atualizarResumo(); salvarEstado(); });
document.getElementById("mostrar-dados").addEventListener("change", salvarEstado);

document.getElementById("tarefa-nome").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    adicionarTarefa();
  }
});

function togglePadrao() {
  const usar = document.getElementById("usar-padrao").checked;
  document.getElementById("precos-padrao").style.opacity = usar ? "1" : "0.5";
  document.getElementById("precos-padrao").style.pointerEvents = usar ? "auto" : "none";
}

function adicionarTarefa() {
  const input = document.getElementById("tarefa-nome");
  const nome = input.value.trim();
  if (!nome) {
    input.focus();
    return;
  }
  tarefas.push({ id: Date.now(), nome: nome, incluir: true });
  input.value = "";
  renderizarTarefas();
  salvarEstado();
  input.focus();
}

function renderizarTarefas() {
  const lista = document.getElementById("lista-tarefas");
  lista.innerHTML = "";
  if (tarefas.length === 0) {
    const vazio = document.createElement("div");
    vazio.style.color = "var(--text-tertiary)";
    vazio.style.padding = "10px 0";
    vazio.textContent = "Nenhuma tarefa adicionada. Adicione pelo menos uma para gerar o orçamento.";
    lista.appendChild(vazio);
    return;
  }
  tarefas.forEach((t, idx) => {
    const card = document.createElement("div");
    card.className = "toggle-card";
    card.innerHTML = `
      <div class="toggle-info">
        <span class="toggle-title">${escapeHtml(t.nome)}</span>
        <span class="toggle-sub">Incluir no orçamento</span>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <label class="switch">
          <input class="switch-input" type="checkbox" ${t.incluir ? "checked" : ""} onchange="alternarTarefa(${idx}, this.checked)">
          <span class="switch-track"></span>
        </label>
        <button class="btn btn-ghost" style="padding:10px 16px;" onclick="removerTarefa(${idx})">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    `;
    lista.appendChild(card);
  });
}

function alternarTarefa(idx, valor) {
  tarefas[idx].incluir = valor;
  salvarEstado();
}

function removerTarefa(idx) {
  tarefas.splice(idx, 1);
  renderizarTarefas();
  salvarEstado();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function calcularMedidas() {
  const comp = parseFloat(document.getElementById("parede-comprimento").value) || 0;
  const larg = parseFloat(document.getElementById("parede-largura").value) || 0;
  const alt = parseFloat(document.getElementById("parede-altura").value) || 0;
  const abert = parseFloat(document.getElementById("parede-aberturas").value) || 0;
  if (comp > 0 && larg > 0 && alt > 0) {
    const areaBruta = (comp * 2 + larg * 2) * alt;
    const areaLiquida = Math.max(0, areaBruta - abert);
    document.getElementById("parede-area").value = areaLiquida.toFixed(2) + " m²";
  } else {
    document.getElementById("parede-area").value = "";
  }
}

function gerarOrcamentoAutomatico() {
  const nomeCli = document.getElementById("cliente-nome").value.trim();
  if (!nomeCli) {
    alert("Informe o nome do cliente na etapa 1.");
    irPara(1);
    return;
  }
  const tarefasAtivas = tarefas.filter(t => t.incluir);
  if (tarefasAtivas.length === 0) {
    alert("Adicione pelo menos uma tarefa na etapa 3.");
    irPara(3);
    return;
  }
  const comp = parseFloat(document.getElementById("parede-comprimento").value) || 0;
  const larg = parseFloat(document.getElementById("parede-largura").value) || 0;
  const alt = parseFloat(document.getElementById("parede-altura").value) || 0;
  const abert = parseFloat(document.getElementById("parede-aberturas").value) || 0;
  if (comp <= 0 || larg <= 0 || alt <= 0) {
    alert("Informe as medidas corretas na etapa 4.");
    irPara(4);
    return;
  }
  const areaBruta = (comp * 2 + larg * 2) * alt;
  const areaLiquida = Math.max(0, areaBruta - abert);
  if (areaLiquida <= 0) {
    alert("Área líquida inválida.");
    return;
  }

  const usarPadrao = document.getElementById("usar-padrao").checked;
  let pPintMo = usarPadrao ? parseFloat(document.getElementById("preco-pintura-mo").value) || 0 : 0;
  let pPintMat = usarPadrao ? parseFloat(document.getElementById("preco-pintura-mat").value) || 0 : 0;
  let pMassaMo = usarPadrao ? parseFloat(document.getElementById("preco-massa-mo").value) || 0 : 0;
  let pMassaMat = usarPadrao ? parseFloat(document.getElementById("preco-massa-mat").value) || 0 : 0;
  let pTextMo = usarPadrao ? parseFloat(document.getElementById("preco-textura-mo").value) || 0 : 0;
  let pTextMat = usarPadrao ? parseFloat(document.getElementById("preco-textura-mat").value) || 0 : 0;

  itensOrcamento.length = 0;
  const ambiente = document.getElementById("parede-nome").value.trim() || "Paredes e Tetos";

  if (servicosSelecionados.has("massa") || servicosSelecionados.has("completo")) {
    const mo = areaLiquida * pMassaMo;
    const mat = areaLiquida * pMassaMat;
    itensOrcamento.push({
      id: Date.now() + 1,
      titulo: "Massa Corrida",
      subtitulo: ambiente + " - Preparação e acabamento",
      area: areaLiquida,
      precoMo: pMassaMo,
      precoMat: pMassaMat,
      mo: mo,
      mat: mat,
      total: mo + mat
    });
  }
  if (servicosSelecionados.has("pintura") || servicosSelecionados.has("completo")) {
    const mo = areaLiquida * pPintMo;
    const mat = areaLiquida * pPintMat;
    itensOrcamento.push({
      id: Date.now() + 2,
      titulo: "Pintura",
      subtitulo: ambiente + " - " + (document.getElementById("orcamento-responsavel").value || "Rafael Nunes"),
      area: areaLiquida,
      precoMo: pPintMo,
      precoMat: pPintMat,
      mo: mo,
      mat: mat,
      total: mo + mat
    });
  }
  if (servicosSelecionados.has("textura")) {
    const mo = areaLiquida * pTextMo;
    const mat = areaLiquida * pTextMat;
    itensOrcamento.push({
      id: Date.now() + 3,
      titulo: "Textura / Grafiato",
      subtitulo: ambiente + " - Acabamento decorativo",
      area: areaLiquida,
      precoMo: pTextMo,
      precoMat: pTextMat,
      mo: mo,
      mat: mat,
      total: mo + mat
    });
  }

  if (itensOrcamento.length === 0) {
    alert("Selecione pelo menos um serviço na etapa 2.");
    irPara(2);
    return;
  }

  renderizarItens();
  atualizarResumo();
  document.getElementById("btn-revisar").hidden = false;
  irPara(5);
  toast("Orçamento gerado");
}

function renderizarItens() {
  const lista = document.getElementById("lista-itens");
  lista.innerHTML = "";
  itensOrcamento.forEach((item, idx) => {
    const card = document.createElement("article");
    card.className = "item-card";
    card.innerHTML = `
      <header class="item-header">
        <div class="item-info">
          <span class="item-title">${escapeHtml(item.titulo)}</span>
          <span class="item-sub">${escapeHtml(item.subtitulo)} • ${item.area.toFixed(2)} m²</span>
        </div>
        <div class="item-total">
          <span class="item-total-label">Total do item</span>
          <span class="item-total-value">${money.format(item.total)}</span>
        </div>
      </header>
      <div class="item-grid">
        <div class="item-field half">
          <label class="label">Mão de obra (R$/m²)</label>
          <input class="input" type="number" step="0.01" value="${item.precoMo}" onchange="editarItem(${idx}, 'precoMo', this.value)">
        </div>
        <div class="item-field half">
          <label class="label">Materiais (R$/m²)</label>
          <input class="input" type="number" step="0.01" value="${item.precoMat}" onchange="editarItem(${idx}, 'precoMat', this.value)">
        </div>
      </div>
    `;
    lista.appendChild(card);
  });
}

function editarItem(idx, campo, valor) {
  const v = parseFloat(valor) || 0;
  itensOrcamento[idx][campo] = v;
  const item = itensOrcamento[idx];
  item.mo = item.area * item.precoMo;
  item.mat = item.area * item.precoMat;
  item.total = item.mo + item.mat;
  renderizarItens();
  atualizarResumo();
  salvarEstado();
}

function atualizarResumo() {
  let mo = 0, mat = 0;
  itensOrcamento.forEach(i => { mo += i.mo; mat += i.mat; });
  const sub = mo + mat;
  let descPct = parseFloat(document.getElementById("desconto-percent").value) || 0;
  let descReais = parseFloat(document.getElementById("desconto-reais").value) || 0;
  if (descReais > 0) {
    document.getElementById("desconto-percent").value = 0;
  } else if (descPct > 0) {
    descReais = (sub * descPct) / 100;
    document.getElementById("desconto-reais").value = descReais.toFixed(2);
  }
  if (descReais > sub) descReais = sub;
  const total = sub - descReais;
  document.getElementById("sum-mo").textContent = money.format(mo);
  document.getElementById("sum-mat").textContent = money.format(mat);
  document.getElementById("sum-sub").textContent = money.format(sub);
  document.getElementById("sum-desc").textContent = "- " + money.format(descReais);
  document.getElementById("sum-total").textContent = money.format(total);
  document.getElementById("header-total").textContent = money.format(total);
  document.getElementById("bottom-total").textContent = money.format(total);
}

function enviarWhatsApp() {
  const nome = document.getElementById("cliente-nome").value.trim();
  if (!nome) {
    alert("Informe o nome do cliente.");
    irPara(1);
    return;
  }
  if (itensOrcamento.length === 0) {
    alert("Gere o orçamento primeiro.");
    irPara(4);
    return;
  }
  let tel = document.getElementById("cliente-telefone").value.replace(/\D/g, "");
  if (tel && !tel.startsWith("55")) tel = "55" + tel;
  const mostrar = document.getElementById("mostrar-dados").checked;
  const data = document.getElementById("orcamento-data").value;
  const validade = document.getElementById("orcamento-validade").value;
  const endereco = document.getElementById("cliente-endereco").value.trim();
  const obs = document.getElementById("cliente-obs").value.trim();
  let mo = 0, mat = 0;
  itensOrcamento.forEach(i => { mo += i.mo; mat += i.mat; });
  const sub = mo + mat;
  let descReais = parseFloat(document.getElementById("desconto-reais").value) || 0;
  if (descReais > sub) descReais = sub;
  const total = sub - descReais;
  let msg = `*ORÇAMENTO - Rafael Nunes | Pintura e Acabamentos*\n\n`;
  if (mostrar) {
    msg += `*Cliente:* ${nome}\n`;
    if (document.getElementById("cliente-telefone").value) msg += `*Telefone:* ${document.getElementById("cliente-telefone").value}\n`;
    if (endereco) msg += `*Endereço da obra:* ${endereco}\n`;
    if (data) msg += `*Data:* ${new Date(data + "T00:00:00").toLocaleDateString("pt-BR")}\n`;
    msg += `*Validade:* ${validade} dias\n\n`;
  }
  msg += `*ITENS:*\n`;
  itensOrcamento.forEach((it, idx) => {
    msg += `\n${idx + 1}. ${it.titulo} - ${it.area.toFixed(2)} m²\n`;
    msg += `   Mão de obra: ${money.format(it.mo)} (${it.precoMo.toFixed(2)}/m²)\n`;
    msg += `   Materiais: ${money.format(it.mat)} (${it.precoMat.toFixed(2)}/m²)\n`;
    msg += `   *Subtotal:* ${money.format(it.total)}\n`;
  });
  msg += `\n*RESUMO:*\n`;
  msg += `Mão de obra: ${money.format(mo)}\n`;
  msg += `Materiais: ${money.format(mat)}\n`;
  msg += `Subtotal: ${money.format(sub)}\n`;
  if (descReais > 0) msg += `Desconto: - ${money.format(descReais)}\n`;
  msg += `*TOTAL: ${money.format(total)}*\n`;
  if (obs) msg += `\n*Observações:* ${obs}\n`;
  msg += `\n_Aguardamos sua aprovação._`;
  const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

function gerarPDF() {
  window.print();
}

function novoOrcamento() {
  if (!confirm("Criar novo orçamento? Os dados atuais serão limpos.")) return;
  localStorage.removeItem("rafaelnunes_orcamento");
  servicosSelecionados.clear();
  itensOrcamento.length = 0;
  tarefas.length = 0;
  document.querySelectorAll(".service-card").forEach(c => c.classList.remove("active"));
  document.getElementById("cliente-nome").value = "";
  document.getElementById("cliente-telefone").value = "";
  document.getElementById("cliente-endereco").value = "";
  document.getElementById("cliente-obs").value = "";
  document.getElementById("orcamento-data").value = new Date().toISOString().slice(0, 10);
  document.getElementById("orcamento-validade").value = "7";
  document.getElementById("orcamento-responsavel").value = "Rafael Nunes";
  document.getElementById("parede-nome").value = "";
  document.getElementById("parede-comprimento").value = "";
  document.getElementById("parede-largura").value = "";
  document.getElementById("parede-altura").value = "2.70";
  document.getElementById("parede-aberturas").value = "0";
  document.getElementById("parede-area").value = "";
  document.getElementById("usar-padrao").checked = true;
  togglePadrao();
  document.getElementById("preco-pintura-mo").value = "18";
  document.getElementById("preco-pintura-mat").value = "16";
  document.getElementById("preco-massa-mo").value = "16";
  document.getElementById("preco-massa-mat").value = "12";
  document.getElementById("preco-textura-mo").value = "25";
  document.getElementById("preco-textura-mat").value = "22";
  document.getElementById("tarefa-nome").value = "";
  renderizarTarefas();
  document.getElementById("lista-itens").innerHTML = "";
  document.getElementById("desconto-percent").value = "0";
  document.getElementById("desconto-reais").value = "0";
  document.getElementById("mostrar-dados").checked = true;
  document.getElementById("sum-mo").textContent = money.format(0);
  document.getElementById("sum-mat").textContent = money.format(0);
  document.getElementById("sum-sub").textContent = money.format(0);
  document.getElementById("sum-desc").textContent = "- " + money.format(0);
  document.getElementById("sum-total").textContent = money.format(0);
  document.getElementById("header-total").textContent = money.format(0);
  document.getElementById("bottom-total").textContent = money.format(0);
  document.getElementById("btn-revisar").hidden = true;
  atualizarMedicoes();
  irPara(1);
  toast("Novo orçamento iniciado");
}

window.irPara = irPara;
window.toggleServico = toggleServico;
window.adicionarTarefa = adicionarTarefa;
window.alternarTarefa = alternarTarefa;
window.removerTarefa = removerTarefa;
window.gerarOrcamentoAutomatico = gerarOrcamentoAutomatico;
window.editarItem = editarItem;
window.atualizarResumo = atualizarResumo;
window.enviarWhatsApp = enviarWhatsApp;
window.gerarPDF = gerarPDF;
window.novoOrcamento = novoOrcamento;
window.togglePadrao = togglePadrao;

togglePadrao();
renderizarTarefas();
atualizarMedicoes();
