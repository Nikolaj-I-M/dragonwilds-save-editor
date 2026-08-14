#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🐉 Editor de Savegame — RuneScape: Dragonwilds
==============================================

Editor gráfico (tkinter, apenas biblioteca padrão) para o save de
personagem (.json) do Dragonwilds.

Funcionalidades:
  • Abrir/salvar o arquivo de save com backup automático (.bak)
  • Visualizar todos os slots por seção (barra de ações, mochila,
    runas, missão e especiais)
  • Selecionar um slot e adicionar qualquer item do catálogo (pt-BR)
  • Definir a quantidade (respeitando o stack máximo do item)
  • Esvaziar slots

Requisitos:
  • Python 3.9+
  • Arquivo `catalogo_itens.json` na mesma pasta deste script

Uso:
  python editor_dragonwilds.py
"""

from __future__ import annotations

import base64
import json
import os
import shutil
import tkinter as tk
from dataclasses import dataclass
from pathlib import Path
from tkinter import filedialog, messagebox, ttk
from typing import Optional

# --------------------------------------------------------------------------
# Constantes
# --------------------------------------------------------------------------

TITULO_APP = "🐉 Editor de Save — RuneScape: Dragonwilds"
ARQUIVO_CATALOGO = "catalogo_itens.json"

#: Seções do inventário: (nome exibido, slot inicial, slot final, colunas)
SECOES = (
    ("⚡ Barra de Ações", 0, 7, 8),
    ("🎒 Mochila", 8, 31, 8),
    ("✨ Runas", 32, 55, 8),
    ("📜 Missão", 56, 79, 8),
    ("💠 Especiais", 80, 82, 3),
)

COR_SLOT_VAZIO = "#3a3f4b"
COR_SLOT_CHEIO = "#4b6043"
COR_SLOT_SELECIONADO = "#c9a227"
COR_FUNDO = "#282c34"
COR_TEXTO = "#e6e6e6"


# --------------------------------------------------------------------------
# Modelo de dados
# --------------------------------------------------------------------------

@dataclass(frozen=True)
class ItemCatalogo:
    """Um item conhecido do jogo, vindo do catálogo."""

    id: str
    nome_ptbr: str
    nome_en: str
    categoria: str
    emoji: str
    max_stack: int
    durabilidade: Optional[int]

    @property
    def rotulo(self) -> str:
        """Texto exibido nas listas: emoji + nome traduzido."""
        return f"{self.emoji} {self.nome_ptbr}"


def gerar_guid() -> str:
    """Gera um GUID de instância no formato do jogo (base64url, 22 chars)."""
    return base64.urlsafe_b64encode(os.urandom(16)).decode().rstrip("=")


# --------------------------------------------------------------------------
# Catálogo
# --------------------------------------------------------------------------

class Catalogo:
    """Carrega e indexa o catálogo de itens (id -> item, busca por nome)."""

    def __init__(self, caminho: Path) -> None:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
        self.itens: list[ItemCatalogo] = [
            ItemCatalogo(
                id=d["id"],
                nome_ptbr=d["nome_ptbr"],
                nome_en=d["nome_en"],
                categoria=d["categoria"],
                emoji=d["emoji"],
                max_stack=int(d.get("max_stack") or 1),
                durabilidade=d.get("durabilidade"),
            )
            for d in dados
        ]
        self.itens.sort(key=lambda i: (i.categoria, i.nome_ptbr))
        self.por_id: dict[str, ItemCatalogo] = {i.id: i for i in self.itens}

    def buscar(self, texto: str) -> list[ItemCatalogo]:
        """Filtra itens cujo nome (pt-BR ou EN) ou categoria contém o texto."""
        t = texto.strip().lower()
        if not t:
            return self.itens
        return [
            i for i in self.itens
            if t in i.nome_ptbr.lower()
            or t in i.nome_en.lower()
            or t in i.categoria.lower()
        ]


# --------------------------------------------------------------------------
# Gerenciador do arquivo de save
# --------------------------------------------------------------------------

class GerenciadorSave:
    """Abstrai leitura, escrita e edição do JSON de save do personagem."""

    def __init__(self) -> None:
        self.caminho: Optional[Path] = None
        self._dados: Optional[dict] = None

    # ---- E/S -------------------------------------------------------------

    def abrir(self, caminho: Path) -> None:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
        if "GameProgress" not in dados or "Inventory" not in dados["GameProgress"]:
            raise ValueError("O arquivo não parece ser um save de personagem válido.")
        self.caminho = caminho
        self._dados = dados

    def salvar(self) -> Path:
        """Salva com backup automático (.bak) e retorna o caminho do backup."""
        assert self.caminho and self._dados
        backup = self.caminho.with_suffix(self.caminho.suffix + ".bak")
        if self.caminho.exists():
            shutil.copy2(self.caminho, backup)
        texto = json.dumps(self._dados, indent="\t", ensure_ascii=False)
        self.caminho.write_text(texto, encoding="utf-8", newline="\r\n")
        return backup

    # ---- Inventário --------------------------------------------------------

    @property
    def carregado(self) -> bool:
        return self._dados is not None

    @property
    def _inventario(self) -> dict:
        assert self._dados is not None
        return self._dados["GameProgress"]["Inventory"]

    @property
    def nome_personagem(self) -> str:
        assert self._dados is not None
        return self._dados.get("meta_data", {}).get("char_name", "?")

    def item_no_slot(self, slot: int) -> Optional[dict]:
        return self._inventario.get(str(slot))

    def definir_item(self, slot: int, item: ItemCatalogo, quantidade: int) -> None:
        """Coloca `quantidade` de `item` no slot (substitui o conteúdo)."""
        entrada: dict = {"GUID": gerar_guid(), "ItemData": item.id}
        if item.max_stack > 1:
            entrada["Count"] = quantidade
        elif item.durabilidade:
            entrada["Durability"] = item.durabilidade
        self._inventario[str(slot)] = entrada
        maximo = self._inventario.get("MaxSlotIndex", -1)
        if slot > maximo:
            self._inventario["MaxSlotIndex"] = slot

    def esvaziar_slot(self, slot: int) -> None:
        self._inventario.pop(str(slot), None)

    # ---- Personagem (vida/estamina) ----------------------------------------

    def _atributo(self, nome: str) -> dict:
        assert self._dados is not None
        personagem = self._dados["GameProgress"].setdefault("Character", {})
        return personagem.setdefault(nome, {"CurrentValue": 0})

    def obter_vida(self) -> float:
        return self._atributo("Health").get("CurrentValue", 0)

    def obter_estamina(self) -> float:
        return self._atributo("Stamina").get("CurrentValue", 0)

    def definir_vida(self, valor: float) -> None:
        self._atributo("Health")["CurrentValue"] = max(1, valor)

    def definir_estamina(self, valor: float) -> None:
        self._atributo("Stamina")["CurrentValue"] = max(0, valor)


# --------------------------------------------------------------------------
# Interface gráfica
# --------------------------------------------------------------------------

class EditorApp(tk.Tk):
    """Janela principal do editor."""

    def __init__(self, catalogo: Catalogo) -> None:
        super().__init__()
        self.title(TITULO_APP)
        self.geometry("1080x680")
        self.configure(bg=COR_FUNDO)

        self.catalogo = catalogo
        self.save = GerenciadorSave()
        self.slot_selecionado: Optional[int] = None
        self.botoes_slot: dict[int, tk.Button] = {}
        self.itens_filtrados: list[ItemCatalogo] = []

        self._montar_topo()
        self._montar_corpo()
        self._atualizar_lista_itens()

    # ---- Construção da UI --------------------------------------------------

    def _montar_topo(self) -> None:
        topo = tk.Frame(self, bg=COR_FUNDO)
        topo.pack(fill="x", padx=10, pady=8)

        tk.Button(topo, text="📂 Abrir Save", command=self._acao_abrir).pack(side="left")
        tk.Button(topo, text="💾 Salvar", command=self._acao_salvar).pack(side="left", padx=6)

        self.lbl_status = tk.Label(
            topo, text="Nenhum save aberto.", bg=COR_FUNDO, fg=COR_TEXTO
        )
        self.lbl_status.pack(side="left", padx=12)

    def _montar_corpo(self) -> None:
        corpo = tk.Frame(self, bg=COR_FUNDO)
        corpo.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        self._montar_painel_slots(corpo)
        self._montar_painel_itens(corpo)

    def _montar_painel_slots(self, pai: tk.Frame) -> None:
        painel = tk.Frame(pai, bg=COR_FUNDO)
        painel.pack(side="left", fill="both", expand=True)

        for nome, ini, fim, colunas in SECOES:
            quadro = tk.LabelFrame(
                painel, text=nome, bg=COR_FUNDO, fg=COR_TEXTO, labelanchor="nw"
            )
            quadro.pack(fill="x", pady=4)
            for indice, slot in enumerate(range(ini, fim + 1)):
                botao = tk.Button(
                    quadro,
                    text=f"{slot}\n—",
                    width=9,
                    height=2,
                    bg=COR_SLOT_VAZIO,
                    fg=COR_TEXTO,
                    relief="flat",
                    command=lambda s=slot: self._selecionar_slot(s),
                )
                botao.grid(row=indice // colunas, column=indice % colunas, padx=2, pady=2)
                self.botoes_slot[slot] = botao

    def _montar_painel_itens(self, pai: tk.Frame) -> None:
        painel = tk.Frame(pai, bg=COR_FUNDO)
        painel.pack(side="right", fill="y", padx=(10, 0))

        self.lbl_slot = tk.Label(
            painel, text="Selecione um slot ⬅️", bg=COR_FUNDO, fg=COR_SLOT_SELECIONADO,
            font=("TkDefaultFont", 11, "bold"), wraplength=280, justify="left",
        )
        self.lbl_slot.pack(anchor="w", pady=(0, 8))

        tk.Label(painel, text="🔎 Buscar item:", bg=COR_FUNDO, fg=COR_TEXTO).pack(anchor="w")
        self.var_busca = tk.StringVar()
        self.var_busca.trace_add("write", lambda *_: self._atualizar_lista_itens())
        ttk.Entry(painel, textvariable=self.var_busca, width=40).pack(anchor="w", pady=2)

        self.lista_itens = tk.Listbox(
            painel, width=42, height=20, bg="#1f2229", fg=COR_TEXTO,
            selectbackground=COR_SLOT_SELECIONADO,
        )
        self.lista_itens.pack(pady=4)
        self.lista_itens.bind("<<ListboxSelect>>", lambda _e: self._ao_escolher_item())

        linha_qtd = tk.Frame(painel, bg=COR_FUNDO)
        linha_qtd.pack(anchor="w", pady=4)
        tk.Label(linha_qtd, text="🔢 Quantidade:", bg=COR_FUNDO, fg=COR_TEXTO).pack(side="left")
        self.var_qtd = tk.IntVar(value=1)
        self.spin_qtd = ttk.Spinbox(linha_qtd, from_=1, to=99, width=6, textvariable=self.var_qtd)
        self.spin_qtd.pack(side="left", padx=6)
        self.lbl_stack = tk.Label(linha_qtd, text="", bg=COR_FUNDO, fg="#9aa0ac")
        self.lbl_stack.pack(side="left")

        tk.Button(
            painel, text="➕ Adicionar ao slot", command=self._acao_adicionar
        ).pack(fill="x", pady=(8, 2))
        tk.Button(
            painel, text="🗑️ Esvaziar slot", command=self._acao_esvaziar
        ).pack(fill="x")

        self._montar_painel_personagem(painel)

    def _montar_painel_personagem(self, pai: tk.Frame) -> None:
        """Painel de atributos do personagem (vida e estamina atuais)."""
        quadro = tk.LabelFrame(
            pai, text="❤️ Personagem", bg=COR_FUNDO, fg=COR_TEXTO, labelanchor="nw"
        )
        quadro.pack(fill="x", pady=(12, 0))

        self.var_vida = tk.DoubleVar(value=0)
        self.var_estamina = tk.DoubleVar(value=0)

        for rotulo, variavel in (
            ("❤️ Vida atual:", self.var_vida),
            ("⚡ Estamina atual:", self.var_estamina),
        ):
            linha = tk.Frame(quadro, bg=COR_FUNDO)
            linha.pack(anchor="w", pady=2, padx=4)
            tk.Label(linha, text=rotulo, width=16, anchor="w",
                     bg=COR_FUNDO, fg=COR_TEXTO).pack(side="left")
            ttk.Spinbox(linha, from_=0, to=100000, width=8,
                        textvariable=variavel).pack(side="left")

        tk.Button(
            quadro, text="✅ Aplicar atributos", command=self._acao_aplicar_atributos
        ).pack(fill="x", padx=4, pady=(4, 6))
        tk.Label(
            quadro,
            text="ℹ️ Valores acima do máximo do personagem\nsão cortados pelo jogo ao carregar.",
            bg=COR_FUNDO, fg="#9aa0ac", justify="left",
        ).pack(anchor="w", padx=4, pady=(0, 4))

    def _acao_aplicar_atributos(self) -> None:
        if not self.save.carregado:
            messagebox.showwarning("Nada aberto", "Abra um save primeiro. 📂")
            return
        self.save.definir_vida(self.var_vida.get())
        self.save.definir_estamina(self.var_estamina.get())
        messagebox.showinfo(
            "Aplicado! ✅",
            "Vida e estamina atualizadas.\nLembre de clicar em 💾 Salvar para gravar no arquivo.",
        )

    # ---- Ações -------------------------------------------------------------

    def _acao_abrir(self) -> None:
        caminho = filedialog.askopenfilename(
            title="Abrir save de personagem",
            filetypes=[("Save JSON", "*.json"), ("Todos os arquivos", "*.*")],
        )
        if not caminho:
            return
        try:
            self.save.abrir(Path(caminho))
        except (json.JSONDecodeError, ValueError, OSError) as erro:
            messagebox.showerror("Erro ao abrir", f"Não foi possível abrir o save:\n{erro}")
            return
        self.lbl_status.config(
            text=f"👤 {self.save.nome_personagem}  •  {Path(caminho).name}"
        )
        self.var_vida.set(self.save.obter_vida())
        self.var_estamina.set(self.save.obter_estamina())
        self._redesenhar_slots()

    def _acao_salvar(self) -> None:
        if not self.save.carregado:
            messagebox.showwarning("Nada aberto", "Abra um save antes de salvar. 📂")
            return
        try:
            backup = self.save.salvar()
        except OSError as erro:
            messagebox.showerror("Erro ao salvar", str(erro))
            return
        messagebox.showinfo(
            "Salvo! 💾",
            f"Save gravado com sucesso.\nBackup criado em:\n{backup.name}\n\n"
            "⚠️ Substitua o arquivo apenas com o jogo fechado.",
        )

    def _acao_adicionar(self) -> None:
        if not self.save.carregado:
            messagebox.showwarning("Nada aberto", "Abra um save primeiro. 📂")
            return
        if self.slot_selecionado is None:
            messagebox.showwarning("Sem slot", "Selecione um slot no painel à esquerda. ⬅️")
            return
        item = self._item_escolhido()
        if item is None:
            messagebox.showwarning("Sem item", "Escolha um item na lista. 🔎")
            return
        quantidade = max(1, min(self.var_qtd.get(), item.max_stack))
        self.save.definir_item(self.slot_selecionado, item, quantidade)
        self._redesenhar_slots()
        self._selecionar_slot(self.slot_selecionado)

    def _acao_esvaziar(self) -> None:
        if not self.save.carregado or self.slot_selecionado is None:
            return
        self.save.esvaziar_slot(self.slot_selecionado)
        self._redesenhar_slots()
        self._selecionar_slot(self.slot_selecionado)

    # ---- Auxiliares de UI ----------------------------------------------------

    def _item_escolhido(self) -> Optional[ItemCatalogo]:
        selecao = self.lista_itens.curselection()
        if not selecao:
            return None
        return self.itens_filtrados[selecao[0]]

    def _ao_escolher_item(self) -> None:
        item = self._item_escolhido()
        if item is None:
            return
        self.spin_qtd.config(to=item.max_stack)
        self.var_qtd.set(item.max_stack)
        self.lbl_stack.config(text=f"(máx. {item.max_stack})")

    def _atualizar_lista_itens(self) -> None:
        self.itens_filtrados = self.catalogo.buscar(self.var_busca.get())
        self.lista_itens.delete(0, tk.END)
        for item in self.itens_filtrados:
            self.lista_itens.insert(tk.END, item.rotulo)

    def _selecionar_slot(self, slot: int) -> None:
        anterior = self.slot_selecionado
        self.slot_selecionado = slot
        if anterior is not None and anterior in self.botoes_slot:
            self._pintar_slot(anterior)
        self.botoes_slot[slot].config(bg=COR_SLOT_SELECIONADO, fg="#1f2229")
        self.lbl_slot.config(text=f"🎯 Slot {slot}: {self._descricao_slot(slot)}")

    def _descricao_slot(self, slot: int) -> str:
        entrada = self.save.item_no_slot(slot) if self.save.carregado else None
        if not entrada:
            return "vazio"
        item = self.catalogo.por_id.get(entrada.get("ItemData", ""))
        nome = item.rotulo if item else f"❓ {entrada.get('ItemData')}"
        if "Count" in entrada:
            return f"{nome} ×{entrada['Count']}"
        if "Durability" in entrada:
            return f"{nome} (durab. {entrada['Durability']})"
        return nome

    def _pintar_slot(self, slot: int) -> None:
        botao = self.botoes_slot[slot]
        entrada = self.save.item_no_slot(slot) if self.save.carregado else None
        if not entrada:
            botao.config(text=f"{slot}\n—", bg=COR_SLOT_VAZIO, fg=COR_TEXTO)
            return
        item = self.catalogo.por_id.get(entrada.get("ItemData", ""))
        emoji = item.emoji if item else "❓"
        nome = (item.nome_ptbr if item else "???")[:10]
        sufixo = f" ×{entrada['Count']}" if "Count" in entrada else ""
        botao.config(text=f"{emoji} {nome}{sufixo}", bg=COR_SLOT_CHEIO, fg=COR_TEXTO)

    def _redesenhar_slots(self) -> None:
        for slot in self.botoes_slot:
            self._pintar_slot(slot)


# --------------------------------------------------------------------------
# Ponto de entrada
# --------------------------------------------------------------------------

def main() -> None:
    caminho_catalogo = Path(__file__).with_name(ARQUIVO_CATALOGO)
    if not caminho_catalogo.exists():
        raise SystemExit(
            f"❌ Catálogo não encontrado: {caminho_catalogo}\n"
            f"Coloque o arquivo '{ARQUIVO_CATALOGO}' na mesma pasta deste script."
        )
    app = EditorApp(Catalogo(caminho_catalogo))
    app.mainloop()


if __name__ == "__main__":
    main()
