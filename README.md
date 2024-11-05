# rdf-preds-summarizer [![Node.js CI](https://github.com/andrefs/rdf-preds-summarizer/actions/workflows/test.yml/badge.svg)](https://github.com/andrefs/rdf-preds-summarizer/actions/workflows/test.yml)

How to run for a knowledge graph KG:

1. Create a folder on fuseki/kgs/$KG
1. Inside fuseki/kgs/$KG put your N-Triples file and name it $KG.nt
1. cd fuseki; ./run.sh
1. tsx src/bin/proc-graph.ts (results will be saved in `proc-$KG-results.json`)
1. tsx src/bin/sum2csv.ts proc-$KG-results.json (results will be saved in `results.csv`)

## TODO

- [ ] Better integration of logs and progress bars with `log-with-statusbar` and `ololog`.
