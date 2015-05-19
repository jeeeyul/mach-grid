window.addEventListener("load", main);

function main(){

	mg = new MachGrid(document.querySelector("#grid1"));

	document.body.querySelector("#test-button-10").addEventListener("click", function(e){
		mg.dataSource = generateData(10);
	});

	document.body.querySelector("#test-button-100").addEventListener("click", function(e){
		mg.dataSource = generateData(100);
	});

	document.body.querySelector("#test-button-1k").addEventListener("click", function(e){
		mg.dataSource = generateData(1000);
	});

	document.body.querySelector("#test-button-10k").addEventListener("click", function(e){
		mg.dataSource = generateData(10000);
	});

	document.body.querySelector("#test-button-100k").addEventListener("click", function(e){
		mg.dataSource = generateData(100000);
	});

	document.body.querySelector("#test-button-1000k").addEventListener("click", function(e){
		mg.dataSource = generateData(1000000);
	});
}


function generateData(amount){
	var source = [];
	var i, j, r;

	for(i=0; i<amount; i++){
		r = source[source.length] = [i];
		for(j=0; j<19; j++){
			r[r.length] = Math.floor(Math.random()* 10000);
		}
	}

	return source;
}
