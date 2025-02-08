# rdf-hektos [![Node.js CI](https://github.com/andrefs/rdf-hektos/actions/workflows/test.yml/badge.svg)](https://github.com/andrefs/rdf-hektos/actions/workflows/test.yml)

Find predicates on an RDF whose structure forms a taxonomy, to be used in semantic measures.

## Dependencies

- docker
- Apache Jena (tdb2.tdbloader)

## Install

```
yarn install
```

## Run

How to run for a knowledge graph KG:

1. Create a folder on `fuseki/data/kgs/$KG`
1. Inside `fuseki/data/kgs/$KG` put your N-Triples file and name it `$KG.nt`
1. `(cd fuseki; ./run.sh)`
1. `yarn run proc-graph` (results will be saved in `proc-$KG-results.json`)
1. `yarn run graph-to-csv` proc-$KG-results.json (results will be saved in `results.csv`)

## Example

Run `rdf-hektos` for WordNet:

1. Download the `wordnet.nt` file (you can find it gzipped [here](http://wordnet-rdf.princeton.edu/static/wordnet.nt.gz)).
1. Unzip it if you need to.
1. Create the folder on `fuseki/kgs/wordnet` and move the `wordnet.nt` file there.
1. Run (cd fuseki; ./run.sh). This might take a couple minutes. The `wordnet.nt` file will be loaded into Apache Jena and the Fuseki container will start.
1. You should now be able to access WordNet on Fuseki at http://localhost:3030.
1. You can now run:
   1. `yarn run proc-graph`. This will take a minute and output results to `proc-wordnet-results.json`.
   1. `yarn graph-to-csv proc-wordnet-results.json`. This will output results to `results.csv`.

## TODO

- [ ] Better integration of logs and progress bars with `log-with-statusbar` and `ololog`.
