# Design System — Escala Internato FMUSP

Identidade visual inspirada na tradição da Faculdade de Medicina da USP ("Casa de Arnaldo"). Verde médico como cor principal, estética moderna, limpa e institucional.

---

## Brand Personality

| Atributo | Descrição |
|---|---|
| Excelência acadêmica | Padrão visual compatível com a reputação da FMUSP |
| Organização | Hierarquia clara, sem ruído visual |
| Confiabilidade | Consistência de componentes e comportamentos |
| Profissionalismo | Próximo a prontuários e sistemas clínicos modernos |
| Humanização | Não parece um sistema corporativo genérico |

**Referências visuais:** FMUSP · Casa de Arnaldo · Hospital das Clínicas · Linear · Notion · Stripe Dashboard

---

## Paleta de Cores

### Cores Primárias

| Token | HEX | Uso |
|---|---|---|
| `green-primary` | `#0F6B45` | Logo, CTA principal, navegação ativa, destaques |
| `green-dark` | `#0A5235` | Hover de botões primários |
| `green-light` | `#E8F5EE` | Backgrounds de destaque, chips, badges |

### Cores Secundárias

| Token | HEX | Uso |
|---|---|---|
| `gold` | `#B6922E` | Métricas, selos, indicadores especiais |
| `gold-light` | `#FAF3DD` | Background de elementos com dourado |

### Neutros

| Token | HEX |
|---|---|
| `gray-50` | `#FAFAFA` |
| `gray-100` | `#F4F4F5` |
| `gray-200` | `#E4E4E7` |
| `gray-300` | `#D4D4D8` |
| `gray-400` | `#A1A1AA` |
| `gray-500` | `#71717A` |
| `gray-600` | `#52525B` |
| `gray-700` | `#3F3F46` |
| `gray-800` | `#27272A` |
| `gray-900` | `#18181B` |

### Cores Semânticas

| Estado | Cor | Background |
|---|---|---|
| Success | `#16A34A` | `#DCFCE7` |
| Warning | `#D97706` | `#FEF3C7` |
| Error | `#DC2626` | `#FEE2E2` |

---

## Preferências de Escala

Esses estados são o núcleo do produto — cada interno declara disponibilidade por turno.

| Estado | Cor | Background | Ícone |
|---|---|---|---|
| **Quero** | `#16A34A` | `#DCFCE7` | Heart |
| **Posso** | `#D97706` | `#FEF3C7` | Circle |
| **Impossível** | `#DC2626` | `#FEE2E2` | X |
| **Bloqueado** | `gray-400` | `gray-100` | Lock |

---

## Tipografia

**Fonte principal:** Inter  
**Fallback:** system-ui, -apple-system, sans-serif

| Variante | Tamanho | Peso |
|---|---|---|
| Display | 48px | 700 |
| H1 | 36px | 700 |
| H2 | 30px | 600 |
| H3 | 24px | 600 |
| Body | 16px | 400 |
| Small | 14px | 400 |
| Caption | 12px | 400 |

---

## Espaçamento e Forma

### Border Radius

| Token | Valor |
|---|---|
| `radius-sm` | 8px |
| `radius-md` | 12px |
| `radius-lg` | 16px |
| `radius-xl` | 24px |

### Sombras

Apenas sombras sutis. Sem elevação exagerada.

```
shadow-sm: 0 1px 2px rgba(0,0,0,0.05)
shadow-md: 0 4px 6px rgba(0,0,0,0.07)
shadow-lg: 0 10px 15px rgba(0,0,0,0.08)
```

---

## Componentes

### Cards

```
background: white
border: 1px solid gray-200
border-radius: radius-lg (16px)
shadow: shadow-sm
padding: 20–24px
```

### Botões

| Variante | Estilo |
|---|---|
| Primary | Background `green-primary`, texto branco |
| Secondary | Background branco, borda `gray-200` |
| Ghost | Transparente, texto `gray-700` |
| Destructive | Background `error`, texto branco |

Altura padrão: **40px** (sm: 36px, lg: 48px)

### Inputs

```
height: 44px
border: 1px solid gray-300
border-radius: radius-sm (8px)
focus-ring: green-primary
placeholder: gray-400
```

---

## Calendário

Visual inspirado em calendário acadêmico moderno.

**Turnos:** Manhã · Tarde · Noite

Cada célula deve suportar os estados:
- Vazio (disponível para preenchimento)
- Quero
- Posso
- Impossível
- Bloqueado pelo preceptor

---

## Dashboard

**Usar:**
- Heatmaps de distribuição de turnos
- Barras horizontais para carga horária
- Tabelas de carga por interno/período
- Métricas de satisfação com badge colorido

**Evitar:**
- Gráficos de pizza
- Elementos 3D
- Gradientes exagerados
- Animações chamativas

---

## Motion

| Duração | Uso |
|---|---|
| 150ms | Micro-interações (hover, focus) |
| 200ms | Transições de estado de componente |
| 300ms | Animações de entrada/saída de painéis |

**Easing:** `ease-out` em todos os casos.

O produto deve parecer uma **ferramenta acadêmica premium e institucional** — não um app consumer.
