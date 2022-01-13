const Store = require('./lib/Store');

async function run(){
    const s = new Store();
    const stream = await s.select('select * where {?s ?p ?o}');
    for await (const bindings of stream){
        console.log(bindings);
    }
}

run();
