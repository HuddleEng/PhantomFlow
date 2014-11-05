(function(){

	getDataAndAppendDropdown();

	initialiseSideBar();


	function initialiseSideBar(){

		var rebaseBtn = $('#rebase');
		var imageToRebase;

		$('.navmenu').offcanvas({
			autohide: false
		})

		$( "body" ).on("screenshot", function(e){
			updateSideBar(e);
						console.log(e);
			if(e.src){
				imageToRebase = e.src;
				rebaseBtn.show();
			} else {
				rebaseBtn.hide();
			}
		});

		$(window).on('hashchange', function(){
		  	updateSideBar({});
		});

		$('#rebase').click(function(){
			$.post(window.location.origin+'/rebase', {
				'img': imageToRebase
			});
			return false;
		});
	}

	function updateSideBar(e){
		$('#vis_name').text(e.name || '');
		toggleSideBarImages(e, 'latest');
		toggleSideBarImages(e, 'original');
		toggleSideBarImages(e, 'diff');
	}

	function toggleSideBarImages(e, prop){
		var a = $('#'+prop);
		var img = $('#'+prop + ' img');

		if(e[prop]){
			a.show();
			a.attr('href', e[prop]);
			img.attr('src', e[prop]);
		} else {
			a.hide();
			a.attr('href', '');
			img.attr('src', '');
		}
	}

	function getDataAndAppendDropdown(){
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

			$('#dropdown-container').append(dropdown);

			$(dropdown).chosen();

			processHash(json);

			$(window).on('hashchange', function(){
			  	processHash(json);
			});
		});
	}

	function processHash(data){
		var hash = window.location.hash.slice( 1 );
		var searchTerm;
		var found;
		var combined;
		var promises = [];

		$('svg,.tooltip,.tooltip-label').remove();

		$(dropdown).val(hash || 'default');
		$(dropdown).trigger("chosen:updated");

		if(hash && hash.indexOf('?') !== -1){

			searchTerm = hash.split('?')[1];

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