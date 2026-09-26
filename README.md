# nexum-omp

Nexum (Dialagram) provider extension for [omp](https://github.com/can1357/oh-my-pi).
Registers `nexum` as a first-class provider backed by the Dialagram router
(`https://dialagram.me/router/v1`, OpenAI-compatible wire).

- **`/login nexum`** — paste an API key (`dgr_…`); it is validated against
  `/v1/models` and stored in omp's auth store. Run it once per key: every
  stored credential participates in omp's multi-account selection/rotation,
  so usage-limit hits rotate to a sibling key automatically.
- **No `NEXUM_API_KEY` env fallback** — see [Auth notes](#auth-notes).
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
```

Verify:

```sh
omp models nexum
```

## Auth notes

`NEXUM_API_KEY` used to be supported as a fallback, but it is not anymore.

`apiKey` in `pi.registerProvider()` is registered as a **config override**,
which sits above stored credentials in omp's auth cascade:

```
runtime --api-key  >  config override  >  OAuth  >  /login key  >  env var  >  stored key
```

So `apiKey: "NEXUM_API_KEY"` meant every request was pinned to that one env
key — multi-key rotation never engaged — and with the variable unset the
literal string `NEXUM_API_KEY` was sent as the bearer, producing
`401 Invalid or missing API key`.

`ProviderConfig` has no `envKeys` field, so an extension-registered provider
cannot register a genuine env fallback; the cascade's env step only covers
built-in catalog providers. An empty value is not a way out either: it fails
with `No API key found` rather than falling through to the store.

Leaving `apiKey` unset lets the cascade reach the credentials from
`/login nexum`, which is what enables:

- session stickiness (a session is pinned to one key),
- round-robin across sessions,
- automatic rotation to a sibling key on usage-limit hits.

If you need a non-interactive key, use `/login nexum` once, or pass
`omp --api-key dgr_…` for a single run.

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
