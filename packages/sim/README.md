# @hello-eme/play-sim

Plays a config with bots, without a browser, to check the balance.

```sh
npx play-sim preset:arcade --rounds 20 --seconds 300 --bot brawler --seed 1
npx play-sim ./play.json --json
```

Bots: `idle`, `brawler`, `runner`. The report shows win/death rates, score and hints such as "nobody
survives" or "too easy".
