(function(){

	$.getJSON('data.js', function(json){
		
		var dropdown = $('<select id="dropdown">');

		dropdown.append('<option value="default" selected>View all</option>');

		_.forEach(json, function(value, key){
			key = key.replace(/"/g, '');
			dropdown.append('<option value="'+key+'">'+key.replace('.json', '')+'</option>');
		});

		dropdown.on('change', function(a,v){
			var val = dropdown.val();
			if(val !== 'default'){
				window.location.hash = val;
			} else {
				window.location.hash = '';
			}
		});

		$('body').append(dropdown);

		$(dropdown).chosen();

		console.log(json);

		//appendKey();

		processHash(json);

		$(window).on('hashchange', function(){
		  	processHash(json);
		});

	});


	function processHash(data){
		var hash = window.location.hash.slice( 1 );
		var searchTerm;
		var found;
		var combined;
		var promises = [];

		$('svg,.tooltip,.tooltip-label').remove();

		if(hash && hash.indexOf('?') !== -1){

			searchTerm = hash.split('?')[1];

			// combined = {
			// 	name: 'Results for ' + searchTerm,
			// 	isBranchRoot: true,
			// 	isDecisionRoot: true,
			// 	children: []
			// };

			// found = $('#dropdown *').filter(function(i, e){return e.value.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1; }).map(function(i,e){return e.value;});
			// found.each(function(i, hash){
			// 	promises.push($.get(theBuildWeWantToUse+hash).success(function(data){
			// 		combined.children.push(data);
			// 	}));
			// });

			// if(found.length){
			// 	$.when.apply($.when, promises).done(function(){
			// 		createD3Tree(combined, {
			// 			root: thisBuild,
			// 			isComplex: true
			// 		});
			// 	});
			// } else {
			// 	alert('Not found');
			// }


		} else if(hash){

			createD3Tree( $.extend(true, {}, data[hash]) , {
				root: '/'
			});
			
		} else {
			doDefault(data);
		}
	}

	function doDefault(data){
		var combined = {
			name: 'FilesApp',
			isBranchRoot: true,
			isDecisionRoot: true,
			children: []
		};

		_.forEach(data, function(value, key){
			combined.children.push(value);
			value.name = key;
		});

		createD3ClusterDendrogram( $.extend(true, {}, combined), {
			root: '/'
		});
	}

}());