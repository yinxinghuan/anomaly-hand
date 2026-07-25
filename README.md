# Anomaly Hand / 异常手牌

## Third-party attribution

Tactical-card holographic finish adapts [CSS Holographic Masks](https://codepen.io/HejChristian/pen/YPzLbYX) by Christian Alder, under the MIT License. Full notice and local modifications: [`public/THIRD_PARTY_NOTICES.txt`](public/THIRD_PARTY_NOTICES.txt).

A portrait-driven endless mobile card battler. Read the enemy's next intent, play one of three tactical cards, build sequence, deploy each operative's signature order, and keep sealing the full rival roster until your health reaches zero.

Current release: `fac313f` (2026-07-21). The live game is available at [yinxinghuan.github.io/anomaly-hand](https://yinxinghuan.github.io/anomaly-hand/).

Project records:

- [Current project status](doc/project-status.md)
- [Game requirements](doc/requirements.md)
- [Visual system](doc/visual.md)
- [Screen/state contract](doc/screen-contract.md)
- [Technical map](doc/technical.md)
- [Visual QA log](doc/visual-qa.md)

## Development

```bash
npm install
npm run dev
npm run build
```

The production build uses portable relative asset paths and is emitted to `dist/`.
