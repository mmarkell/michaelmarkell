;(function($){

$.fn.pager = function(options){

	var settings = $.extend({
		data_container: this,	
		data_selector: null,	// this should be a string...most likely representing a CSS class
		pager_container: null,	// jquery object
		pager_selectors: {
			first: '.first',
			prev: '.prev',
			pagedisplay: '.pagedisplay',
			next: '.next',
			last: '.last',
			pagesize: '.pagesize'
		},
		page: 0,
		pagesize: 25,
		pagecount: 1,
		recordcount: 0,
		transition: null		// this will refer to the desired transition animation...eventually
	}, options);
	
	var update_pagedisplay = function(){
		var p_disp = settings.pager_container.find(settings.pager_selectors.pagedisplay) ;
		var start = (settings.page * settings.pagesize + 1);
		var end = Math.min((settings.page + 1)*settings.pagesize, settings.recordcount );
		p_disp.html(start + ' to ' + end +' (' + settings.recordcount + ')');
	}; 
	var first_page = function(){
		settings.page = 0 ;
		go_to_page();
	};
	var prev_page = function(){
		if( settings.page > 0 ) {
			settings.page-- ;
			go_to_page();
		}
	};
	var next_page = function(){
		if( settings.page < settings.pagecount ) {
			settings.page++ ;
			go_to_page();
		}
	};
	var last_page = function(){
		settings.page = settings.pagecount ;
		go_to_page() ;
	};
	var go_to_page = function(){
		var records = settings.data_container.find(settings.data_selector) ;
		records.hide();
		for(i=settings.page * settings.pagesize; i < (settings.page + 1)*settings.pagesize; i++) {
			$(records[i]).show();
		}
		update_pagedisplay();
	};
	var set_pagesize = function() {
		var old_pagesize = settings.pagesize ;
		var old_pagecount = settings.pagecount ;
		var old_page = settings.page ;
		
		settings.pagesize = settings.pager_container.find(settings.pager_selectors.pagesize).val() ;
		settings.pagecount = Math.ceil(settings.recordcount/settings.pagesize) - 1;
		settings.page = Math.floor((old_page/old_pagecount) * settings.pagecount) ;
		update_pagedisplay();
		go_to_page() ;
	}

	return this.each(function(){
		var $this = $(this) ;
		
		settings.recordcount = settings.data_container.find(settings.data_selector).length ;
		set_pagesize() ;
	
		// bind pager interface to proper methods...
		settings.pager_container.on( 'click', settings.pager_selectors.first, first_page ) ;
		settings.pager_container.on( 'click', settings.pager_selectors.prev, prev_page ) ;
		settings.pager_container.on( 'click', settings.pager_selectors.next, next_page ) ;
		settings.pager_container.on( 'click', settings.pager_selectors.last, last_page ) ;
		settings.pager_container.on( 'change', settings.pager_selectors.pagesize, set_pagesize ) ;
	
	});

};


})(jQuery);

