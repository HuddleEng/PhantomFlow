(function(){

	getDataAndAppendDropdown();

	$.get(window.location.origin+'/rebase')
		.done(function(){
			initialiseSideBar(true);
		})
		.fail(function(){
			initialiseSideBar(false);
		});

	function initialiseSideBar(canRebase){

		var rebaseBtn = $('#rebase');
		var rebaseSuccessBtn = $('#rebase-success');
		var imageToRebase;
		var svgElement;
		var canRebase;

		if(!canRebase){
			rebaseBtn.remove();
		}

		$('.navmenu').offcanvas({
			autohide: false
		});

		$( "body" ).on("screenshot", function(e){
			updateSideBar(e);

			if(e.src){
				imageToRebase = e.src;
				svgElement = e.element;
				if(svgElement.className.baseVal.indexOf('screenshotFail') !== -1){
					rebaseSuccessBtn.hide();
					rebaseBtn.show();	
				} else {
					rebaseSuccessBtn.show();
				}
			} else {
				rebaseBtn.hide();
				rebaseSuccessBtn.hide();
			}
		});

		$(window).on('hashchange', function(){
		  	updateSideBar({});
		});

		rebaseBtn.click(function(){
			if(confirm("Are you sure you want to accept the latest image as the visual baseline for this test?")){
				$.post(window.location.origin+'/rebase', {
					'img': imageToRebase
				}, function(){
					rebaseBtn.hide();
					rebaseSuccessBtn.show();
					svgElement.className.baseVal = svgElement.className.baseVal.replace('screenshotFail', '');
				});	
			}
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