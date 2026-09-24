# nexum-omp

Nexum (Dialagram) provider extension for [omp](https://github.com/can1357/oh-my-pi).
Registers `nexum` as a first-class provider backed by the Dialagram router
(`https://dialagram.me/router/v1`, OpenAI-compatible wire).

## What you get

- **`/login nexum`** — paste an API key (`dgr_…`); it is validated against
  `/v1/models` and stored in omp's auth store. Run it once per key: every
  stored credential participates in omp's multi-account selection/rotation,
  so usage-limit hits rotate to a sibling key automatically.
- **`NEXUM_API_KEY`** env var as a key fallback.
- **Live model discovery** from `GET /v1/models` (24 h model cache;
  `omp models refresh` forces a re-fetch).

## Install

**Option A — user extensions directory (recommended):**

```sh
cp -r . ~/.omp/agent/extensions/nexum-omp
```

Restart `omp`. Verify with `omp models nexum`.

**Option B — point settings at it:**

```yaml
# ~/.omp/agent/config.yml
extensions:
  - /path/to/nexum-omp
```

**Option C — load once for testing:**

```sh
omp models -e ./src/index.ts nexum
```

## Model roles

After installing, point your roles at the provider, e.g.:

```yaml
# ~/.omp/agent/config.yml
modelRoles:
  default: nexum/meta-muse-spark-1.3
  smol: nexum/qwen-3.8-omni-flash:medium
  slow: nexum/qwen-3.8-max:high
  vision: nexum/qwen-3.8-max
  plan: nexum/qwen-3.8-max:xhigh
  task: nexum/meta-muse-spark-1.2
  commit: nexum/qwen-3.8-omni-flash:low
  advisor: nexum/qwen-3.8-max:xhigh
```

## Development

```sh
npm install
npm run typecheck
npm run test:load -- nexum
```

## License

MIT
