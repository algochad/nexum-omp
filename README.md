# nexum-omp

Nexum (Dialagram) provider extension for [omp](https://github.com/can1357/oh-my-pi).
Registers `nexum` as a first-class provider backed by the Dialagram router
(`https://dialagram.me/router/v1`, OpenAI-compatible wire).

- **`/login nexum`** — paste an API key (`dgr_…`); it is validated against
  `/v1/models` and stored in omp's auth store. Run it once per key: every
  stored credential participates in omp's multi-account selection/rotation,
  so usage-limit hits rotate to a sibling key automatically.
- **`NEXUM_API_KEY`** env var as a key fallback (resolved per request; unset
  means `/login` credentials win).
- **Static + live models** — ships the known Spark/Qwen catalog so
  `omp models nexum` works offline; a successful `GET /v1/models` fetch
  replaces/augments it (24 h model cache; `omp models refresh` forces a
  re-fetch).

## Install

```sh
omp plugin install github:algochad/nexum-omp
```

Then authenticate (repeat once per key for multi-key rotation):

```sh
/login nexum
# or: export NEXUM_API_KEY=dgr_…
```

Verify:

```sh
omp models nexum
```

Update later with `omp plugin upgrade nexum-omp`. Manual alternatives
(extensions directory copy, `extensions:` in `config.yml`, `-e` flag for one
shot) still work but are not needed.

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
