# Vincent Visual Engines 🚀

> Coleção de **motores visuais interativos 3D** desenvolvidos pela [Vincent AI Studios](https://github.com/vincentaistudios).  
> Cada engine é um componente React autônomo com WebGL, Three.js e GLSL Shaders customizados, rodando a **60fps estáveis**.

---

## 📦 Engines Incluídos

| Engine | Stack | Demo |
|---|---|---|
| [🌌 Cosmic Halo 3D WebGL](#-cosmic-halo-3d-webgl) | Three.js, GLSL, React | 2.000 partículas orbitais |
| [🔧 Dr. Auto Parts Brake Sim](#-dr-auto-parts-brake-sim) | Three.js, PBR, React | Freio a disco com física térmica |
| [💸 Vincent MP Pix Gateway](#-vincent-mp-pix-gateway) | Three.js, React, Node.js | Portal de pagamento Pix 3D |
| [📋 Aurora Technical Logger](#-aurora-technical-logger) | TypeScript, Winston, Node.js | Logger de auditoria em tempo real |

---

## 🚀 Início Rápido

```bash
git clone https://github.com/vincentaistudios/vincent-visual-engines.git
cd vincent-visual-engines
npm install
npm run dev
```

Acesse `http://localhost:5173` para ver todos os engines em ação.

---

## 🌌 Cosmic Halo 3D WebGL
> `engines/cosmic-halo/CosmicHalo.jsx`

Simulação de nebulosa orbital com:
- **2.000 partículas volumétricas** em toro 3D
- **GLSL Vertex Shader** com ondas fluidas por mouse
- **Núcleo de estrela** com glow Fresnel em tempo real
- Interação gravitacional: mova o mouse sobre a nebulosa

<p align="center">
  <video src="./docs/images/cosmic-halo.mp4" width="80%" autoplay loop muted playsinline></video>
</p>

---

## 🔧 Dr. Auto Parts Brake Sim
> `engines/dr-autoparts/ThreeEngineVisual.jsx`

Simulação física de freio a disco de alta performance:
- **Rotor ventilado duplo** com 36 aletas radiais de refrigeração
- **Pinça de 6 pistões** em laranja lacado com logotipo em canvas
- **Física térmica**: aquecimento até 720°C com glow incandescente
- **HUD de telemetria**: RPM, PSI, temperatura e status em tempo real
- Clique no canvas para acionar a frenagem hidráulica

<p align="center">
  <video src="./docs/images/disc-pbr.mp4" width="80%" autoplay loop muted playsinline></video>
</p>

---

## 💸 Vincent MP Pix Gateway
> `engines/pix-gateway/PixVisual.jsx`

Portal 3D de pagamentos via Pix com:
- **Logo Pix 3D** com materiais cromados e neon
- **Partículas de fluxo** orbital simulando transações
- **Explosão de partículas** ao simular um pagamento
- **HUD de telemetria** com histórico de liquidações e latência da API
- Dados fictícios — apenas demonstração visual

<p align="center">
  <video src="./docs/images/pix-gateway.mp4" width="70%" autoplay loop muted playsinline></video>
</p>

---

## 📋 Aurora Technical Logger
> `engines/aurora-logger/auroraLogger.ts`

Biblioteca de logs técnicos de alta performance:
- Formato de log personalizado com timestamp e nível
- Saída simultânea para Console e arquivo `aurora-engine.log`
- Integração com **Winston** para microsserviços Node.js
- Pronto para uso em produção

---

## 🏗️ Estrutura do Repositório

```
vincent-visual-engines/
├── engines/
│   ├── cosmic-halo/
│   │   └── CosmicHalo.jsx          # Nebulosa orbital WebGL
│   ├── dr-autoparts/
│   │   └── ThreeEngineVisual.jsx   # Freio a disco 3D com física
│   ├── pix-gateway/
│   │   └── PixVisual.jsx           # Portal Pix 3D
│   └── aurora-logger/
│       └── auroraLogger.ts         # Logger TypeScript
├── src/
│   ├── App.jsx                     # Demo com todos os engines
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```

---

## 🛠️ Stack

- **Three.js** — renderização WebGL 3D
- **React 19** — gerenciamento de lifecycle e refs
- **GLSL** — vertex e fragment shaders customizados
- **Vite** — build e dev server ultrarrápido
- **TypeScript** — para o Aurora Logger
- **Winston** — logger de produção

---

## 📄 Licença

MIT © [Vincent AI Studios](https://github.com/vincentaistudios)
